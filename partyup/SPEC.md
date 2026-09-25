# PartyUp Specification Document

## Project Overview

**PartyUp** is a comprehensive, all-in-one game launcher for Windows that combines the best features of Playnite, Hydra, LuaTools, Steam Achievement Notifier, and dozens of other gaming tools into a single, extensible Electron application.

### Core Vision

> **Hydra-style launcher + downloader + torrent client + unified tool suite** — all built-in, Windows-only, Electron/React/TypeScript, full feature set from day 1.

---

## Feature Matrix

### Store Integrations
| Feature | Status | Details |
|---------|--------|---------|
| Steam Library Import | ✅ | Full library, playtime, achievements |
| Steam Depot Downloader | ✅ | LuaTools-style manifest/depot management |
| Steam Workshop Downloader | ✅ | Browse, subscribe, manage mods |
| Steam DLC Unlocker | ✅ | CreamAPI, Goldberg, Steamless integration |
| Steam Controller Config | ✅ | Steam Input profile management |
| Steam Achievement Notifier | ✅ | SAN-style custom notifications |
| Epic Games Store | ✅ | Via Heroic/Legendary integration |
| GOG Galaxy | ✅ | Library import, cloud saves |
| Ubisoft Connect | ✅ | Via Heroic |
| EA App | ✅ | Via Heroic/Legendary |

### Torrent/Download
| Feature | Status | Details |
|---------|--------|---------|
| Built-in libtorrent client | ✅ | Native torrent downloading |
| Magnet link support | ✅ | Add via UI or clipboard |
| Hydra Sources | ✅ | 7+ integrated sources |
| ARIA2 integration | ✅ | Direct download manager |
| Real-Debrid/Premiumize | ⏳ | Planned for v1.1 |

### Hydra Sources (Integrated)
1. **Hydra Official** - hydralibrary.com
2. **FitGirl Repacks** - fitgirl-repacks.site
3. **DODI Repacks** - dodi-repacks.site
4. **GOG Revived** - gog-rev.com
5. **Online Fix** - online-fix.me (multiplayer)
6. **SteamRIP** - steamrip.com
7. **AstralGames** - astralgames.net

### DLC/DRM Tools
| Tool | Status | Details |
|------|--------|---------|
| CreamAPI | ✅ | Steam DLC unlocker |
| Goldberg Emulator | ✅ | Offline Steam/MP emulator |
| Steamless | ✅ | SteamStub remover |
| Depot Downloader | ✅ | LuaTools-style manifest manager |
| GreenLuma | ⏳ | Steam family sharing unlock |

### Emulation (12+ Emulators)
| Emulator | Systems | Status |
|----------|---------|--------|
| Dolphin | GameCube, Wii | ✅ |
| RPCS3 | PS3 | ✅ |
| PCSX2 | PS2 | ✅ |
| Cemu | Wii U | ✅ |
| Ryujinx | Switch | ✅ |
| Suyu | Switch | ✅ |
| PPSSPP | PSP | ✅ |
| DuckStation | PS1 | ✅ |
| Parallel N64 | N64 | ✅ |
| Mupen64Plus | N64 | ✅ |
| Flycast | Dreamcast, Naomi, Atomiswave | ✅ |
| RetroArch | Multi-system (Libretro) | ✅ |
| Citra | 3DS | ✅ |
| Azahar | 3DS | ✅ |
| melonDS | DS | ✅ |
| Xenia | Xbox 360 | ✅ |
| Vita3K | PS Vita | ✅ |

### ROM Management
| Feature | Status |
|---------|--------|
| Metadata scraping | ✅ |
| Multi-source fallback | ✅ |
| Multi-disc handling | ✅ |
| Region detection | ✅ |
| Disc swap UI | ✅ |
| Cloud memory cards | ✅ |
| Cover/background art | ✅ |
| Playlist generation | ✅ |

### ROM Sources (Integrated)
- **ROM Heaven** - romheaven.com
- **NoPayStation** - nopaystation.com (PS3/PSP/Vita)
- **Ziperto** - ziperto.com
- **CDRomance** - cdromance.org (PS1/PSP/PS2/DC)
- **ROMhacking.net** - romhacking.net (hacks/translations)
- **Myrient/Minerva** - Archive.org mirrors
- **NSWGame/NXbrew** - nxbrew.net (Switch/3DS/Wii/WiiU)
- **hShop** - hshop.erista.me (3DS)
- **WiiUDownloader/JNUSTool** - Wii U tools

### Mod Manager (Unified)
| Source | Status | Features |
|--------|--------|----------|
| Steam Workshop | ✅ | Browse, subscribe, auto-update |
| Nexus Mods | ✅ | API integration, auth |
| Thunderstore | ✅ | BepInEx, dependency resolution |
| Modrinth | ✅ | Minecraft/Fabric/Forge |
| CurseForge | ✅ | Minecraft/ WoW addons |
| Wabbajack | ✅ | Automated modlist installer |
| GameBanana | ✅ | Community mods |
| ModDB | ✅ | General mod hosting |

### Multiplayer Clients (17+ Integrated)
| Client | Games | Status |
|--------|-------|--------|
| Plutonium | BO1, BO2, MW3, WaW | ✅ |
| AlterWare | BO3, AW, Ghosts | ✅ |
| IW4x | MW2 (2009) | ✅ |
| Northstar | Titanfall 2 | ✅ |
| CnCNet | C&C, RA, YR, TD, RA2 | ✅ |
| Venice Unleashed | BF2, BF3, BF4 | ✅ |
| SM64 Coop Deluxe | Super Mario 64 | ✅ |
| Slippi | SSB Melee | ✅ |
| Tilted Online | Skyrim, Fallout 4 | ✅ |
| NV:MP | Fallout: New Vegas | ✅ |
| Nitrox | Subnautica | ✅ |
| BeamMP | BeamNG.drive | ✅ |
| Seamless Co-op | Elden Ring | ✅ |
| RavenM | Ravenfield | ✅ |
| R1Delta | Titanfall 1 | ✅ |
| CryMP | Crysis 1 | ✅ |
| Cypress | PvZ GW 1/2 | ✅ |

### Cloud Gaming (Unified Frontend)
| Service | Type | Status |
|---------|------|--------|
| Moonlight | GameStream Client | ✅ |
| Sunshine | GameStream Host | ✅ |
| Chiaki | PS Remote Play | ✅ |
| Greenlight | xCloud enhanced | ✅ |
| Better xCloud | xCloud enhanced | ✅ |
| GeForce Now | Web wrapper | ✅ |
| Steam Link | Steam streaming | ✅ |
| Parsec | Low-latency streaming | ✅ |

### Optimization Tools (12 Integrated)
| Tool | Type | Features |
|------|------|----------|
| Special K | Optimizer | Widget, borderless, latency, HDR, FPS cap |
| Lossless Scaling | Upscaler | FSR, NIS, Frame Gen (paid) |
| OptiScaler | Upscaler | DLSS/FSR/XeSS, Frame Gen (open) |
| Magpie | Upscaler | FSR, Frame Gen (open) |
| ReShade | Post-process | Shaders, HDR, DX11 improve |
| DisplayMagician | Display profile | HDR, refresh rate, resolution |
| RTSS | Monitor | FPS, frametime, overlay |
| DLSS Swapper | DLSS manager | Version management, auto-update |
| VibranceGUI | Color | Digital vibrance, auto-detect |
| Widescreen Fixes | Widescreen | Ultrawide, multi-monitor, HUD |
| Borderless Gaming | Window mgr | Force borderless, aspect ratio |
| dxvk-gplasync | DXVK fork | Async, Vulkan, stutter reduction |

### Controller Tools
| Tool | Status |
|------|--------|
| DS4Windows | ✅ |
| Gamepadla | ✅ |
| JoystickGremlin | ✅ |
| AntiMicroX/Input Remapper | ⏳ |
| x360ce | ⏳ |
| DsHidMini | ⏳ |
| HidHide | ⏳ |

### Achievements
| Platform | Status |
|----------|--------|
| Steam | ✅ |
| RetroAchievements | ✅ |
| GOG | ✅ |
| Epic Games | ✅ |
| Xbox | ✅ |
| PlayStation | ✅ |

### Save Manager (Ludusavi-style)
| Feature | Status |
|---------|--------|
| Auto-detect save locations | ✅ |
| Backup/restore | ✅ |
| Cross-platform conversion | ✅ |
| Auto-backup on launch/exit | ✅ |
| Cloud sync (optional) | ✅ |

### Automation
| Feature | Status |
|---------|--------|
| Pre-launch scripts | ✅ |
| Post-exit scripts | ✅ |
| Per-game env vars | ✅ |
| CPU affinity/priority | ✅ |
| GPU selection | ✅ |
| Auto-apply upscaling profiles | ✅ |
| Discord Rich Presence | ✅ |

### Library Management
| Feature | Status |
|---------|--------|
| Categories, tags, custom fields | ✅ |
| Grid/List/Cover Flow/Compact views | ✅ |
| Cross-platform playtime tracking | ✅ |
| Detailed statistics | ✅ |
| Backlog/wishlist | ✅ |
| Personal ratings & notes | ✅ |
| Duplicate detection | ✅ |
| Portable app detection | ✅ |

### Social Platform
| Feature | Status |
|---------|--------|
| Unified friends (Steam/Epic/Xbox/PSN/GOG) | ✅ |
| Activity feed | ✅ |
| Join/invite friends | ✅ |
| Media sharing | ✅ |
| Community reviews | ✅ |
| Leaderboards | ✅ |

### Metadata Sources (12+ with Fallback)
1. **IGDB** (Twitch) - Weight 10
2. **Steam Web API** - Weight 9
3. **SteamGridDB** - Weight 8
4. **LaunchBox GamesDB** - Weight 7
5. **HowLongToBeat** - Weight 6
6. **PCGamingWiki** - Weight 5
7. **SteamDB** - Weight 5
8. **ProtonDB** - Weight 4
9. **DoesItPlay** - Weight 4
10. **RAWG** - Weight 3
11. **MobyGames** - Weight 3
12. **Giant Bomb** - Weight 2
13. **TheGamesDB** - Weight 2

### UI Themes (7 Built-in + Marketplace)
| Theme | Style | Inspiration |
|-------|-------|-------------|
| Hydra Dark | Modern dark | PartyUp |
| Hydra Light | Modern light | PartyUp |
| PS2 Browser | Retro | PlayStation 2 browser |
| PS3 XMB | Retro | PlayStation 3 XMB |
| Xbox 360 | Retro | Xbox 360 Dashboard |
| Wii Channel Grid | Retro | Wii/Wii U menu |
| PS1 Memory Card | Retro | PlayStation 1 memory card |

### Plugin System
- Core features built-in
- Plugin API for extensions
- Marketplace for community plugins
- Categories: store, social, ui, mods, multiplayer, cloud, optimizer, theme

---

## Technical Architecture

### Tech Stack
- **Frontend**: Electron 28 + React 18 + TypeScript 5
- **Build**: Vite 5 + electron-builder 24
- **State**: Zustand + Jotai
- **Styling**: Tailwind CSS + SCSS + CSS Variables
- **Database**: better-sqlite3 (local)
- **Torrent**: libtorrent (native node addon)
- **Steam**: steam-user, steam-tradeoffer-manager, steamcommunity
- **Auto-update**: Velopack/electron-updater
- **Testing**: Vitest + Playwright

### Project Structure
```
partyup/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # App entry point
│   │   ├── ipc/              # IPC handlers
│   │   ├── services/         # 15+ feature services
│   │   ├── database/         # SQLite database layer
│   │   ├── plugins/          # Plugin manager
│   │   └── theme/            # Theme manager
│   ├── preload/              # Preload script (secure IPC)
│   └── renderer/
│       └── src/
│           ├── components/   # Shared UI components
│           ├── features/     # Feature views (15+)
│           ├── hooks/        # Custom React hooks
│           ├── services/     # Renderer-side API
│           ├── stores/       # Zustand/Jotai stores
│           ├── types/        # TypeScript types
│           ├── utils/        # Utilities
│           └── theme/        # Theme system
├── plugins/                  # Plugin directory
├── tests/                    # Unit/Integration/E2E
├── build/                    # Build assets
└── scripts/                  # Build scripts
```

### Service Architecture
Each feature is implemented as a service class in `src/main/services/`:
- `SteamService` - Steam integration
- `TorrentService` - Torrent client + Hydra sources
- `EmulatorService` - Emulator management + ROMs
- `ModManagerService` - Unified mod manager
- `MultiplayerService` - Game-specific MP clients
- `CloudGamingService` - Streaming services
- `OptimizationService` - Per-game optimization profiles
- `AchievementService` - Multi-platform achievements
- `SaveManagerService` - Save backup/restore
- `LibraryService` - Game library management
- `SocialService` - Friends, activity, reviews
- `DiscordService` - Rich Presence
- `MetadataService` - Game metadata aggregation
- `DownloadService` - ARIA2/direct downloads

### IPC Communication
Secure context-isolated preload script exposes typed API:
```typescript
window.api.steam.getLibrary()
window.api.torrent.addMagnet(magnet)
window.api.emulator.launchRom(emulatorId, romPath)
window.api.mods.installMod(gameId, modId, source)
// ... 80+ API endpoints
```

### Database Schema (SQLite)
Key tables:
- `games` - Unified game library
- `views` - Custom library views
- `backlog` - Wishlist/backlog
- `ratings` - User ratings
- `notes` - Personal notes
- `saves` - Save file tracking
- `save_backups` - Backup history
- `mods` - Installed mods
- `mod_sources` - Mod source configs
- `torrents` - Torrent state
- `emulator_configs` - Emulator paths/settings
- `roms` - ROM library
- `optimization_profiles` - Per-game profiles
- `achievement_notifications` - Achievement history
- `themes` - Installed themes
- `plugins` - Installed plugins
- `social_friends` - Cross-platform friends
- `social_activity` - Activity feed

---

## UI/UX Specification

### Layout
- **Header** (48px): App title, search, theme toggle, user menu, window controls
- **Sidebar** (260px/64px collapsed): Navigation, status, shortcuts
- **Main Content**: Feature views with consistent patterns

### Navigation Items (13)
1. Library
2. Downloads
3. Emulation
4. Mods
5. Multiplayer
6. Cloud Gaming
7. Optimization
8. Achievements
9. Saves
10. Social
11. Plugins
12. Themes
13. Settings

### Design System
- **Colors**: CSS custom properties, themeable
- **Spacing**: 4px base unit (xs=4, sm=8, md=16, lg=24, xl=32)
- **Border Radius**: sm=4, md=8, lg=12, xl=16, full=9999
- **Shadows**: 4 levels (sm, md, lg, xl)
- **Fonts**: Inter (UI), Space Grotesk (display), JetBrains Mono (code)
- **Transitions**: fast=150ms, normal=250ms, slow=350ms

### Responsive Breakpoints
- Desktop: >1200px (full sidebar)
- Tablet: 768-1200px (collapsible sidebar)
- Mobile: <768px (overlay sidebar)

### Accessibility
- Full keyboard navigation
- ARIA labels on all interactive elements
- Focus visible outlines
- Screen reader support
- High contrast theme support
- Reduced motion support

---

## Development Roadmap

### Phase 1: Core Foundation (Months 1-3)
- [ ] Electron + React + TypeScript setup
- [ ] Plugin architecture
- [ ] Theme system (7 built-in)
- [ ] SQLite database + migrations
- [ ] Basic library views (grid/list)
- [ ] Steam library import
- [ ] Auto-updater (Velopack)

### Phase 2: Steam Power Tools (Months 3-5)
- [ ] Depot downloader / manifest manager
- [ ] Workshop downloader + mod manager
- [ ] DLC unlocker management
- [ ] Achievement notifier (SAN-style)
- [ ] Save backup (Ludusavi-lite)
- [ ] Controller config management

### Phase 3: Emulation + ROMs (Months 5-8)
- [ ] RetroArch + 3 priority emulators (Dolphin, PCSX2, DuckStation)
- [ ] ROM manager + metadata scraping
- [ ] Hydra sources integration
- [ ] Torrent client (libtorrent)
- [ ] Remaining 9+ emulators

### Phase 4: Expansion (Months 8-12)
- [ ] Epic/GOG via Heroic
- [ ] Unified mod manager (Nexus + Thunderstore)
- [ ] Multiplayer clients (Plutonium, Northstar first)
- [ ] Cloud gaming (Moonlight + Sunshine)
- [ ] Optimization profiles
- [ ] Social platform
- [ ] Discord Rich Presence

### Phase 5: Polish (Months 12+)
- [ ] Theme marketplace
- [ ] Plugin marketplace
- [ ] AI recommendations
- [ ] Cross-platform save conversion
- [ ] Mobile companion app

---

## Resource Estimates

### Solo Developer Timeline
| Phase | Duration | Features |
|-------|----------|----------|
| Phase 1 | 3 months | Core |
| Phase 2 | 2 months | Steam tools |
| Phase 3 | 3 months | Emulation |
| Phase 4 | 4 months | Expansion |
| Phase 5 | Ongoing | Polish |
| **Total** | **~12 months** | **MVP + Core Features** |

### Infrastructure Costs
- **$0/month** - Fully self-hosted
- GitHub Actions for CI/CD
- GitHub Releases for distribution
- No backend required (local-first)

### Legal Considerations
- MIT License (permissive)
- libtorrent: LGPL (dynamic linking)
- Steam API: Requires Steamworks partner account
- DLC unlockers: Plugin-isolated (legal gray area)
- Torrent client: User responsibility

---

## Success Metrics

### Launch Targets (Month 12)
- 1,000+ active users
- 50+ community themes
- 20+ community plugins
- <200ms average UI response
- <500MB RAM idle
- 60fps gamepad navigation

### Year 1 Goals
- 10,000+ users
- 200+ themes/plugins
- Feature parity with Playnite/Hydra
- Active Discord community (1,000+)
- Regular monthly releases

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Steam API changes | High | High | Versioned API wrapper, fallback |
| libtorrent LGPL compliance | Medium | High | Dynamic linking, clear license |
| DLC unlocker legal issues | Medium | Medium | Plugin isolation, user opt-in |
| Solo dev burnout | High | Critical | Phased scope, community help |
| Electron performance | Medium | Medium | Native modules, lazy loading |
| Windows-only limitation | Low | Medium | Document as design choice |

---

## Appendix: Key Integrations

### External Tools (Bundled/Downloaded)
- **Special K** - github.com/SpecialKO/SpecialK
- **Lossless Scaling** - Steam (paid)
- **OptiScaler** - github.com/optiscaler/OptiScaler
- **Magpie** - github.com/Blinue/Magpie
- **ReShade** - reshade.me
- **DisplayMagician** - github.com/Codectory/AutoActions
- **RTSS** - guru3d.com
- **DLSS Swapper** - github.com/beeradmoore/dlss-swapper
- **VibranceGUI** - github.com/clearlybroken/vibranceGUI
- **Widescreen Fixes Pack** - github.com/ThirteenAG/WidescreenFixesPack
- **Borderless Gaming** - github.com/andrewmd5/Borderless-Gaming
- **dxvk-gplasync** - gitlab.com/Ph42oN/dxvk-gplasync

### Hydra Sources API Format
```json
{
  "id": "source-id",
  "name": "Source Name",
  "url": "https://api.source.com",
  "enabled": true,
  "categories": ["repacks", "torrents", "direct"],
  "auth": "none|api_key|oauth"
}
```

### Plugin Manifest Format
```json
{
  "id": "plugin-id",
  "name": "Plugin Name",
  "version": "1.0.0",
  "author": "Author",
  "description": "Description",
  "main": "index.js",
  "category": "store|social|ui|mods|multiplayer|cloud|optimizer|theme",
  "permissions": ["steam", "torrent", "filesystem"],
  "minAppVersion": "1.0.0"
}
```

---

*Document Version: 1.0*
*Last Updated: September 2026*
*Author: PartyUp Team*
