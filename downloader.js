// Downloads an HLS (.m3u8) video or audio stream: picks the best variant, fetches every
// segment and saves them as a single file.

const params = new URLSearchParams(location.search);
const playlistUrl = params.get("url");
const baseName = params.get("name") || "video";

const progressEl = document.getElementById("progress");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
document.getElementById("name").textContent = baseName;

const CONCURRENCY = 6;
const RETRIES = 3;

run().catch((err) => {
  setStatus("Failed: " + err.message);
  document.title = "Download failed";
  console.error(err);
});

async function run() {
  let url = playlistUrl;
  let text = await fetchText(url);
  let audioUrl = null;
  let audioOnly = false;

  if (text.includes("#EXT-X-STREAM-INF")) {
    const master = parseMaster(text, url);
    const best = master.variants.sort((a, b) => b.bandwidth - a.bandwidth)[0];
    if (!best) throw new Error("No variants found in master playlist.");
    log(`Picked variant ${best.resolution || ""} @ ${Math.round(best.bandwidth / 1000)} kbps`);
    url = best.url;
    text = await fetchText(url);
    audioOnly = !!best.codecs && !/avc|hvc|hev|vp0?9|av01/i.test(best.codecs);
    // Some streams (e.g. Vimeo) keep audio in a separate rendition.
    const audio = master.audio.find((a) => a.groupId === best.audioGroup && a.url);
    if (audio) audioUrl = audio.url;
  }

  await downloadMediaPlaylist(text, url, baseName, audioUrl ? "video" : null, audioOnly);
  if (audioUrl) {
    await downloadMediaPlaylist(await fetchText(audioUrl), audioUrl, baseName, "audio", true);
    log("Video and audio were saved separately. Merge with:\n" +
      `ffmpeg -i "${baseName} [video].mp4" -i "${baseName} [audio].m4a" -c copy "${baseName}.mp4"`);
  }

  setStatus("Done! Check your downloads. You can close this tab.");
  document.title = "Download finished";
}

async function downloadMediaPlaylist(text, url, name, part, audioOnly = false) {
  const playlist = parseMedia(text, url);
  if (playlist.encrypted) {
    throw new Error("This stream is encrypted (" + playlist.encrypted + "), which isn't supported.");
  }

  const jobs = playlist.init ? [playlist.init, ...playlist.segments] : playlist.segments;
  const buffers = new Array(jobs.length);
  let done = 0;
  let next = 0;
  progressEl.max = jobs.length;
  progressEl.value = 0;

  const worker = async () => {
    while (next < jobs.length) {
      const i = next++;
      buffers[i] = await fetchSegment(jobs[i]);
      done++;
      progressEl.value = done;
      setStatus(`${part ? part + ": " : ""}segment ${done} / ${jobs.length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  // fMP4 streams (with an init segment) concatenate into a playable .mp4/.m4a;
  // raw .aac/.mp3 segments concatenate into that same format; MPEG-TS
  // segments concatenate into a .ts (plays in VLC, or remux with ffmpeg).
  const segExt = new URL(playlist.segments[0]?.url || url).pathname.match(/\.(aac|mp3)$/i)?.[1]?.toLowerCase();
  const ext = playlist.init ? (audioOnly ? "m4a" : "mp4") : segExt || "ts";
  const blob = new Blob(buffers);
  const blobUrl = URL.createObjectURL(blob);
  const filename = `${name}${part ? ` [${part}]` : ""}.${ext}`;
  await chrome.downloads.download({ url: blobUrl, filename });
  log(`Saved ${filename} (${(blob.size / 1048576).toFixed(1)} MB)`);
  if (ext === "ts" && !part) {
    const target = audioOnly ? `"${name}.m4a"` : `"${name}.mp4"`;
    log(`Optional, convert: ffmpeg -i "${filename}" -c copy ${target}`);
  }
}

function parseMaster(text, base) {
  const lines = text.split(/\r?\n/);
  const variants = [];
  const audio = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      const attrs = parseAttrs(line);
      let j = i + 1;
      while (j < lines.length && (!lines[j].trim() || lines[j].startsWith("#"))) j++;
      if (j < lines.length) {
        variants.push({
          url: new URL(lines[j].trim(), base).href,
          bandwidth: Number(attrs.BANDWIDTH) || 0,
          resolution: attrs.RESOLUTION,
          audioGroup: attrs.AUDIO,
          codecs: attrs.CODECS,
        });
      }
    } else if (line.startsWith("#EXT-X-MEDIA:")) {
      const attrs = parseAttrs(line);
      if (attrs.TYPE === "AUDIO") {
        audio.push({ groupId: attrs["GROUP-ID"], url: attrs.URI && new URL(attrs.URI, base).href });
      }
    }
  }
  return { variants, audio };
}

function parseMedia(text, base) {
  const lines = text.split(/\r?\n/);
  const segments = [];
  let init = null;
  let encrypted = null;
  let pendingRange = null;
  let lastEnd = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#EXT-X-KEY:")) {
      const method = parseAttrs(line).METHOD;
      if (method && method !== "NONE") encrypted = method;
    } else if (line.startsWith("#EXT-X-MAP:")) {
      const attrs = parseAttrs(line);
      init = { url: new URL(attrs.URI, base).href, range: parseRange(attrs.BYTERANGE, 0) };
    } else if (line.startsWith("#EXT-X-BYTERANGE:")) {
      pendingRange = parseRange(line.slice("#EXT-X-BYTERANGE:".length), lastEnd);
    } else if (!line.startsWith("#")) {
      segments.push({ url: new URL(line, base).href, range: pendingRange });
      if (pendingRange) lastEnd = pendingRange.end + 1;
      pendingRange = null;
    }
  }
  return { segments, init, encrypted };
}

// "length@offset" -> { start, end } (inclusive), offset defaults to previous end.
function parseRange(value, defaultStart) {
  if (!value) return null;
  const [length, offset] = value.split("@").map(Number);
  const start = Number.isFinite(offset) ? offset : defaultStart;
  return { start, end: start + length - 1 };
}

function parseAttrs(line) {
  const attrs = {};
  const body = line.slice(line.indexOf(":") + 1);
  for (const m of body.matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)) {
    attrs[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return attrs;
}

async function fetchText(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function fetchSegment({ url, range }) {
  const headers = range ? { Range: `bytes=${range.start}-${range.end}` } : {};
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers, credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      if (attempt >= RETRIES) throw new Error(`Segment failed (${err.message}): ${url}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function log(text) {
  logEl.textContent += text + "\n";
}
