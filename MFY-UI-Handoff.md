# MFY — Final UI / Player Handoff

## Visual target

MFY is matched to the supplied desktop mockup direction: black/purple background, restrained neon-pink accents, horizontal navigation, bordered cinematic hero, provider strip directly below it, and large horizontal poster rows.

## Logos / icons

`public/logos/` contains:
- netflix.png
- disney-plus.png
- paramount-plus.png
- hulu.png
- peacock.png
- bbc-iplayer.png
- apple-tv.png
- max.png
- amazon-prime.png
- crunchyroll.png

`public/icons/` contains 16/32/48/64/128/256/512 PNG sizes and `mfy.ico`.

The newly supplied pink MFY film/play image is used as the desktop icon, favicon, tray source and `public/assets/avatar.png`.

## Player

`src/pages/PlayerPage.tsx` supports direct MP4/browser media, HLS via hls.js, DASH via Shaka Player, local SRT/VTT subtitles, seek, volume, fullscreen and test URLs.

Torrent acquisition, scraping and DRM/access-control bypass are deliberately not included. The player accepts stream URLs from services the user is authorized to use.

## Catalog

TMDB remains the broad metadata index and Discover is paginated. `src/api/jellyfin.ts` provides an optional local Jellyfin library API foundation.

## Build

`package.json` now points electron-builder at `public/icons/mfy.ico`.

Run:

```bash
npm install
npm run build:win
```

The build environment used for this handoff had no npm registry access, so dependency installation/build verification could not be completed here. `hls.js` and `shaka-player` are declared in `package.json`; `npm install` will resolve them and update the lockfile.
