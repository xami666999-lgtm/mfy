export interface Game {
  id: string;
  name: string;
  platform: string;
  path?: string;
  executable?: string;
  args?: string[];
  cover?: string;
  background?: string;
  icon?: string;
  playtime?: number;
  lastPlayed?: string;
  installed?: boolean;
  hidden?: boolean;
  favorite?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GameView {
  id: string;
  name: string;
  type: 'grid' | 'list' | 'cover-flow' | 'compact';
  filters: Record<string, any>;
  sort: string;
  columns?: string[];
}

export interface Torrent {
  hash: string;
  name: string;
  magnet?: string;
  path?: string;
  progress: number;
  status: 'downloading' | 'seeding' | 'paused' | 'stopped' | 'error' | 'completed';
  downloadSpeed: number;
  uploadSpeed: number;
  peers: number;
  seeds: number;
  downloadDir?: string;
  createdAt: string;
  completedAt?: string;
}

export interface HydraSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface Emulator {
  id: string;
  name: string;
  systems: string[];
  path: string;
  args: string;
  installed: boolean;
  cores?: string[];
}

export interface Rom {
  id: string;
  system: string;
  name: string;
  path: string;
  size?: number;
  crc32?: string;
  md5?: string;
  sha1?: string;
  cover?: string;
  metadata?: Record<string, any>;
  emulatorId?: string;
  core?: string;
  lastPlayed?: string;
  playtime?: number;
  favorite?: boolean;
  tags?: string[];
  createdAt?: string;
}

export interface RomSource {
  id: string;
  name: string;
  systems: string[];
  url: string;
  type?: 'site' | 'archive' | 'tool';
}

export interface Mod {
  id: string;
  gameId: string;
  sourceId: string;
  sourceModId: string;
  name: string;
  version?: string;
  description?: string;
  enabled: boolean;
  loadOrder: number;
  installedAt?: string;
  updatedAt?: string;
}

export interface ModSource {
  id: string;
  name: string;
  type: 'workshop' | 'nexus' | 'thunderstore' | 'modrinth' | 'curseforge' | 'modlist' | 'community';
  apiUrl?: string;
  authToken?: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface MultiplayerClient {
  id: string;
  name: string;
  games: string[];
  installed: boolean;
  path: string;
}

export interface CloudGamingService {
  id: string;
  name: string;
  type: 'gamestream' | 'gamestream-host' | 'ps-remote-play' | 'xcloud' | 'web' | 'steam' | 'streaming';
  installed: boolean;
  path?: string;
  host?: string;
  port?: number;
  url?: string;
}

export interface OptimizationProfile {
  id: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  games: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OptimizationTool {
  id: string;
  name: string;
  type: 'optimizer' | 'upscaler' | 'post-process' | 'display-profile' | 'monitor' | 'dlss-manager' | 'color' | 'widescreen' | 'window-manager' | 'dxvk';
  installed: boolean;
  path: string;
  features: string[];
  paid?: boolean;
  openSource?: boolean;
}

export interface Achievement {
  id: string;
  gameId: string;
  platform: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rarity?: number;
  hidden?: boolean;
}

export interface SaveFile {
  id: string;
  gameId: string;
  name: string;
  path: string;
  platform?: string;
  size?: number;
  modifiedAt?: string;
  backedUp?: boolean;
  backupPath?: string;
}

export interface SocialFriend {
  id: string;
  platform: string;
  platformId: string;
  name: string;
  avatar?: string;
  status?: string;
  currentGame?: string;
  lastSeen?: string;
}

export interface SocialActivity {
  id: string;
  friendId: string;
  type: string;
  gameId?: string;
  gameName?: string;
  details?: string;
  timestamp: string;
}

export interface Review {
  id: string;
  gameId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  helpful: number;
  funny: number;
  date: string;
  hoursPlayed?: number;
}

export interface Theme {
  id: string;
  name: string;
  type: 'builtin' | 'retro' | 'custom';
  author: string;
  version: string;
  data: ThemeData;
}

export interface ThemeData {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, string>;
  fonts: Record<string, string>;
  transitions: Record<string, string>;
  backgroundPattern?: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  main: string;
  enabled: boolean;
  config?: Record<string, any>;
  category: string;
  downloads: number;
  rating: number;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number | string;
  children?: SidebarNavItem[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface Settings {
  general: {
    language: string;
    theme: string;
    autoStart: boolean;
    minimizeToTray: boolean;
    closeToTray: boolean;
    checkUpdates: boolean;
    betaUpdates: boolean;
  };
  steam: {
    enabled: boolean;
    apiKey: string;
    autoLogin: boolean;
    trackPlaytime: boolean;
    syncCloudSaves: boolean;
  };
  torrent: {
    enabled: boolean;
    downloadPath: string;
    maxConnections: number;
    maxDownloadSpeed: number;
    maxUploadSpeed: number;
    hydraSources: string[];
  };
  emulators: {
    paths: Record<string, string>;
    autoDetect: boolean;
    retroArchPath: string;
  };
  library: {
    paths: string[];
    autoScan: boolean;
    scanInterval: number;
    portableScan: boolean;
  };
  cloudGaming: {
    services: Record<string, any>;
  };
  optimization: {
    profiles: Record<string, any>;
    autoApply: boolean;
  };
  social: {
    enabled: boolean;
    platforms: string[];
    showActivity: boolean;
    showRichPresence: boolean;
  };
  discord: {
    enabled: boolean;
    richPresence: boolean;
    showGameDetails: boolean;
  };
  updates: {
    autoCheck: boolean;
    autoDownload: boolean;
    channel: 'stable' | 'beta';
  };
  plugins: {
    enabled: string[];
    marketplace: boolean;
  };
  advanced: {
    hardwareAcceleration: boolean;
    devTools: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    customArgs: string;
  };
}

export interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized?: boolean;
  fullscreen?: boolean;
}

export type { Theme as ThemeType };
