import { create } from 'zustand'
import type { Page, UserProfile, WatchHistoryItem, CustomList } from '../types'

export interface WatchlistItem {
  mediaId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath: string | null
  addedAt: string
}

export type ThemeId = 'pink' | 'cyan' | 'emerald' | 'amber' | 'pure' | 'violet' | 'rose' | 'blue' | 'orange' | 'red' | 'lime' | 'purple'

export interface DownloadItem {
  id: string
  title: string
  url: string
  status: 'queued' | 'done' | 'failed'
  addedAt: string
}

interface AppState {
  currentPage: Page
  setCurrentPage: (page: Page) => void

  selectedMedia: { id: number; type: 'movie' | 'tv'; season?: number; episode?: number } | null
  setSelectedMedia: (media: { id: number; type: 'movie' | 'tv'; season?: number; episode?: number } | null) => void

  currentProfile: UserProfile | null
  setCurrentProfile: (profile: UserProfile | null) => void
  authenticated: boolean
  setAuthenticated: (v: boolean) => void
  profiles: UserProfile[]
  setProfiles: (profiles: UserProfile[]) => void
  addProfile: (name: string, avatar?: string) => string
  removeProfile: (id: string) => void
  setProfileAvatar: (id: string, avatar: string) => void
  switchProfile: (id: string) => void
  setProfilePin: (id: string, pin: string) => void
  verifyProfilePin: (id: string, pin: string) => boolean

  watchHistory: WatchHistoryItem[]
  setWatchHistory: (history: WatchHistoryItem[]) => void
  upsertHistory: (item: WatchHistoryItem) => void

  customLists: CustomList[]
  setCustomLists: (lists: CustomList[]) => void
  createCustomList: (name: string) => string
  renameCustomList: (id: string, name: string) => void
  deleteCustomList: (id: string) => void
  addToCustomList: (listId: string, mediaId: number, mediaType: 'movie' | 'tv', meta?: { title?: string; posterPath?: string | null }) => void
  removeFromCustomList: (listId: string, mediaId: number, mediaType: 'movie' | 'tv') => void
  isInCustomList: (listId: string, mediaId: number, mediaType: 'movie' | 'tv') => boolean

  watchlist: WatchlistItem[]
  setWatchlist: (items: WatchlistItem[]) => void
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => void
  isInWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => boolean

  favorites: WatchlistItem[]
  addFavorite: (item: WatchlistItem) => void
  removeFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => void
  isFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => boolean

  isSetupComplete: boolean
  setSetupComplete: (complete: boolean) => void

  searchQuery: string
  setSearchQuery: (query: string) => void

  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void

  currentStreamUrl: string | null
  setCurrentStreamUrl: (url: string | null) => void

  // API Keys / services
  tmdbApiKey: string
  setTmdbApiKey: (key: string) => void
  traktToken: string
  setTraktToken: (token: string) => void
  realDebridKey: string
  setRealDebridKey: (key: string) => void
  aiostreamsUrl: string
  setAiostreamsUrl: (url: string) => void
  jellyfinUrl: string
  setJellyfinUrl: (url: string) => void
  jellyfinApiKey: string
  setJellyfinApiKey: (key: string) => void

  omdbApiKey: string
  setOmdbApiKey: (key: string) => void

  mdblistApiKey: string
  setMdblistApiKey: (key: string) => void

  opensubtitlesKey: string
  setOpensubtitlesKey: (key: string) => void

  selectedProviderId: string | null
  setSelectedProviderId: (id: string | null) => void

  selectedFranchiseId: string | null
  setSelectedFranchiseId: (id: string | null) => void

  discoverFilter: 'movies' | 'shows' | 'anime'
  setDiscoverFilter: (filter: 'movies' | 'shows' | 'anime') => void

  // Theme
  theme: ThemeId
  setTheme: (theme: ThemeId) => void

  // Player prefs
  externalPlayer: string // '' | 'vlc' | 'mpv' | 'system'
  setExternalPlayer: (p: string) => void
  autoplayNext: boolean
  setAutoplayNext: (v: boolean) => void

  // Local library paths
  localFolders: string[]
  setLocalFolders: (paths: string[]) => void
  addLocalFolder: (path: string) => void

  // Download queue (scaffold)
  downloads: DownloadItem[]
  queueDownload: (item: Omit<DownloadItem, 'id' | 'status' | 'addedAt'>) => void

  // Watch party (scaffold)
  partyCode: string | null
  setPartyCode: (code: string | null) => void
}

function persist(key: string, value: unknown) {
  try {
    const api = (window as any).electronAPI
    if (api?.set) api.set(key, value)
    else localStorage.setItem('mfy-' + key, JSON.stringify(value))
  } catch { /* ignore */ }
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const useStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),

  selectedMedia: null,
  setSelectedMedia: (media) => set({ selectedMedia: media }),

  currentProfile: null,
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  authenticated: false,
  setAuthenticated: (v) => set({ authenticated: v }),
  profiles: [],
  setProfiles: (profiles) => {
    set({ profiles })
    persist('profiles', profiles)
  },
  addProfile: (name, avatar) => {
    const profile: UserProfile = {
      id: uid(),
      name: name.trim() || 'Profile',
      avatar: avatar || '/icon.png',
      createdAt: new Date().toISOString(),
    }
    const profiles = [...get().profiles, profile]
    set({ profiles, currentProfile: profile })
    persist('profiles', profiles)
    persist('currentProfileId', profile.id)
    return profile.id
  },
  setProfileAvatar: (id, avatar) => {
    const cur = get().currentProfile
    const profiles = get().profiles.map((p) => (p.id === id ? { ...p, avatar } : p))
    set({
      profiles,
      currentProfile: cur && cur.id === id ? { ...cur, avatar } : cur,
    })
    persist('profiles', profiles)
  },
  removeProfile: (id) => {
    const profiles = get().profiles.filter((x) => x.id !== id)
    set({ profiles })
    persist('profiles', profiles)
    if (get().currentProfile?.id === id) {
      const next = profiles[0] || null
      set({ currentProfile: next })
      persist('currentProfileId', next ? next.id : '')
    }
  },
  switchProfile: (id) => {
    const p = get().profiles.find((x) => x.id === id) || null
    set({ currentProfile: p })
    persist('currentProfileId', id)
  },
  setProfilePin: (id, pin) => {
    const profiles = get().profiles.map((p) => (p.id === id ? { ...p, pin: pin || undefined } : p))
    set({ profiles })
    persist('profiles', profiles)
  },
  verifyProfilePin: (id, pin) => {
    const p = get().profiles.find((x) => x.id === id)
    if (!p) return false
    if (!p.pin) return true
    return p.pin === pin
  },

  watchHistory: [],
  setWatchHistory: (history) => {
    set({ watchHistory: history })
    persist('watchHistory', history)
  },
  upsertHistory: (item) => {
    const rest = get().watchHistory.filter(
      (h) => !(h.mediaId === item.mediaId && h.mediaType === item.mediaType && h.season === item.season && h.episode === item.episode)
    )
    const next = [item, ...rest].slice(0, 50)
    set({ watchHistory: next })
    persist('watchHistory', next)
  },

  customLists: [],
  setCustomLists: (lists) => {
    set({ customLists: lists })
    persist('customLists', lists)
  },
  createCustomList: (name) => {
    const id = `list-${Date.now()}`
    const list = { id, name, profileId: get().currentProfile?.id || 'default', items: [] }
    const next = [...get().customLists, list]
    set({ customLists: next })
    persist('customLists', next)
    return id
  },
  renameCustomList: (id, name) => {
    const next = get().customLists.map((l) => (l.id === id ? { ...l, name } : l))
    set({ customLists: next })
    persist('customLists', next)
  },
  deleteCustomList: (id) => {
    const next = get().customLists.filter((l) => l.id !== id)
    set({ customLists: next })
    persist('customLists', next)
  },
  addToCustomList: (listId, mediaId, mediaType, meta) => {
    const next = get().customLists.map((l) => {
      if (l.id !== listId) return l
      if (l.items.some((i) => i.mediaId === mediaId && i.mediaType === mediaType)) return l
      return { ...l, items: [...l.items, { mediaId, mediaType, addedAt: new Date().toISOString(), ...meta }] }
    })
    set({ customLists: next })
    persist('customLists', next)
  },
  removeFromCustomList: (listId, mediaId, mediaType) => {
    const next = get().customLists.map((l) =>
      l.id === listId ? { ...l, items: l.items.filter((i) => !(i.mediaId === mediaId && i.mediaType === mediaType)) } : l
    )
    set({ customLists: next })
    persist('customLists', next)
  },
  isInCustomList: (listId, mediaId, mediaType) =>
    get().customLists.find((l) => l.id === listId)?.items.some((i) => i.mediaId === mediaId && i.mediaType === mediaType) ?? false,

  watchlist: [],
  setWatchlist: (items) => {
    set({ watchlist: items })
    persist('watchlist', items)
  },
  addToWatchlist: (item) => {
    const current = get().watchlist
    if (current.some((x) => x.mediaId === item.mediaId && x.mediaType === item.mediaType)) return
    const next = [item, ...current]
    set({ watchlist: next })
    persist('watchlist', next)
  },
  removeFromWatchlist: (mediaId, mediaType) => {
    const next = get().watchlist.filter((x) => !(x.mediaId === mediaId && x.mediaType === mediaType))
    set({ watchlist: next })
    persist('watchlist', next)
  },
  isInWatchlist: (mediaId, mediaType) =>
    get().watchlist.some((x) => x.mediaId === mediaId && x.mediaType === mediaType),

  favorites: [],
  addFavorite: (item) => {
    const current = get().favorites
    if (current.some((x) => x.mediaId === item.mediaId && x.mediaType === item.mediaType)) return
    const next = [item, ...current]
    set({ favorites: next })
    persist('favorites', next)
  },
  removeFavorite: (mediaId, mediaType) => {
    const next = get().favorites.filter((x) => !(x.mediaId === mediaId && x.mediaType === mediaType))
    set({ favorites: next })
    persist('favorites', next)
  },
  isFavorite: (mediaId, mediaType) =>
    get().favorites.some((x) => x.mediaId === mediaId && x.mediaType === mediaType),

  isSetupComplete: false,
  setSetupComplete: (complete) => set({ isSetupComplete: complete }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isPlaying: false,
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  currentStreamUrl: null,
  setCurrentStreamUrl: (url) => set({ currentStreamUrl: url }),

  tmdbApiKey: '',
  setTmdbApiKey: (key) => set({ tmdbApiKey: key }),
  traktToken: '',
  setTraktToken: (token) => set({ traktToken: token }),
  realDebridKey: '',
  setRealDebridKey: (key) => set({ realDebridKey: key }),
  aiostreamsUrl: '',
  setAiostreamsUrl: (url) => set({ aiostreamsUrl: url }),
  jellyfinUrl: '',
  setJellyfinUrl: (url) => set({ jellyfinUrl: url }),
  jellyfinApiKey: '',
  setJellyfinApiKey: (key) => set({ jellyfinApiKey: key }),

  omdbApiKey: '',
  setOmdbApiKey: (key) => set({ omdbApiKey: key }),

  mdblistApiKey: '',
  setMdblistApiKey: (key) => set({ mdblistApiKey: key }),

  opensubtitlesKey: '',
  setOpensubtitlesKey: (key) => set({ opensubtitlesKey: key }),

  selectedProviderId: null,
  setSelectedProviderId: (id) => set({ selectedProviderId: id }),

  selectedFranchiseId: null,
  setSelectedFranchiseId: (id) => set({ selectedFranchiseId: id }),

  discoverFilter: 'movies',
  setDiscoverFilter: (filter) => set({ discoverFilter: filter }),

  theme: 'pink',
  setTheme: (theme) => {
    set({ theme })
    persist('theme', theme)
    applyTheme(theme)
  },

  externalPlayer: '',
  setExternalPlayer: (p) => {
    set({ externalPlayer: p })
    persist('externalPlayer', p)
  },
  autoplayNext: true,
  setAutoplayNext: (v) => {
    set({ autoplayNext: v })
    persist('autoplayNext', v)
  },

  localFolders: [],
  setLocalFolders: (paths) => {
    set({ localFolders: paths })
    persist('localFolders', paths)
  },
  addLocalFolder: (path) => {
    const paths = Array.from(new Set([...get().localFolders, path]))
    set({ localFolders: paths })
    persist('localFolders', paths)
  },

  downloads: [],
  queueDownload: (item) => {
    const entry: DownloadItem = {
      ...item,
      id: uid(),
      status: 'queued',
      addedAt: new Date().toISOString(),
    }
    const next = [entry, ...get().downloads]
    set({ downloads: next })
    persist('downloads', next)
  },

  partyCode: null,
  setPartyCode: (code) => set({ partyCode: code }),
}))

export function applyTheme(theme: ThemeId) {
  const root = document.documentElement
  const map: Record<ThemeId, { pink: string; glow: string }> = {
    pink: { pink: '#FF1493', glow: 'rgba(255,20,147,0.45)' },
    cyan: { pink: '#00E5FF', glow: 'rgba(0,229,255,0.45)' },
    emerald: { pink: '#10B981', glow: 'rgba(16,185,129,0.45)' },
    amber: { pink: '#F59E0B', glow: 'rgba(245,158,11,0.45)' },
    pure: { pink: '#E5E7EB', glow: 'rgba(229,231,235,0.35)' },
    violet: { pink: '#8B5CF6', glow: 'rgba(139,92,246,0.45)' },
    rose: { pink: '#F43F5E', glow: 'rgba(244,63,94,0.45)' },
    blue: { pink: '#3B82F6', glow: 'rgba(59,130,246,0.45)' },
    orange: { pink: '#F97316', glow: 'rgba(249,115,22,0.45)' },
    red: { pink: '#EF4444', glow: 'rgba(239,68,68,0.45)' },
    lime: { pink: '#84CC16', glow: 'rgba(132,204,22,0.45)' },
    purple: { pink: '#A855F7', glow: 'rgba(168,85,247,0.45)' },
  }
  const c = map[theme] || map.pink
  root.style.setProperty('--mfy-pink', c.pink)
  root.style.setProperty('--mfy-pink-glow', c.glow)
  root.style.setProperty('--mfy-pink-soft', c.glow.replace('0.45', '0.18').replace('0.35', '0.12'))
}
