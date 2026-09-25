# MFY — Movies For You

Private Windows catalog + player. Lean-back home, official title logos, and your own lists — movies, TV, anime, YouTube, sports, IPTV, manga, comics, books, and music in one app.

**Current Windows build: [v1.7.9](https://github.com/xami666999-lgtm/mfy/releases/tag/v1.7.9)**  
**Installer:** [MFY-Setup-1.7.9.exe](https://github.com/xami666999-lgtm/mfy/releases/download/v1.7.9/MFY-Setup-1.7.9.exe)

Active development branch: [`restore-168-intro`](https://github.com/xami666999-lgtm/mfy/tree/restore-168-intro)

---

## What MFY is

MFY is a desktop frontend for titles you already have rights to watch. Metadata comes from public catalogs (TMDB, AniList / Jikan, etc.). Playback uses stream URLs **you** configure (AIOStreams, a local library, an authorized service, or a direct HTTP/HLS/DASH link). It does not host files and it is not a pirate site.

Look: full-bleed home (Apple TV / Nuvio-style), TMDB wordmark logos on posters and heroes, Sora / Manrope type, dark surfaces, overlay menu instead of a permanent sidebar.

---

## Download & install (Windows)

1. Get **MFY-Setup-1.7.9.exe** from [Releases](https://github.com/xami666999-lgtm/mfy/releases/latest).
2. Run the installer. It creates a desktop + Start Menu shortcut named **MFY**.
3. First launch plays the cinematic intro, then the setup wizard if needed.
4. Later versions arrive through **in-app auto-update** (`electron-updater` + GitHub Releases + `latest.yml`). When a build is downloaded you get **Restart & install**.

Packaged `.exe` only — `npm run electron:dev` does not auto-update.

---

## iPhone / iPad wrap (Capacitor)

Same UI in an iOS WebView. Steps and TestFlight notes: **[IOS.md](IOS.md)**.

```bash
git checkout restore-168-intro
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```

Free Apple ID = run on **your** phone from Xcode (~7 days). **TestFlight for other people needs the paid Apple Developer program.** I cannot upload an `.ipa` from here.

---

## Sections (Menu)

| Section | What it does |
| --- | --- |
| **Home** | Rotating hero with TMDB title logo, cast chips, synopsis, pagination dots. Continue Watching with progress + time left. Streaming-platform tiles. Everyone’s Watching / collections. Browse hubs: Genres, Themes, Studios, Decades, World. |
| **Movies** | Same hero + row layout for films. Title logos on cards when TMDB has them. |
| **TV** | Same layout for series. Episode drawer (season list, stills, runtime, watched ticks). |
| **Anime** | Same layout for anime catalogs (TMDB + AniList / Jikan). Filler hints where wired. |
| **Calendar** | Upcoming movies / shows / anime. |
| **Manga / Comics / Books** | Print catalogs and a manga reader page. |
| **YouTube** | YouTubio-style catalogs + official YouTube embed. Optional Google sign-in window (`persist:youtube`) so *your* account session can be used for embeds. |
| **Music** | Music catalog page. |
| **Sport** | Sports rows / events catalogs. |
| **IPTV** | User-provided IPTV playlists. |
| **Library** | Watchlist, favorites, local folders you pick in Settings. |
| **Settings** | Accounts, auto-update, players, keys, profiles. |

**Menu** is the top-left button. Hide / show the rail with `[` or `Ctrl/Cmd+B`.

---

## Home & look

- Full-bleed backdrop hero (ken-burns), not a boxed poster wall
- Official **title logos** from TMDB `logo_path` (fallback to clean title text)
- Cast chips with initials
- Continue Watching landscape cards + progress bar + “Xm left”
- Streaming tiles (Netflix, Disney+, Prime Video, Apple TV, Max, Hulu, Paramount+, Peacock, Crunchyroll, …) as *where it airs* discovery, not in-app logins for those services
- Discover hubs: genres (art posters), themes, studios, decades, countries
- Overlay glass rail instead of a permanent 300px sidebar
- Launch intro with sound before the wizard / home
- Idle wall when the app sits unused
- Themes stored per profile (flat dark is the current home look)

Movies, TV, and Anime pages follow the same home pattern so the three catalogs feel like one product.

---

## Catalog & metadata

- **TMDB** — titles, posters, backdrops, logos, credits, discover filters, upcoming
- **OMDb / MDBList / ratings aggregator** — extra scores when you add keys
- **AniList / Jikan / MAL helpers** — anime metadata
- **Serializd** — TV rating / tracking hook
- **Letterboxd-style rate modal** — rate from the detail page
- **SIMKL / Trakt** — history + scrobble when you connect a token (TMDB ids)
- Search with type + year filters
- People / franchise browse
- Offline catalog fallback for empty-network starts

---

## Tracking & progress

- **Continue Watching** saved from the player to disk (`saveProgress` / `loadProgress`)
- Watchlist + favorites (local, per profile)
- Multi-profile switch in Settings
- SIMKL PIN / token flow when configured — progress syncs against TMDB ids
- Trakt token support for history / scrobble
- Serializd + in-app ratings so you can score shows without leaving MFY
- Episode panel marks watched episodes

---

## Player

- Built-in player: MP4, **HLS** (`hls.js`), **DASH** (`shaka-player`)
- Local **SRT / VTT** subs + extra subtitle providers you enable
- Intro skip helper (IntroDB timestamps when a match exists) for TV / anime
- ±10s, next, PiP, fullscreen
- Episode drawer while a series is selected
- External player option: built-in, system default, VLC, or mpv
- Playback URL comes from **your** AIOStreams URL, a configured resolver, or a URL you paste — not from MFY hosting content
- YouTube titles play in the official nocookie embed so the player path stays reliable

---

## Accounts & Settings (kept on purpose)

- Auto-update check + install from GitHub Releases
- SIMKL
- Letterboxd / Serializd rating
- Profile / account details
- TMDB / OMDb / MDBList keys (wizard or Settings)
- Optional Trakt token, AIOStreams URL, Real-Debrid key *you already own*, Jellyfin URL/key if you point at your own server
- Local folders for a personal library scan
- External player preference
- Bug report button in the rail

---

## Keyboard

| Key | Action |
| --- | --- |
| `1` | Home |
| `2` | Discover |
| `3` or `/` | Search |
| `4` | Library |
| `[` or `Ctrl/Cmd+B` | Toggle menu rail |
| `Esc` | Back |

Remote / lean-back help overlay is available from the chrome.

---

## Auto-update (how releases work)

1. Bump `version` in `package.json`.
2. Push `restore-168-intro`.
3. Run workflow **Release Windows** (`.github/workflows/release-win.yml`).
4. Job publishes `MFY-Setup-<version>.exe` + `latest.yml` on [Releases](https://github.com/xami666999-lgtm/mfy/releases).
5. Installed apps check that feed on launch.

Need Contents + Releases permission on the GitHub connection or the release upload step 403s (the Setup can still land under Actions → Artifacts).

---

## Develop

```bash
npm install
npm run electron:dev
```

Windows installer locally:

```bash
npm run build:win
```

Optional `.env`:

```
VITE_TMDB_API_KEY=your_key
```

Or paste the key in the first-run wizard. Keep secrets out of git.

Stack: Electron + Vite + React + TypeScript + Tailwind. NSIS one-click-off installer with desktop shortcut.

---

## Notes for other tools / AIs working on this repo

- Movie app repo is **`xami666999-lgtm/mfy`**. Do not mix with the separate **MFY Emulator** (RetroBat / ES-DE frontend).
- Ship UI work on **`restore-168-intro`**. `master` is an older tree.
- Home entry is `src/pages/NuvioHome.tsx` + `src/components/NuvioHero.tsx` + `src/components/HubRow.tsx`.
- Title logos: `src/components/TitleLogo.tsx` + `src/api/titleLogo.ts` + TMDB images.
- YouTube: `src/pages/YouTubePage.tsx` + `src/api/youtubio.ts` + embed fallback in `src/App.tsx`.
- Do not strip Movies / TV / Anime / Sports / IPTV / YouTube / Library when restyling.
- Do not advertise or add scrapers for copyrighted files. Play only URLs the user is allowed to use.

---

## License / use

MIT code. Artwork, title logos, and posters belong to their owners (TMDB / studios). Streaming-service marks are used only as provider badges. Watch through services and files you are authorized to use.
