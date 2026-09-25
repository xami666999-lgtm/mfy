# PartyUp

<p align="center">
  <img src="build/icon.png" alt="PartyUp Logo" width="128" height="128">
</p>

<p align="center">
  <strong>The ultimate unified game launcher for Windows</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## 🎮 Overview

**PartyUp** is a comprehensive, all-in-one game launcher that combines the best features of Playnite, Hydra, LuaTools, Steam Achievement Notifier, and dozens of other gaming tools into a single, extensible Electron application.

Built for Windows with a focus on performance, customization, and unified gaming workflows.

---

## ✨ Features

### 🎯 Core Launcher
- **Unified Library** - Steam, Epic, GOG, Ubisoft, EA all in one place
- **Multiple Views** - Grid, List, Cover Flow, Compact
- **Advanced Organization** - Categories, tags, custom fields, smart collections
- **Cross-Platform Playtime** - Track hours across all platforms
- **Backlog & Wishlist** - Never forget a game

### 🛠 Steam Power Tools
- **Depot Downloader** - Download specific Steam depots (LuaTools-style)
- **Workshop Manager** - Browse, subscribe, auto-update Steam Workshop mods
- **DLC Unlocker** - Manage CreamAPI, Goldberg, Steamless
- **Achievement Notifier** - Custom SAN-style notifications
- **Controller Configs** - Steam Input profile management
- **Cloud Save Backup** - Ludusavi-style backup/restore

### 🎮 Emulation (12+ Emulators)
| Emulator | Systems |
|----------|---------|
| Dolphin | GameCube, Wii |
| RPCS3 | PS3 |
| PCSX2 | PS2 |
| Cemu | Wii U |
| Ryujinx/Suyu | Switch |
| PPSSPP | PSP |
| DuckStation | PS1 |
| Parallel/Mupen64Plus | N64 |
| Flycast | Dreamcast, Naomi |
| RetroArch | Multi-system (Libretro) |
| Citra/Azahar | 3DS |
| melonDS | DS |
| Xenia | Xbox 360 |
| Vita3K | PS Vita |

### 📦 ROM Management
- **Metadata Scraping** - 12+ sources with fallback (IGDB, Steam, LaunchBoxDB, etc.)
- **Hydra Sources** - 7 integrated sources (FitGirl, DODI, GOG Revived, etc.)
- **Multi-disc & Region Support** - Automatic handling
- **Cloud Memory Cards** - Sync saves across devices
- **Disc Swap UI** - Native multi-disc navigation

### 🔧 Mod Manager (Unified)
- **Steam Workshop** - Native integration
- **Nexus Mods** - API with authentication
- **Thunderstore** - BepInEx, dependency resolution
- **Modrinth/CurseForge** - Minecraft & more
- **Wabbajack** - Automated modlist installer
- **GameBanana/ModDB** - Community mods

### 🌐 Multiplayer (17+ Clients)
- Plutonium (BO1/BO2/MW3/WaW)
- AlterWare (BO3/AW/Ghosts)
- IW4x (MW2 2009)
- Northstar (Titanfall 2)
- CnCNet (C&C/RA/YR)
- Venice Unleashed (BF2/3/4)
- SM64 Coop Deluxe
- Slippi (SSB Melee)
- Tilted Online (Skyrim/FO4)
- NV:MP, Nitrox, BeamMP, Seamless Co-op, and more

### ☁️ Cloud Gaming (Unified)
- Moonlight / Sunshine (GameStream)
- Chiaki (PS Remote Play)
- Greenlight / Better xCloud
- GeForce Now / Steam Link / Parsec

### ⚡ Optimization (12 Tools)
Special K, Lossless Scaling, OptiScaler, Magpie, ReShade, DisplayMagician, RTSS, DLSS Swapper, VibranceGUI, Widescreen Fixes, Borderless Gaming, dxvk-gplasync

### 🏆 Achievements & Social
- **Platforms**: Steam, RetroAchievements, GOG, Epic, Xbox, PSN
- **Rarity/Leaderboards** - SteamHunters-style
- **Unified Friends** - Cross-platform
- **Activity Feed** - See what friends play
- **Reviews & Ratings** - Backloggd-style

### 🎨 Themes (7 Built-in + Marketplace)
- Hydra Dark/Light (Modern)
- PS2 Browser, PS3 XMB, Xbox 360, Wii Channel Grid, PS1 Memory Card (Retro)
- Full theme editor + marketplace

### 🔌 Plugin System
- Core features built-in
- Extensible plugin API
- Community marketplace

---

## 🚀 Installation

### Download (Recommended)
Download the latest installer from [GitHub Releases](https://github.com/PartyUp/partyup/releases).

### Portable
Download the portable version - no installation required, runs from USB.

### Package Managers (Coming Soon)
```bash
# Winget
winget install PartyUp.PartyUp

# Scoop
scoop install partyup

# Chocolatey
choco install partyup
```

---

## 💻 Development

### Prerequisites
- Node.js 20+
- Git
- Windows 10/11 (for development)
- Rust toolchain (for native modules)

### Setup
```bash
# Clone the repository
git clone https://github.com/PartyUp/partyup.git
cd partyup

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Create Windows installer
npm run package:win
```

### Project Structure
```
partyup/
├── src/
│   ├── main/           # Electron main process (15+ services)
│   ├── preload/        # Secure IPC bridge
│   └── renderer/       # React + TypeScript UI
│       └── src/
│           ├── components/  # Shared UI
│           ├── features/    # 15+ feature views
│           ├── hooks/       # Custom hooks
│           ├── stores/      # Zustand/Jotai state
│           ├── types/       # TypeScript definitions
│           └── utils/       # Utilities
├── plugins/            # Plugin directory
├── tests/              # Unit/Integration/E2E
├── build/              # Build assets (icons, installer)
└── scripts/            # Build scripts
```

### Key Commands
```bash
npm run dev              # Start dev (main + renderer)
npm run dev:main         # Watch main process
npm run dev:renderer     # Vite dev server
npm run build            # Production build
npm run test             # Unit tests
npm run test:e2e         # Playwright E2E tests
npm run lint             # ESLint + Prettier
npm run typecheck        # TypeScript check
```

---

## 🏗 Architecture

### Main Process Services (15+)
Each feature is a service class:
- `SteamService` - Steam integration
- `TorrentService` - libtorrent + Hydra sources
- `EmulatorService` - 12+ emulators + ROMs
- `ModManagerService` - Unified mod manager
- `MultiplayerService` - Game-specific MP clients
- `CloudGamingService` - Streaming services
- `OptimizationService` - Per-game profiles
- `AchievementService` - 6 platforms
- `SaveManagerService` - Backup/restore
- `LibraryService` - Game library
- `SocialService` - Friends/activity
- `DiscordService` - Rich Presence
- `MetadataService` - 12+ metadata sources
- `DownloadService` - ARIA2/direct
- `PluginManager` / `ThemeManager`

### IPC Communication
Secure context-isolated preload exposes 80+ typed API endpoints:
```typescript
window.api.steam.getLibrary()
window.api.torrent.addMagnet(magnet)
window.api.emulator.launchRom(emulatorId, romPath)
window.api.mods.installMod(gameId, modId, source)
// ...
```

### Database (SQLite)
- Games, views, backlog, ratings, notes
- Saves, backups, mods, torrents
- Emulator configs, ROMs, optimization profiles
- Themes, plugins, social data

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) first.

### Ways to Contribute
- 🐛 Bug reports & feature requests
- 📝 Documentation improvements
- 🎨 Theme creation
- 🔌 Plugin development
- 🌍 Translations (i18n coming soon)
- 💻 Code contributions

### Development Workflow
1. Fork & clone
2. Create feature branch
3. Make changes with tests
4. Run `npm run lint` && `npm run typecheck`
5. Submit PR

---

## 📄 License

**MIT License** - see [LICENSE](LICENSE) for details.

### Third-Party Licenses
- **libtorrent** - LGPL (dynamically linked)
- **Electron** - MIT
- **React** - MIT
- All other dependencies - MIT/Apache-2.0/BSD

---

## 🙏 Acknowledgments

Inspired by and built upon the work of:
- **PartyUp** - hydralauncher.gg
- **Playnite** - playnite.link
- **LuaTools** - lua.tools
- **Steam Achievement Notifier** - github.com/SteamAchievementNotifier
- **Heroic Games Launcher** - heroicgameslauncher.com
- **Ludusavi** - github.com/mtkennerly/ludusavi
- **Special K** - github.com/SpecialKO/SpecialK
- **RetroArch** - libretro.com
- And dozens of other amazing open-source projects

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/PartyUp/partyup/issues)
- **Discord**: [Join our server](https://discord.gg/PartyUp)
- **Discussions**: [GitHub Discussions](https://github.com/PartyUp/partyup/discussions)

---

<p align="center">
  Made with ❤️ by the PartyUp Team
</p>
