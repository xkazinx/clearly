console.log("This is a popup!");

const scanButton = document.getElementById("scan");
const downloadAllButton = document.getElementById("downloadAll");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

let foundVideos = [];

scanButton.addEventListener("click", scanPage);
downloadAllButton.addEventListener("click", () => foundVideos.forEach(downloadVideo));

// Runs inside every frame of the page, in the page's own JS world (so player
// objects like window.playerConfig / jwplayer / videojs are reachable).
// Must be self-contained: it is serialized and injected.
function pageScanner() {
  const MEDIA_EXT = /\.(m3u8|mpd|mp4|m4v|webm|mov|mkv|mp3|m4a|m4b|aac|ogg|oga|opus|wav|flac|wma)$/i;
  const items = [];
  const wistiaIds = new Set();

  const add = (url, source, extra = {}) => {
    if (!url || typeof url !== "string") return;
    try {
      url = new URL(url, location.href).href;
    } catch {
      return;
    }
    if (!/^https?:/i.test(url)) return; // skip blob:, data:, etc.
    items.push({ url, source, ...extra });
  };

  const isMediaUrl = (url) => {
    try {
      return MEDIA_EXT.test(new URL(url, location.href).pathname);
    } catch {
      return false;
    }
  };

  // querySelectorAll that also descends into open shadow roots.
  const deepQuery = (selector, root = document) => {
    const out = [...root.querySelectorAll(selector)];
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) out.push(...deepQuery(selector, el.shadowRoot));
    }
    return out;
  };

  // 1. <video>/<audio>/<source> elements with a real (non-blob) src.
  for (const v of deepQuery("video, audio")) {
    const tag = v.tagName.toLowerCase();
    add(v.currentSrc, `${tag} element`);
    add(v.src, `${tag} element`);
    add(v.getAttribute("data-src"), `${tag} element`);
    for (const s of v.querySelectorAll("source")) add(s.src, `${tag} source`);
  }

  // 2. Known players.
  const wistiaIdRe = /wistia_async_([a-z0-9]{10})\b/gi;
  for (const el of deepQuery("[class*='wistia_async_']")) {
    for (const m of el.className.matchAll(wistiaIdRe)) wistiaIds.add(m[1]);
  }
  try {
    for (const v of window.Wistia?.api?.all?.() || []) wistiaIds.add(v.hashedId());
  } catch {}

  try {
    const files = window.playerConfig?.request?.files; // Vimeo iframe player
    if (files) {
      const title = window.playerConfig.video?.title;
      const best = [...(files.progressive || [])].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
      if (best) add(best.url, "Vimeo", { quality: best.quality, title });
      const hls = files.hls;
      if (hls?.cdns) {
        const cdn = hls.cdns[hls.default_cdn] || Object.values(hls.cdns)[0];
        add(cdn?.avc_url || cdn?.url, "Vimeo", { title });
      }
    }
  } catch {}

  try {
    if (typeof window.jwplayer === "function") {
      for (const entry of window.jwplayer().getPlaylist() || []) {
        for (const s of entry.sources || []) add(s.file, "JW Player", { title: entry.title });
        add(entry.file, "JW Player", { title: entry.title });
      }
    }
  } catch {}

  try {
    for (const p of Object.values(window.videojs?.getPlayers?.() || {})) {
      if (p) add(p.currentSrc(), "video.js");
    }
  } catch {}

  // 3. Network requests already made by the page. This is what defeats
  //    MediaSource/blob: players: the manifest was fetched even if hidden.
  for (const entry of performance.getEntriesByType("resource")) {
    if (isMediaUrl(entry.name)) add(entry.name, "network");
  }

  // 4. URLs buried in the HTML/scripts, including escaped or encoded ones.
  const html = document.documentElement.outerHTML;
  const texts = [html, html.replace(/\\\//g, "/").replace(/\\u002F/gi, "/")];
  for (const m of html.matchAll(/https?%3A%2F%2F[^"'\s<>&]+/gi)) {
    try { texts.push(decodeURIComponent(m[0])); } catch {}
  }
  for (const m of html.matchAll(/aHR0c[A-Za-z0-9+/=]{10,}/g)) { // base64 of "http"
    try { texts.push(atob(m[0])); } catch {}
  }
  const urlRe = /https?:\/\/[^"'\s<>\\)]+/gi;
  for (const text of texts) {
    for (const m of text.matchAll(urlRe)) {
      const url = m[0];
      const wistia = url.match(/wistia\.(?:com|net)\/(?:embed\/(?:iframe|medias)|medias)\/([a-z0-9]{10})\b/i);
      if (wistia) wistiaIds.add(wistia[1]);
      else if (isMediaUrl(url)) add(url, "page source");
    }
    for (const m of text.matchAll(wistiaIdRe)) wistiaIds.add(m[1]);
  }

  return {
    isTop: window === window.top,
    title: document.title,
    items,
    wistiaIds: [...wistiaIds],
  };
}

async function scanPage() {
  resultsEl.textContent = "";
  downloadAllButton.hidden = true;
  foundVideos = [];
  setStatus("Scanning page...");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let frames;
  try {
    frames = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      world: "MAIN",
      func: pageScanner,
    });
  } catch (err) {
    try {
      frames = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: pageScanner,
      });
    } catch (err2) {
      setStatus("Can't scan this page: " + err2.message);
      return;
    }
  }

  const results = frames.map((f) => f.result).filter(Boolean);
  const pageTitle = results.find((r) => r.isTop)?.title || tab.title || "video";

  const wistiaIds = new Set(results.flatMap((r) => r.wistiaIds));
  const candidates = [];

  setStatus("Resolving players...");
  for (const id of wistiaIds) {
    const video = await resolveWistia(id);
    if (video) candidates.push(video);
  }

  const seen = new Set();
  for (const item of results.flatMap((r) => r.items)) {
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    // Wistia media are already resolved to their MP4 files above.
    if (wistiaIds.size && /wistia\.(com|net)/i.test(item.url)) continue;
    candidates.push({
      url: item.url,
      kind: kindOf(item.url),
      ext: kindOf(item.url) === "hls" ? "ts" : extOf(item.url),
      label: [item.title, item.source, item.quality].filter(Boolean).join(" · "),
      title: item.title,
    });
  }

  foundVideos = candidates.map((c, i) => ({
    ...c,
    filename: buildFilename(c.title || pageTitle, candidates.length > 1 ? i + 1 : 0, c.ext),
  }));

  if (!foundVideos.length) {
    setStatus("No videos or audio found. Try playing the media first, then scan again.");
    return;
  }

  setStatus(`Found ${foundVideos.length} file(s).`);
  downloadAllButton.hidden = foundVideos.length < 2;
  foundVideos.forEach(renderVideo);
}

// Wistia exposes the media's renditions (including the original upload) as JSON.
async function resolveWistia(id) {
  const stream = {
    url: `https://fast.wistia.com/embed/medias/${id}.m3u8`,
    kind: "hls",
    ext: "ts",
    label: "Wistia · HLS stream",
    title: null,
  };
  try {
    const res = await fetch(`https://fast.wistia.com/embed/medias/${id}.json`);
    const { media } = await res.json();
    const isAudio = /audio/i.test(media.type || "");
    const wanted = isAudio ? /mp3|audio|aac|m4a/i : /mp4/i;
    const files = (media.assets || []).filter(
      (a) => a.url && (a.type === "original" || wanted.test(a.type) || wanted.test(a.container || ""))
    );
    const best =
      files.find((a) => a.type === "original") ||
      files.sort((a, b) => (b.width || b.bitrate || 0) - (a.width || a.bitrate || 0))[0];
    if (!best) return stream;

    // The original keeps the uploaded file's format, which the media name usually reveals.
    const nameExt = (media.name || "").match(/\.([a-z0-9]{2,4})$/i)?.[1]?.toLowerCase();
    const ext = (best.type === "original" && MEDIA_EXTS.includes(nameExt) && nameExt) ||
      (isAudio ? "mp3" : "mp4");
    return {
      url: best.url.replace(/^http:/, "https:"),
      kind: "file",
      ext,
      label: `Wistia ${isAudio ? "audio" : "video"} · ${best.display_name || best.type} ${best.width ? best.width + "x" + best.height : ""}`.trim(),
      title: null,
    };
  } catch (err) {
    console.warn("Wistia lookup failed", id, err);
    return stream;
  }
}

const MEDIA_EXTS = ["mp4", "m4v", "webm", "mov", "mkv", "mp3", "m4a", "m4b", "aac", "ogg", "oga", "opus", "wav", "flac", "wma"];

function extOf(url) {
  const ext = new URL(url).pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  return MEDIA_EXTS.includes(ext) ? ext : "mp4";
}

function kindOf(url) {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mpd")) return "dash";
  return "file";
}

function buildFilename(title, index, ext) {
  const clean = title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 120) || "media";
  const suffix = index ? ` (${index})` : "";
  return `${clean}${suffix}.${ext}`;
}

function downloadVideo(video) {
  if (video.kind === "hls") {
    // Segmented streams are stitched together in a dedicated tab so the work
    // survives the popup closing.
    const params = new URLSearchParams({ url: video.url, name: video.filename.replace(/\.ts$/, "") });
    chrome.tabs.create({ url: `downloader.html?${params}`, active: false });
    return;
  }
  if (video.kind === "dash") {
    setStatus("DASH (.mpd) streams aren't supported. Use Copy URL with yt-dlp.");
    return;
  }
  chrome.downloads.download({ url: video.url, filename: video.filename });
}

function renderVideo(video) {
  const box = document.createElement("div");
  box.className = "video";

  const label = document.createElement("div");
  label.className = "label";
  label.textContent = video.label || video.kind.toUpperCase();

  const name = document.createElement("div");
  name.textContent = video.filename;

  const url = document.createElement("div");
  url.className = "url";
  url.textContent = video.url;

  const actions = document.createElement("div");
  actions.className = "actions";

  const download = document.createElement("button");
  download.textContent = "Download";
  download.addEventListener("click", () => downloadVideo(video));

  const copy = document.createElement("button");
  copy.textContent = "Copy URL";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(video.url);
    copy.textContent = "Copied!";
  });

  actions.append(download, copy);
  box.append(label, name, url, actions);
  resultsEl.append(box);
}

function setStatus(text) {
  statusEl.textContent = text;
}
