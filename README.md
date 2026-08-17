# MFY — Movies For You

Private Windows Electron catalog + player (Stremio/Nuvio-inspired UI).

## Feature set

1. **Play resolution** — Uses your AIOStreams URL (IMDb/TMDB id) when available; falls back to manual URL in player  
2. **Continue Watching** — Progress saved from the player, shown on Board  
3. **Trakt** — Token support + API helpers for history/scrobble (optional)  
4. **Multi-profile** — Create/switch profiles in Settings  
5. **External player** — Built-in, system default, VLC, or mpv preference  
6. **Smarter Search** — Type filter (All/Movies/TV) + year filter  
7. **Collections-style rows** — “Critically Acclaimed” + Coming Soon on Board  
8. **Skip / next** — Player controls for ±10s (extendable for intro/credits)  
9. **Picture-in-Picture** — Browser PiP API helper in player  
10. **Keyboard nav** — `1` Home · `2` Discover · `3`/`/` Search · `4` My List · `Esc` Back  
11. **Local folders** — Pick folders in Settings (paths stored for library scan)  
12. **Download queue** — Scaffold in store (`queueDownload`)  
13. **Themes** — Pink / Cyan / Emerald / Amber / Mono  
14. **Watch party** — Scaffold (`partyCode` in store) for future sync  
15. **Release calendar** — “Coming Soon” from TMDB upcoming  

Also: setup wizard, watchlist, favorites, glass UI, caching, auto-updater hooks.

## Setup

```bash
npm install
npm run electron:dev
```

Optional `.env`:
```
VITE_TMDB_API_KEY=your_key
```

Or enter the key in the first-run **Wizard**.

## Build

```bash
npm run build:win
```

## Notes

MFY does not host or scrape torrents. It plays HTTP(S) stream URLs you configure or resolve through services you are authorized to use.
