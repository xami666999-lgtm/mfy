import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Track, Playlist, PlaybackState, AppSettings, Statistics, Page } from '../types'
import { audioEngine } from '../services/audioEngine'

interface AppStore {
  currentPage: Page
  setCurrentPage: (page: Page) => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  lyricsPanelOpen: boolean
  toggleLyricsPanel: () => void
  setLyricsPanelOpen: (open: boolean) => void

  queueDrawerOpen: boolean
  toggleQueueDrawer: () => void
  setQueueDrawerOpen: (open: boolean) => void

  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: { tracks: Track[]; artists: any[]; albums: any[] }
  setSearchResults: (results: { tracks: Track[]; artists: any[]; albums: any[] }) => void
  searchDebounceTimer: number | null
  setSearchDebounceTimer: (timer: number | null) => void

  miniPlayerOpen: boolean
  toggleMiniPlayer: () => void
  setMiniPlayerOpen: (open: boolean) => void

  theme: 'dark' | 'light' | 'system'
  setTheme: (theme: 'dark' | 'light' | 'system') => void

  playbackState: PlaybackState
  setPlaybackState: (state: Partial<PlaybackState>) => void

  playlists: Playlist[]
  setPlaylists: (playlists: Playlist[]) => void
  addPlaylist: (playlist: Playlist) => void
  updatePlaylist: (playlist: Playlist) => void
  deletePlaylist: (id: string) => void

  favorites: Track[]
  setFavorites: (favorites: Track[]) => void
  addFavorite: (track: Track) => void
  removeFavorite: (trackId: string) => void

  history: Track[]
  setHistory: (history: Track[]) => void

  statistics: Statistics | null
  setStatistics: (stats: Statistics) => void

  settings: AppSettings
  setSettings: (settings: Partial<AppSettings>) => void

  trendingTracks: Track[]
  setTrendingTracks: (tracks: Track[]) => void

  recentlyPlayed: Track[]
  setRecentlyPlayed: (tracks: Track[]) => void

  initAudioEngine: () => Promise<void>
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  crossfadeEnabled: true,
  crossfadeDuration: 5,
  volume: 0.8,
  miniPlayerEnabled: true,
  notificationsEnabled: true,
  notificationArtwork: true,
  mediaKeysEnabled: true,
  cacheEnabled: true,
  cacheMaxSize: 5,
  audioQuality: 'high',
  pipedInstance: '',
  ytmInstance: '',
  lyricsEnabled: true,
  lyricsSource: 'auto',
  downloadQuality: 'high',
  downloadPath: '',
  startMinimized: false,
  closeToTray: true,
  shuffle: false,
  repeatMode: 'off',
}

const defaultPlaybackState: PlaybackState = {
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  repeatMode: 'off',
  shuffle: false,
  crossfadeEnabled: true,
  crossfadeDuration: 5,
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentPage: 'home',
      setCurrentPage: (page) => set({ currentPage: page }),

      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      lyricsPanelOpen: false,
      toggleLyricsPanel: () => set((state) => ({ lyricsPanelOpen: !state.lyricsPanelOpen })),
      setLyricsPanelOpen: (open) => set({ lyricsPanelOpen: open }),

      queueDrawerOpen: false,
      toggleQueueDrawer: () => set((state) => ({ queueDrawerOpen: !state.queueDrawerOpen })),
      setQueueDrawerOpen: (open) => set({ queueDrawerOpen: open }),

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      searchResults: { tracks: [], artists: [], albums: [] },
      setSearchResults: (results) => set({ searchResults: results }),
      searchDebounceTimer: null,
      setSearchDebounceTimer: (timer) => set({ searchDebounceTimer: timer }),

      miniPlayerOpen: false,
      toggleMiniPlayer: () => set((state) => ({ miniPlayerOpen: !state.miniPlayerOpen })),
      setMiniPlayerOpen: (open) => set({ miniPlayerOpen: open }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      playbackState: defaultPlaybackState,
      setPlaybackState: (state) => set((prev) => ({ playbackState: { ...prev.playbackState, ...state } })),

      playlists: [],
      setPlaylists: (playlists) => set({ playlists }),
      addPlaylist: (playlist) => set((state) => ({ playlists: [...state.playlists, playlist] })),
      updatePlaylist: (playlist) => set((state) => ({ 
        playlists: state.playlists.map(p => p.id === playlist.id ? playlist : p) 
      })),
      deletePlaylist: (id) => set((state) => ({ 
        playlists: state.playlists.filter(p => p.id !== id) 
      })),

      favorites: [],
      setFavorites: (favorites) => set({ favorites }),
      addFavorite: (track) => set((state) => ({ 
        favorites: state.favorites.some(f => f.id === track.id) ? state.favorites : [...state.favorites, track] 
      })),
      removeFavorite: (trackId) => set((state) => ({ 
        favorites: state.favorites.filter(f => f.id !== trackId) 
      })),

      history: [],
      setHistory: (history) => set({ history }),

      statistics: null,
      setStatistics: (stats) => set({ statistics: stats }),

      settings: defaultSettings,
      setSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),

      trendingTracks: [],
      setTrendingTracks: (tracks) => set({ trendingTracks: tracks }),

      recentlyPlayed: [],
      setRecentlyPlayed: (tracks) => set({ recentlyPlayed: tracks }),

      initAudioEngine: async () => {
        await audioEngine.initialize()
        
        audioEngine.onPlaybackStateChange((state) => {
          set({ playbackState: state })
        })

        audioEngine.onTrackEnd(async (track, completed) => {
          if (completed) {
            const { databaseService } = await import('../services/database')
            await databaseService.insertHistory({
              id: crypto.randomUUID(),
              track_id: track.id,
              played_at: Date.now(),
              play_duration: track.duration,
              completed: true,
            })
          }
        })

        audioEngine.onSilenceDetected(async (track, silenceStartTime) => {
          const { streamService } = await import('../services/stream')
          const nextIndex = get().playbackState.queueIndex + 1
          if (nextIndex < get().playbackState.queue.length) {
            const nextTrack = get().playbackState.queue[nextIndex]
            if (nextTrack.sourceType === 'local' || nextTrack.sourceType === 'cached') {
              // For local/cached tracks, no need to resolve stream
              audioEngine.setQueue(get().playbackState.queue, get().playbackState.queueIndex)
            } else {
              const stream = await streamService.resolveStream(nextTrack.id, nextTrack.sourceUrl!, nextTrack.sourceType)
              if (stream.success && stream.data) {
                audioEngine.setQueue(get().playbackState.queue, get().playbackState.queueIndex)
              }
            }
          }
        })

        const savedVolume = get().settings.volume
        audioEngine.setVolume(savedVolume)
        
        const savedCrossfade = get().settings.crossfadeEnabled
        const savedCrossfadeDuration = get().settings.crossfadeDuration
        audioEngine.setCrossfade(savedCrossfade, savedCrossfadeDuration)
      },
    }),
    {
      name: 'mfy-music-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        lyricsPanelOpen: state.lyricsPanelOpen,
        queueDrawerOpen: state.queueDrawerOpen,
        theme: state.theme,
        playbackState: {
          volume: state.playbackState.volume,
          isMuted: state.playbackState.isMuted,
          repeatMode: state.playbackState.repeatMode,
          shuffle: state.playbackState.shuffle,
          crossfadeEnabled: state.playbackState.crossfadeEnabled,
          crossfadeDuration: state.playbackState.crossfadeDuration,
        },
        settings: state.settings,
        miniPlayerOpen: state.miniPlayerOpen,
      }),
    }
  )
)