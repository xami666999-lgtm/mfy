export interface Game {
  id: string;
  name: string;
  platform: string;
  filePath: string;
  emulatorId?: string;
  artworkUrl?: string;
  backgroundUrl?: string;
  description?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  genre?: string[];
  region?: string;
  isFavorite: boolean;
  lastPlayed?: number;
  playtime: number;
  launchCount: number;
  savePaths?: string[];
  gameSettings?: GameSettings;
  emulatorSettings?: Record<string, any>;
  controllerProfileId?: string;
  addedAt: number;
  updatedAt: number;
}

export interface GameSettings {
  resolution?: string;
  fullscreen?: boolean;
  vsync?: boolean;
  internalResolution?: string;
  renderer?: string;
  audioBackend?: string;
  fpsLimit?: number;
  launchArgs?: string;
  customConfig?: Record<string, any>;
}

export interface System {
  id: string;
  name: string;
  shortName: string;
  manufacturer: string;
  generation: number;
  releaseYear: number;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  backgroundUrl?: string;
  color?: string;
  extensions: string[];
  biosFiles?: BiosFile[];
  defaultEmulatorId?: string;
  gameCount: number;
  recentlyPlayed?: Game[];
  isEnabled: boolean;
  order: number;
}

export interface BiosFile {
  name: string;
  filename: string;
  description: string;
  required: boolean;
  md5?: string;
  sha1?: string;
  size?: number;
  downloadUrl?: string;
}

export interface Emulator {
  id: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  website: string;
  downloadUrl: string;
  supportedSystems: string[];
  executablePath?: string;
  installPath?: string;
  configPath?: string;
  biosPath?: string;
  savePath?: string;
  statePath?: string;
  screenshotPath?: string;
  isInstalled: boolean;
  isDefault: Record<string, boolean>;
  launchArgs?: Record<string, string>;
  configSchema?: EmulatorConfigSchema;
  installedVersion?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  lastChecked?: number;
  capabilities: EmulatorCapabilities;
}

export interface EmulatorConfigSchema {
  sections: ConfigSection[];
}

export interface ConfigSection {
  id: string;
  name: string;
  description?: string;
  options: ConfigOption[];
}

export interface ConfigOption {
  id: string;
  name: string;
  description?: string;
  type: 'boolean' | 'string' | 'number' | 'select' | 'path' | 'multiselect';
  defaultValue: any;
  values?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  requiresRestart?: boolean;
  emulatorSpecific?: boolean;
}

export interface EmulatorCapabilities {
  saveStates: boolean;
  screenshots: boolean;
  recording: boolean;
  netplay: boolean;
  achievements: boolean;
  cheats: boolean;
  rewind: boolean;
  turbo: boolean;
  customResolution: boolean;
  shaderSupport: boolean;
  controllerProfiles: boolean;
  perGameConfig: boolean;
}

export interface ControllerProfile {
  id: string;
  name: string;
  type: 'playstation' | 'xbox' | 'nintendo' | 'generic' | 'custom';
  deviceId?: string;
  deviceName?: string;
  vendorId?: number;
  productId?: number;
  mappings: ControllerMapping[];
  stickSettings?: StickSettings;
  triggerSettings?: TriggerSettings;
  vibration?: VibrationSettings;
  deadZones?: DeadZoneSettings;
  isSystemDefault: Record<string, boolean>;
  isGameDefault: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface ControllerMapping {
  action: string;
  inputType: 'button' | 'axis' | 'hat';
  inputIndex: number;
  modifier?: string;
  outputType: 'button' | 'axis' | 'keyboard' | 'mouse';
  outputValue?: string | number;
}

export interface StickSettings {
  leftDeadzone?: number;
  rightDeadzone?: number;
  leftSensitivity?: number;
  rightSensitivity?: number;
  leftInvertX?: boolean;
  leftInvertY?: boolean;
  rightInvertX?: boolean;
  rightInvertY?: boolean;
}

export interface TriggerSettings {
  leftDeadzone?: number;
  rightDeadzone?: number;
  leftThreshold?: number;
  rightThreshold?: number;
}

export interface VibrationSettings {
  enabled: boolean;
  strength: number;
}

export interface DeadZoneSettings {
  leftStick: number;
  rightStick: number;
  leftTrigger: number;
  rightTrigger: number;
}

export interface SaveFile {
  id: string;
  gameId: string;
  emulatorId: string;
  type: 'save' | 'state' | 'sram' | 'memory_card' | 'config' | 'other';
  name: string;
  path: string;
  size: number;
  modifiedAt: number;
  description?: string;
  screenshotUrl?: string;
  metadata?: Record<string, any>;
}

export interface SaveBackup {
  id: string;
  gameId: string;
  name: string;
  description?: string;
  files: SaveFile[];
  createdAt: number;
  size: number;
  path: string;
  isAuto: boolean;
}

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  previewImages: string[];
  isBuiltIn: boolean;
  isActive: boolean;
  config: ThemeConfig;
  assets: ThemeAssets;
  layouts: ThemeLayouts;
  animations: ThemeAnimations;
  sounds: ThemeSounds;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  transitions: ThemeTransitions;
  backgroundEffects: BackgroundEffects;
  informationDensity: 'compact' | 'normal' | 'comfortable';
}

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  secondary: string;
  secondaryHover: string;
  accent: string;
  accentHover: string;
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  border: string;
  borderHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  overlay: string;
  glow: string;
}

export interface ThemeFonts {
  display: string;
  heading: string;
  body: string;
  mono: string;
  ui: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  glow: string;
  glowStrong: string;
}

export interface ThemeTransitions {
  fast: string;
  normal: string;
  slow: string;
  easing: string;
}

export interface BackgroundEffects {
  enabled: boolean;
  type: 'none' | 'gradient' | 'particles' | 'grid' | 'crt' | 'blur' | 'video';
  config: Record<string, any>;
  intensity: number;
}

export interface ThemeAssets {
  icons: Record<string, string>;
  logos: Record<string, string>;
  backgrounds: Record<string, string>;
  ui: Record<string, string>;
}

export interface ThemeLayouts {
  home: LayoutConfig;
  games: LayoutConfig;
  systems: LayoutConfig;
  gameDetail: LayoutConfig;
  systemDetail: LayoutConfig;
  emulatorDetail: LayoutConfig;
  navigation: NavigationLayout;
  gameCard: GameCardLayout;
  listView: ListViewLayout;
  gridView: GridViewLayout;
}

export interface LayoutConfig {
  type: 'grid' | 'list' | 'carousel' | 'xmb' | 'dashboard' | 'marquee' | 'custom';
  columns?: ResponsiveColumns;
  itemAspectRatio?: string;
  gap?: string;
  padding?: string;
  showArtwork?: boolean;
  showBackground?: boolean;
  showDescription?: boolean;
  animation?: string;
}

export interface ResponsiveColumns {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

export interface NavigationLayout {
  type: 'sidebar' | 'xmb' | 'dashboard' | 'tabs' | 'drawer';
  position: 'left' | 'top' | 'bottom' | 'right';
  collapsible: boolean;
  width?: string;
  height?: string;
  showIconsOnly?: boolean;
}

export interface GameCardLayout {
  aspectRatio: string;
  showTitle: boolean;
  showPlatform: boolean;
  showPlaytime: boolean;
  showFavorite: boolean;
  showPlayButton: boolean;
  hoverEffect: 'scale' | 'glow' | 'reveal' | 'flip' | 'none';
  artworkFill: 'cover' | 'contain' | 'fill';
  borderRadius: string;
  shadow: string;
}

export interface ListViewLayout {
  rowHeight: string;
  showArtwork: boolean;
  artworkSize: string;
  columns: ListColumn[];
  hoverHighlight: boolean;
  zebraStriping: boolean;
}

export interface ListColumn {
  id: string;
  header: string;
  field: string;
  width: string;
  sortable: boolean;
  align: 'left' | 'center' | 'right';
}

export interface GridViewLayout {
  columns: ResponsiveColumns;
  gap: string;
  aspectRatio: string;
  showLabels: boolean;
  labelPosition: 'overlay' | 'below' | 'tooltip';
}

export interface ThemeAnimations {
  pageTransition: string;
  cardHover: string;
  cardEnter: string;
  cardExit: string;
  buttonHover: string;
  buttonPress: string;
  modalEnter: string;
  modalExit: string;
  navigationHover: string;
  scrollReveal: string;
  loadingSpinner: string;
  reducedMotion: boolean;
}

export interface ThemeSounds {
  enabled: boolean;
  volume: number;
  navigation: string;
  select: string;
  back: string;
  error: string;
  success: string;
  launch: string;
  hover: string;
}

export interface Download {
  id: string;
  type: 'emulator' | 'update' | 'metadata' | 'artwork' | 'theme' | 'bios' | 'app';
  name: string;
  url: string;
  destination: string;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  retryCount: number;
  startedAt?: number;
  completedAt?: number;
  metadata?: Record<string, any>;
}

export interface ScanFolder {
  id: string;
  path: string;
  name: string;
  isManaged: boolean;
  recursive: boolean;
  includePatterns: string[];
  excludePatterns: string[];
  lastScanned?: number;
  gameCount: number;
  enabled: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  artworkUrl?: string;
  gameIds: string[];
  isSystem: boolean;
  systemId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlaySession {
  id: string;
  gameId: string;
  emulatorId: string;
  startedAt: number;
  endedAt?: number;
  duration: number;
  isCompleted: boolean;
}

export interface Statistics {
  totalGames: number;
  gamesPlayed: number;
  totalPlaytime: number;
  totalLaunches: number;
  favoriteCount: number;
  systemCounts: Record<string, number>;
  genreCounts: Record<string, number>;
  yearCounts: Record<string, number>;
  topGames: Array<{ game: Game; playtime: number; launches: number }>;
  recentlyPlayed: Game[];
  playtimeByMonth: Record<string, number>;
  playtimeBySystem: Record<string, number>;
}

export interface AppSettings {
  general: GeneralSettings;
  library: LibrarySettings;
  scanning: ScanningSettings;
  emulators: EmulatorSettings;
  graphics: GraphicsSettings;
  audio: AudioSettings;
  controllers: ControllerSettings;
  themes: ThemeSettings;
  downloads: DownloadSettings;
  saves: SaveSettings;
  hotkeys: HotkeySettings;
  notifications: NotificationSettings;
  updates: UpdateSettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: string;
  theme: string;
  animationIntensity: 'none' | 'reduced' | 'normal' | 'full';
  backgroundEffects: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  minimizeToTray: boolean;
  checkUpdatesOnStart: boolean;
  autoUpdate: boolean;
  betaUpdates: boolean;
  telemetry: boolean;
  crashReporting: boolean;
}

export interface LibrarySettings {
  scanFolders: ScanFolder[];
  organizeLibrary: boolean;
  libraryPath?: string;
  autoScanOnStart: boolean;
  scanInterval: number;
  metadataProviders: string[];
  artworkProviders: string[];
  preferLocalArtwork: boolean;
  downloadMissingArtwork: boolean;
  artworkQuality: 'low' | 'medium' | 'high' | 'original';
}

export interface ScanningSettings {
  recursive: boolean;
  followSymlinks: boolean;
  maxDepth: number;
  ignoreHidden: boolean;
  ignoreSystem: boolean;
  customIgnorePatterns: string[];
  hashFiles: boolean;
  identifyGames: boolean;
  fetchMetadata: boolean;
  downloadArtwork: boolean;
}

export interface EmulatorSettings {
  defaultEmulators: Record<string, string>;
  emulatorPaths: Record<string, string>;
  biosPaths: Record<string, string>;
  savePaths: Record<string, string>;
  statePaths: Record<string, string>;
  screenshotPaths: Record<string, string>;
  globalLaunchArgs: string;
  exitBehavior: 'hide' | 'minimize' | 'stay' | 'close';
  pauseOnFocusLoss: boolean;
  fullscreenDefault: boolean;
}

export interface GraphicsSettings {
  defaultResolution: string;
  defaultFullscreen: boolean;
  defaultVSync: boolean;
  defaultInternalResolution: string;
  defaultRenderer: string;
  shaderDirectory?: string;
  textureFiltering: 'nearest' | 'linear' | 'anisotropic';
  anisotropicLevel: number;
  vsyncMode: 'off' | 'on' | 'adaptive' | 'mailbox';
  fpsLimit: number;
  integerScaling: boolean;
  aspectRatio: 'auto' | '4:3' | '16:9' | '16:10' | 'custom';
  customAspectRatio?: string;
}

export interface AudioSettings {
  backend: string;
  sampleRate: number;
  bufferSize: number;
  latency: number;
  volume: number;
  muteOnFocusLoss: boolean;
  enableReverb: boolean;
  enableSurround: boolean;
}

export interface ControllerSettings {
  autoDetect: boolean;
  defaultProfile: string;
  profiles: Record<string, string>;
  rumbleEnabled: boolean;
  rumbleStrength: number;
  deadzonePreset: 'none' | 'small' | 'medium' | 'large' | 'custom';
  customDeadzones: DeadZoneSettings;
  keyboardMappingEnabled: boolean;
  mouseMappingEnabled: boolean;
  touchMappingEnabled: boolean;
}

export interface ThemeSettings {
  activeTheme: string;
  customThemesPath?: string;
  allowCommunityThemes: boolean;
  autoApplySystemTheme: boolean;
  themeTransitionDuration: number;
}

export interface DownloadSettings {
  downloadPath: string;
  maxConcurrentDownloads: number;
  speedLimit: number;
  retryAttempts: number;
  retryDelay: number;
  verifyChecksums: boolean;
  keepFailedDownloads: boolean;
  autoExtract: boolean;
  deleteAfterInstall: boolean;
}

export interface SaveSettings {
  backupEnabled: boolean;
  backupInterval: number;
  backupPath?: string;
  maxBackupsPerGame: number;
  compressBackups: boolean;
  cloudSyncEnabled: boolean;
  cloudProvider?: string;
  autoBackupBeforeLaunch: boolean;
  autoRestoreOnLaunch: boolean;
}

export interface HotkeySettings {
  global: Record<string, string>;
  inGame: Record<string, string>;
  mediaKeys: boolean;
  gamepadShortcuts: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  showOnGameLaunch: boolean;
  showOnGameClose: boolean;
  showOnDownloadComplete: boolean;
  showOnUpdateAvailable: boolean;
  showArtwork: boolean;
  duration: number;
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface UpdateSettings {
  checkOnStart: boolean;
  autoDownload: boolean;
  autoInstall: boolean;
  betaChannel: boolean;
  notifyOnly: boolean;
  updateEmulators: boolean;
  updateMetadata: boolean;
  updateThemes: boolean;
}

export interface AdvancedSettings {
  logLevel: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  logToFile: boolean;
  maxLogSize: number;
  maxLogFiles: number;
  hardwareAcceleration: boolean;
  gpuPreference: 'integrated' | 'discrete' | 'auto';
  enableDevTools: boolean;
  experimentalFeatures: boolean;
  portableMode: boolean;
  customArgs: string;
}

export interface SearchResult {
  games: Game[];
  systems: System[];
  emulators: Emulator[];
  themes: Theme[];
  settings: SettingsSearchResult[];
}

export interface SettingsSearchResult {
  id: string;
  category: string;
  title: string;
  description: string;
  keywords: string[];
}

export type Page = 
  | 'home' 
  | 'games' 
  | 'systems' 
  | 'emulators' 
  | 'themes' 
  | 'downloads' 
  | 'saves' 
  | 'controllers' 
  | 'settings' 
  | 'game-detail' 
  | 'system-detail' 
  | 'emulator-detail' 
  | 'search';

export type SortField = 'name' | 'releaseDate' | 'playtime' | 'lastPlayed' | 'addedAt' | 'launchCount' | 'rating';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  systems: string[];
  genres: string[];
  developers: string[];
  publishers: string[];
  years: number[];
  emulators: string[];
  favoritesOnly: boolean;
  installedOnly: boolean;
  uninstalledOnly: boolean;
  hasSaves: boolean;
  searchQuery: string;
}

export interface GameViewState {
  viewMode: 'grid' | 'list' | 'compact' | 'carousel' | 'xmb';
  sortField: SortField;
  sortDirection: SortDirection;
  filters: FilterState;
  groupBy: 'none' | 'system' | 'genre' | 'year' | 'developer' | 'publisher' | 'emulator';
}

export interface EmulatorProvider {
  id: string;
  name: string;
  supportedSystems: string[];
  detectInstallation: () => Promise<{ found: boolean; path?: string; version?: string }>;
  install: (options?: InstallOptions) => Promise<{ success: boolean; path?: string; error?: string }>;
  update: () => Promise<{ success: boolean; version?: string; error?: string }>;
  uninstall: () => Promise<{ success: boolean; error?: string }>;
  launch: (game: Game, options: LaunchOptions) => Promise<{ success: boolean; pid?: number; error?: string }>;
  configure: () => Promise<{ success: boolean; error?: string }>;
  repair: () => Promise<{ success: boolean; error?: string }>;
  getVersion: () => Promise<string>;
  getConfigSchema: () => EmulatorConfigSchema;
  validateInstallation: (path: string) => Promise<boolean>;
  getDefaultPaths: () => DefaultPaths;
}

export interface InstallOptions {
  version?: string;
  installPath?: string;
  portable?: boolean;
  createShortcuts?: boolean;
}

export interface LaunchOptions {
  fullscreen?: boolean;
  resolution?: string;
  launchArgs?: string;
  configOverrides?: Record<string, any>;
  controllerProfile?: ControllerProfile;
}

export interface DefaultPaths {
  install: string;
  config: string;
  bios: string;
  saves: string;
  states: string;
  screenshots: string;
  shaders: string;
  logs: string;
}

export interface MetadataResult {
  game: Partial<Game>;
  artwork: ArtworkResult[];
  confidence: number;
  source: string;
}

export interface ArtworkResult {
  type: 'cover' | 'background' | 'screenshot' | 'logo' | 'icon' | 'banner' | 'marquee' | 'video';
  url: string;
  width?: number;
  height?: number;
  language?: string;
  region?: string;
  source: string;
  isPrimary?: boolean;
}

export interface EmulatorStatus {
  emulatorId: string;
  systemId: string;
  status: 'installed' | 'missing' | 'outdated' | 'error' | 'repairing';
  version?: string;
  latestVersion?: string;
  message?: string;
  biosStatus: BiosStatus[];
}

export interface BiosStatus {
  filename: string;
  required: boolean;
  found: boolean;
  path?: string;
  valid?: boolean;
  expectedHash?: string;
  actualHash?: string;
}

export type ThemeId = 
  | 'mfy-modern' 
  | 'retroarch' 
  | 'playstation-xmb' 
  | 'ps2' 
  | 'psp' 
  | 'xbox360' 
  | 'nintendo-retro' 
  | 'arcade' 
  | 'crt-retro';