# Clearly

A Chrome extension (Manifest V3) that strips distractions from social sites and downloads the videos a page plays.

## Cleaner feeds (`scripts/content.js`)

- **Instagram:** only posts from accounts you follow (suggested posts and posts from people you don't follow are covered; click a cover to see the post), a "Following" button for the following-only feed, no right panel or messages popup, space between posts, dark mode.
- **Facebook:** ads covered (click to show), no stories, reels or side panels, space between posts.
- **LinkedIn:** fixed left and right panels, space between posts.
- **Discord, WhatsApp Web, YouTube:** clutter hidden (Nitro / Shop, Discover, "Active now", unused group chats...).

## Video and audio downloader (popup)

Click the extension's icon, then **Download videos & audio**: it scans every frame of the page (`<video>` / `<audio>` tags, known players, the page's network requests, URLs in its scripts, Wistia media) and lists what it finds, each with its own download button, or **Download all**. HLS streams (`.m3u8`) are fetched segment by segment in their own tab (`downloader.html`) and saved as one file; encrypted streams are not supported.

## Install

`chrome://extensions` → Developer mode → **Load unpacked** → this folder.
