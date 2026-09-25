export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'movie';
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: 'tv';
}

export interface Anime {
  id: number;
  title: { romaji: string; english: string; native: string };
  coverImage: { large: string; color: string };
  bannerImage: string | null;
  description: string;
  averageScore: number;
  genres: string[];
  episodes: number;
  status: string;
}

export interface MediaDetail {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  runtime?: number;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; profile_path: string | null; character: string }[];
    crew: { id: number; name: string; job: string; profile_path: string | null }[];
  };
  videos?: {
    results: { id: string; key: string; site: string; type: string; name: string }[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
    air_date: string;
  }[];
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface SeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episodes: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface StreamSource {
  url: string;
  type: 'hls' | 'dash' | 'mp4' | 'torrent';
  quality: string;
  provider: string;
  debrid?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  pin?: string;
  email?: string;
}

export interface WatchHistoryItem {
  id: string;
  mediaId: number | string;
  mediaType: 'movie' | 'tv' | 'anime' | 'iptv';
  title: string;
  posterPath: string | null;
  progress: number;
  duration: number;
  season?: number;
  episode?: number;
  watchedAt: string;
  profileId: string;
  completed?: boolean;
  seriesCompleted?: boolean;
}

export interface CustomList {
  id: string;
  name: string;
  profileId: string;
  items: { mediaId: number | string; mediaType: 'movie' | 'tv' | 'anime' | 'iptv'; addedAt: string; title?: string; posterPath?: string | null }[];
}

export interface StreamingService {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface Addon {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  resources: ('catalog' | 'meta' | 'stream' | 'subtitles')[];
  types: ('movie' | 'tv' | 'anime')[];
  catalogs: Catalog[];
  idPrefixes?: string[];
  timeout?: number;
  config?: AddonConfig[];
  transportUrl?: string;
  enabled?: boolean;
}

export interface Catalog {
  id: string;
  name: string;
  type: 'movie' | 'tv' | 'anime';
  genres?: string[];
  extra?: ExtraProp[];
}

export interface ExtraProp {
  name: string;
  isRequired: boolean;
  options?: string[];
  optionsLimit?: number;
}

export interface AddonConfig {
  key: string;
  title: string;
  description: string;
  type: 'text' | 'password' | 'boolean' | 'select' | 'number';
  default?: any;
  options?: { label: string; value: any }[];
}

export interface SearchResult {
  movies: Movie[];
  tv: TVShow[];
  anime: Anime[];
}

export interface ContinueWatching {
  id: string;
  mediaId: number | string;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  progress: number;
  duration: number;
  currentTime: number;
  season?: number;
  episode?: number;
  episodeTitle?: string;
  watchedAt: string;
  profileId: string;
}

export interface LibraryItem {
  id: string;
  mediaId: number | string;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';
  progress: number;
  currentSeason?: number;
  currentEpisode?: number;
  rating?: number;
  notes?: string;
  addedAt: string;
  updatedAt: string;
  profileId: string;
}

export interface Settings {
  general: GeneralSettings;
  playback: PlaybackSettings;
  appearance: AppearanceSettings;
  addons: AddonSettings;
  library: LibrarySettings;
  profiles: ProfileSettings;
  network: NetworkSettings;
  privacy: PrivacySettings;
}

export interface GeneralSettings {
  language: string;
  region: string;
  contentLanguage: string[];
  adultContent: boolean;
  autoPlayNext: boolean;
  autoPlayTrailers: boolean;
  skipIntro: boolean;
  skipCredits: boolean;
}

export interface PlaybackSettings {
  quality: 'auto' | '4k' | '1080p' | '720p' | '480p' | '360p';
  bufferSize: number;
  hardwareAcceleration: boolean;
  preferredAudioLanguage: string;
  preferredSubtitleLanguage: string;
  subtitleFontSize: number;
  subtitleColor: string;
  subtitleBackground: string;
  subtitleOutline: boolean;
  externalPlayer?: string;
  externalPlayerArgs?: string;
}

export interface AppearanceSettings {
  theme: 'system' | 'light' | 'dark' | 'oled';
  accentColor: string;
  compactMode: boolean;
  showBackdrops: boolean;
  reduceMotion: boolean;
  fontScale: number;
}

export interface AddonSettings {
  installedAddons: string[];
  communityAddons: string[];
  officialAddons: string[];
  autoUpdateAddons: boolean;
  addonTimeout: number;
}

export interface LibrarySettings {
  syncWithTrakt: boolean;
  traktToken?: string;
  autoAddToLibrary: boolean;
  showInLibrary: ('watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold')[];
}

export interface ProfileSettings {
  profiles: UserProfile[];
  activeProfileId: string;
}

export interface NetworkSettings {
  proxyUrl?: string;
  proxyUsername?: string;
  proxyPassword?: string;
  dnsOverHttps: boolean;
  customDns?: string;
}

export interface PrivacySettings {
  analytics: boolean;
  crashReporting: boolean;
  shareUsageData: boolean;
  clearHistoryOnExit: boolean;
}

export type Page = 
  | 'home' 
  | 'discover' 
  | 'search' 
  | 'search-results' 
  | 'library' 
  | 'settings' 
  | 'detail' 
  | 'player' 
  | 'wizard'
  | 'guide'
  | 'provider'
  | 'franchise'
  | 'movies'
  | 'tv'
  | 'anime'
  | 'sports'
  | 'iptv'
  | 'providers'
  | 'franchises'
  | 'manga'
  | 'manga-detail'
  | 'airing'
  | 'people'
  | 'upcoming';

export type ViewMode = 'grid' | 'list' | 'detailed';

export type SortField = 'title' | 'year' | 'rating' | 'addedAt' | 'releaseDate' | 'popularity';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  type: 'movie' | 'tv' | 'anime' | 'all';
  genres: string[];
  years: number[];
  rating: [number, number];
  status?: string[];
  networks?: string[];
  searchQuery: string;
}

export interface AppStore {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  theme: 'system' | 'light' | 'dark' | 'oled';
  setTheme: (theme: 'system' | 'light' | 'dark' | 'oled') => void;
  
  mediaItems: (Movie | TVShow | Anime)[];
  setMediaItems: (items: (Movie | TVShow | Anime)[]) => void;
  
  continueWatching: ContinueWatching[];
  setContinueWatching: (items: ContinueWatching[]) => void;
  addToContinueWatching: (item: ContinueWatching) => void;
  updateContinueWatching: (id: string, progress: number, currentTime: number) => void;
  removeFromContinueWatching: (id: string) => void;
  
  library: LibraryItem[];
  setLibrary: (items: LibraryItem[]) => void;
  upsertLibraryItem: (item: LibraryItem) => void;
  removeFromLibrary: (mediaId: string) => void;
  getLibraryItem: (mediaId: string) => LibraryItem | undefined;
  
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult;
  setSearchResults: (results: SearchResult) => void;
  searchDebounceTimer: NodeJS.Timeout | null;
  setSearchDebounceTimer: (timer: NodeJS.Timeout | null) => void;
  
  addons: Addon[];
  setAddons: (addons: Addon[]) => void;
  installAddon: (addon: Addon) => void;
  uninstallAddon: (addonId: string) => void;
  getAddon: (id: string) => Addon | undefined;
  enabledAddons: string[];
  setEnabledAddons: (ids: string[]) => void;
  
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  
  playerState: PlayerState | null;
  setPlayerState: (state: PlayerState | null) => void;
  
  profiles: UserProfile[];
  setProfiles: (profiles: UserProfile[]) => void;
  activeProfile: UserProfile | null;
  setActiveProfile: (profile: UserProfile | null) => void;
  addProfile: (profile: UserProfile) => void;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
  removeProfile: (id: string) => void;
  
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

export interface PlayerState {
  mediaId: number | string;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  stream: StreamSource;
  subtitles: Subtitle[];
  currentTime: number;
  duration: number;
  playing: boolean;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  quality: string;
  audioTrack: number;
  subtitleTrack: number;
  seasonNumber?: number;
  episodeNumber?: number;
  nextEpisode?: Episode;
}

export interface Subtitle {
  id: string;
  url: string;
  language: string;
  label: string;
  hearingImpaired?: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}