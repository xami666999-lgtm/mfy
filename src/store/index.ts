import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppStore,
  Page,
  Settings,
  ContinueWatching,
  LibraryItem,
  SearchResult,
  Addon,
  PlayerState,
  Notification,
  UserProfile,
  Subtitle,
} from '../types';

const defaultSettings: Settings = {
  general: {
    language: 'en',
    region: 'US',
    contentLanguage: ['en'],
    adultContent: false,
    autoPlayNext: true,
    autoPlayTrailers: false,
    skipIntro: false,
    skipCredits: false,
  },
  playback: {
    quality: 'auto',
    bufferSize: 10,
    hardwareAcceleration: true,
    preferredAudioLanguage: 'en',
    preferredSubtitleLanguage: 'en',
    subtitleFontSize: 16,
    subtitleColor: '#ffffff',
    subtitleBackground: 'rgba(0,0,0,0.7)',
    subtitleOutline: true,
  },
  appearance: {
    theme: 'system',
    accentColor: '#e50914',
    compactMode: false,
    showBackdrops: true,
    reduceMotion: false,
    fontScale: 1,
  },
  addons: {
    installedAddons: [],
    communityAddons: [],
    officialAddons: [],
    autoUpdateAddons: true,
    addonTimeout: 10000,
  },
  library: {
    syncWithTrakt: false,
    autoAddToLibrary: true,
    showInLibrary: ['watching', 'completed', 'plan_to_watch'],
  },
  profiles: {
    profiles: [],
    activeProfileId: '',
  },
  network: {
    dnsOverHttps: false,
  },
  privacy: {
    analytics: false,
    crashReporting: false,
    shareUsageData: false,
    clearHistoryOnExit: false,
  },
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentPage: 'home',
      setCurrentPage: (page: Page) => set({ currentPage: page }),
      
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      mediaItems: [],
      setMediaItems: (items) => set({ mediaItems: items }),
      
      continueWatching: [],
      setContinueWatching: (items: ContinueWatching[]) => set({ continueWatching: items }),
      addToContinueWatching: (item: ContinueWatching) =>
        set((state) => {
          const filtered = state.continueWatching.filter((cw) => cw.mediaId !== item.mediaId || cw.profileId !== item.profileId);
          return { continueWatching: [item, ...filtered].slice(0, 20) };
        }),
      updateContinueWatching: (id: string, progress: number, currentTime: number) =>
        set((state) => ({
          continueWatching: state.continueWatching.map((cw) =>
            cw.id === id ? { ...cw, progress, currentTime, watchedAt: new Date().toISOString() } : cw
          ),
        })),
      removeFromContinueWatching: (id: string) =>
        set((state) => ({
          continueWatching: state.continueWatching.filter((cw) => cw.id !== id),
        })),
      
      library: [],
      setLibrary: (items: LibraryItem[]) => set({ library: items }),
      upsertLibraryItem: (item: LibraryItem) =>
        set((state) => ({
          library: state.library.some((l) => l.mediaId === item.mediaId && l.profileId === item.profileId)
            ? state.library.map((l) => (l.mediaId === item.mediaId && l.profileId === item.profileId ? item : l))
            : [item, ...state.library],
        })),
      removeFromLibrary: (mediaId: string) =>
        set((state) => ({
          library: state.library.filter((l) => l.mediaId !== mediaId),
        })),
      getLibraryItem: (mediaId: string) => get().library.find((l) => l.mediaId === mediaId),
      
      searchQuery: '',
      setSearchQuery: (query: string) => set({ searchQuery: query }),
      searchResults: { movies: [], tv: [], anime: [] },
      setSearchResults: (results: SearchResult) => set({ searchResults: results }),
      searchDebounceTimer: null,
      setSearchDebounceTimer: (timer) => set({ searchDebounceTimer: timer }),
      
      addons: [],
      setAddons: (addons: Addon[]) => set({ addons }),
      installAddon: (addon: Addon) =>
        set((state) => ({
          addons: state.addons.some((a) => a.id === addon.id)
            ? state.addons.map((a) => (a.id === addon.id ? addon : a))
            : [...state.addons, addon],
        })),
      uninstallAddon: (addonId: string) =>
        set((state) => ({
          addons: state.addons.filter((a) => a.id !== addonId),
          enabledAddons: state.enabledAddons.filter((id) => id !== addonId),
        })),
      getAddon: (id: string) => get().addons.find((a) => a.id === id),
      enabledAddons: [],
      setEnabledAddons: (ids: string[]) => set({ enabledAddons: ids }),
      
      settings: defaultSettings,
      setSettings: (partialSettings: Partial<Settings>) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...partialSettings,
            general: { ...state.settings.general, ...partialSettings.general },
            playback: { ...state.settings.playback, ...partialSettings.playback },
            appearance: { ...state.settings.appearance, ...partialSettings.appearance },
            addons: { ...state.settings.addons, ...partialSettings.addons },
            library: { ...state.settings.library, ...partialSettings.library },
            profiles: { ...state.settings.profiles, ...partialSettings.profiles },
            network: { ...state.settings.network, ...partialSettings.network },
            privacy: { ...state.settings.privacy, ...partialSettings.privacy },
          },
        })),
      
      playerState: null,
      setPlayerState: (state: PlayerState | null) => set({ playerState: state }),
      
      profiles: [],
      setProfiles: (profiles: UserProfile[]) => set({ profiles }),
      activeProfile: null,
      setActiveProfile: (profile: UserProfile | null) => set({ activeProfile: profile }),
      addProfile: (profile: UserProfile) =>
        set((state) => ({
          profiles: [...state.profiles, profile],
          activeProfile: state.profiles.length === 0 ? profile : state.activeProfile,
        })),
      updateProfile: (id: string, updates: Partial<UserProfile>) =>
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          activeProfile: state.activeProfile?.id === id ? { ...state.activeProfile, ...updates } : state.activeProfile,
        })),
      removeProfile: (id: string) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfile: state.activeProfile?.id === id ? (state.profiles[1] || null) : state.activeProfile,
        })),
      
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id: crypto.randomUUID() }],
        })),
      removeNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'mfy-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        continueWatching: state.continueWatching,
        library: state.library,
        enabledAddons: state.enabledAddons,
        settings: state.settings,
        profiles: state.profiles,
        activeProfile: state.activeProfile,
      }),
    }
  )
);