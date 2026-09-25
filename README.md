# MFY — Movies For You

Windows catalog + player. Lean-back home, official title logos, movies / TV / anime, YouTube, sports, IPTV, manga, comics, books, and music.

> The live app lives on branch **[`restore-168-intro`](https://github.com/xami666999-lgtm/mfy/tree/restore-168-intro)**.  
> Installers are on **[Releases](https://github.com/xami666999-lgtm/mfy/releases)**.

**Current Windows build: [v1.7.9](https://github.com/xami666999-lgtm/mfy/releases/tag/v1.7.9)**  
**Installer:** [MFY-Setup-1.7.9.exe](https://github.com/xami666999-lgtm/mfy/releases/download/v1.7.9/MFY-Setup-1.7.9.exe)

---

## What MFY is

A desktop frontend for titles you already have rights to watch. Metadata comes from public catalogs (TMDB, AniList / Jikan, and similar). Playback uses stream URLs **you** configure. MFY does not host files.

Look: full-bleed home (Apple TV / Nuvio-style), TMDB wordmark logos, Sora / Manrope type, dark surfaces, overlay **Menu** instead of a permanent sidebar.

---

## Download (Windows)

1. Get **MFY-Setup-1.7.9.exe** from [Releases](https://github.com/xami666999-lgtm/mfy/releases/latest).
2. Install. Desktop + Start Menu shortcut: **MFY**.
3. First launch plays the intro, then the wizard if needed.
4. Later versions install through in-app auto-update from this repo’s Releases.

---

## Features

### Home & look
- Rotating full-bleed hero with TMDB **title logo**, cast chips, synopsis, dots
- Continue Watching with progress bar and time left
- Streaming-platform tiles (where a title airs — not those apps’ logins)
- Everyone’s Watching / collection rows
- Hubs: Genres, Themes, Studios, Decades, World
- Same pattern on Movies, TV, and Anime pages
- Launch intro with sound
- Overlay menu (`[` or `Ctrl/Cmd+B`)

### Sections
Home · Movies · TV · Anime · Calendar · Manga · Comics · Books · YouTube · Music · Sport · IPTV · Library · Settings

### Catalog
- TMDB posters, backdrops, logos, credits, discover, upcoming
- Extra scores via OMDb / MDBList when you add keys
- Anime metadata via AniList / Jikan
- Search with type + year filters
- People and franchise browse

### Tracking
- Continue Watching saved on disk
- Watchlist + favorites per profile
- Multi-profile
- SIMKL / Trakt when connected
- Serializd + in-app rate modal (Letterboxd-style scores)
- Episode drawer: seasons, stills, runtime, watched ticks

### Player
- MP4, HLS, DASH
- Local SRT / VTT + optional subtitle sources
- Intro skip when IntroDB has a match (TV / anime)
- Built-in, system default, VLC, or mpv
- YouTube via official embed + optional Google sign-in session

### Settings kept on purpose
Auto-update · SIMKL · Letterboxd / Serializd · account / profiles · API keys · optional Trakt, AIOStreams URL, your Real-Debrid key, your Jellyfin server · local folders · external player

### Keyboard
`1` Home · `2` Discover · `3`/`/` Search · `4` Library · `[` menu · `Esc` back

---

## Develop (current app)

```bash
git clone https://github.com/xami666999-lgtm/mfy.git
cd mfy
git checkout restore-168-intro
npm install
npm run electron:dev
```

Build installer: `npm run build:win`  
CI: `.github/workflows/release-win.yml` on `restore-168-intro`.

Full feature write-up and AI handoff notes: [README on restore-168-intro](https://github.com/xami666999-lgtm/mfy/blob/restore-168-intro/README.md).

---

## License / use

MIT code. Posters and title logos belong to their owners. Watch through services and files you are authorized to use.
