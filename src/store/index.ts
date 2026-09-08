import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Game, System, Emulator, ControllerProfile, SaveFile, SaveBackup, Theme, Download, ScanFolder, Collection, PlaySession, AppSettings, Statistics, GameSettings, EmulatorCapabilities } from '../types'
import { databaseService } from '../services/database'

// Simplified store - database loading happens in App.tsx useEffect
interface EmulatorStore {
  installedEmulators: Emulator[]
  availableEmulators: Emulator[]
  selectedEmulator: Emulator | null
  setInstalledEmulators: (emulators: Emulator[]) => void
  setAvailableEmulators: (emulators: Emulator[]) => void
  setSelectedEmulator: (emulator: Emulator | null) => void
  emulatorSearchQuery: string
  setEmulatorSearchQuery: (query: string) => void
  emulatorSearchResults: Emulator[]
  setEmulatorSearchResults: (results: Emulator[]) => void
}

interface ControllerStore {
  detectedControllers: ControllerProfile[]
  selectedControllerProfile: ControllerProfile | null
  setDetectedControllers: (controllers: ControllerProfile[]) => void
  setSelectedControllerProfile: (profile: ControllerProfile | null) => void
  controllerSearchQuery: string
  setControllerSearchQuery: (query: string) => void
  controllerSearchResults: ControllerProfile[]
  setControllerSearchResults: (results: ControllerProfile[]) => void
}

interface DownloadStore {
  activeDownloads: Download[]
  pendingDownloads: Download[]
  completedDownloads: Download[]
  failedDownloads: Download[]
  downloadHistory: Download[]
  setActiveDownloads: (downloads: Download[]) => void
  setPendingDownloads: (downloads: Download[]) => void
  setCompletedDownloads: (downloads: Download[]) => void
  setFailedDownloads: (downloads: Download[]) => void
  addToHistory: (download: Download) => void
}

interface ScanFolderStore {
  scanFolders: ScanFolder[]
  selectedScanFolder: ScanFolder | null
  setScanFolders: (folders: ScanFolder[]) => void
  setSelectedScanFolder: (folder: ScanFolder | null) => void
}

interface StatisticsStore {
  statistics: Statistics | null
  setStatistics: (stats: Statistics) => void
}

interface GameLibraryStore {
  allGames: Game[]
  favorites: Game[]
  recentlyAdded: Game[]
  recentlyPlayed: Game[]
  collections: Collection[]
  gameViewState: {
    viewMode: 'grid' | 'list' | 'compact' | 'carousel' | 'xmb'
    sortField: 'name' | 'releaseDate' | 'playtime' | 'lastPlayed' | 'addedAt' | 'launchCount' | 'rating'
    sortDirection: 'asc' | 'desc'
    filters: {
      systems: string[]
      genres: string[]
      developers: string[]
      publishers: string[]
      years: number[]
      emulators: string[]
      favoritesOnly: boolean
      installedOnly: boolean
      uninstalledOnly: boolean
      searchQuery: string
      hasSaves: boolean
    }
    groupBy: 'none' | 'system' | 'genre' | 'year' | 'developer' | 'publisher' | 'emulator'
  }
  setAllGames: (games: Game[]) => void
  setFavorites: (games: Game[]) => void
  setRecentlyAdded: (games: Game[]) => void
  setRecentlyPlayed: (games: Game[]) => void
  setCollections: (collections: Collection[]) => void
  setGameViewState: (state: any) => void
  addGame: (game: Game) => void
  removeGame: (id: string) => void
  updateGame: (game: Game) => void
  searchGames: (query: string) => void
  filterGames: (filters: any) => void
  sortGames: (sortField: string, sortDirection: string) => void
}

interface SystemStore {
  systems: System[]
  selectedSystem: System | null
  setSystems: (systems: System[]) => void
  setSelectedSystem: (system: System | null) => void
}

export interface AppStore {
  // Navigation
  currentPage: 'home' | 'games' | 'systems' | 'emulators' | 'themes' | 'downloads' | 'saves' | 'controllers' | 'settings' | 'game-detail' | 'system-detail' | 'emulator-detail' | 'search'
  setCurrentPage: (page: AppStore['currentPage']) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: { games: Game[]; systems: System[]; emulators: Emulator[]; themes: Theme[] }
  setSearchResults: (results: { games: Game[]; systems: System[]; emulators: Emulator[]; themes: Theme[] }) => void
  searchDebounceTimer: number | null
  setSearchDebounceTimer: (timer: number | null) => void
  miniPlayerOpen: boolean
  toggleMiniPlayer: () => void
  setMiniPlayerOpen: (open: boolean) => void

  // Emulator state
  emulator: EmulatorStore

  // Controller state
  controller: ControllerStore

  // Download state
  downloads: DownloadStore

  // Scan folder state
  scanFolders: ScanFolderStore

  // Statistics state
  statistics: StatisticsStore

  // Game library state
  gameLibrary: GameLibraryStore

  // System state
  systems: SystemStore

  // Theme
  theme: 'dark' | 'light' | 'system'
  setTheme: (theme: 'dark' | 'light' | 'system') => void
}

const defaultStore: AppStore = {
  // Navigation
  currentPage: 'home',
  setCurrentPage: (page: AppStore['currentPage']) => {},
  sidebarCollapsed: false,
  toggleSidebar: () => {},
  setSidebarCollapsed: (collapsed: boolean) => {},
  searchQuery: '',
  setSearchQuery: (query: string) => {},
  searchResults: { games: [], systems: [], emulators: [], themes: [] },
  setSearchResults: (results: { games: Game[]; systems: System[]; emulators: Emulator[]; themes: Theme[] }) => {},

  // Mini player
  miniPlayerOpen: false,
  toggleMiniPlayer: () => {},
  setMiniPlayerOpen: (open: boolean) => {},

  // Emulator state - initialized empty, loaded from database later
  emulator: {
    installedEmulators: [],
    availableEmulators: [],
    selectedEmulator: null,
    setInstalledEmulators: (emulators: Emulator[]) => {},
    setAvailableEmulators: (emulators: Emulator[]) => {},
    setSelectedEmulator: (emulator: Emulator | null) => {},
    emulatorSearchQuery: '',
    setEmulatorSearchQuery: (query: string) => {},
    emulatorSearchResults: [],
    setEmulatorSearchResults: (results: Emulator[]) => {},
  },

  // Controller state
  controller: {
    detectedControllers: [],
    selectedControllerProfile: null,
    setDetectedControllers: (controllers: ControllerProfile[]) => {},
    setSelectedControllerProfile: (profile: ControllerProfile | null) => {},
    controllerSearchQuery: '',
    setControllerSearchQuery: (query: string) => {},
    controllerSearchResults: [],
    setControllerSearchResults: (results: ControllerProfile[]) => {},
  },

  // Download state
  downloads: {
    activeDownloads: [],
    pendingDownloads: [],
    completedDownloads: [],
    failedDownloads: [],
    downloadHistory: [],
    setActiveDownloads: (downloads: Download[]) => {},
    setPendingDownloads: (downloads: Download[]) => {},
    setCompletedDownloads: (downloads: Download[]) => {},
    setFailedDownloads: (downloads: Download[]) => {},
    addToHistory: (download: Download) => {},
  },

  // Scan folder state
  scanFolders: {
    scanFolders: [],
    selectedScanFolder: null,
    setScanFolders: (folders: ScanFolder[]) => {},
    setSelectedScanFolder: (folder: ScanFolder | null) => {},
  },

  // Statistics state
  statistics: {
    statistics: null,
    setStatistics: (stats: Statistics) => {},
  },

  // Game library state - initialized empty, loaded from database later
  gameLibrary: {
    allGames: [],
    favorites: [],
    recentlyAdded: [],
    recentlyPlayed: [],
    collections: [],
    gameViewState: {
      viewMode: 'grid',
      sortField: 'name',
      sortDirection: 'asc',
      filters: {
        systems: [],
        genres: [],
        developers: [],
        publishers: [],
        years: [],
        emulators: [],
        favoritesOnly: false,
        installedOnly: false,
        uninstalledOnly: false,
        searchQuery: '',
        hasSaves: false,
      },
      groupBy: 'none',
    },
    setAllGames: (games: Game[]) => {},
    setFavorites: (games: Game[]) => {},
    setRecentlyAdded: (games: Game[]) => {},
    setRecentlyPlayed: (games: Game[]) => {},
    setCollections: (collections: Collection[]) => {},
    setGameViewState: (state: any) => {},
    addGame: (game: Game) => {},
    removeGame: (id: string) => {},
    updateGame: (game: Game) => {},
    searchGames: (query: string) => {},
    filterGames: (filters: any) => {},
    sortGames: (sortField: string, sortDirection: string) => {},
  },

  // System state - initialized empty, loaded from database later
  systems: {
    systems: [],
    selectedSystem: null,
    setSystems: (systems: System[]) => {},
    setSelectedSystem: (system: System | null) => {},
  },

  // Theme
  theme: 'dark',
  setTheme: (theme: 'dark' | 'light' | 'system') => {},
}

// Create the store with persistence
export const useStore = create<AppStore>()(
  persist(
    (set) => ({ ...defaultStore }),
    {
      name: 'mfy-emulator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: any) => ({
        // Persist only essential state
        currentPage: state.currentPage,
        sidebarCollapsed: state.sidebarCollapsed,
        searchQuery: state.searchQuery,
        searchResults: state.searchResults,
        miniPlayerOpen: state.miniPlayerOpen,
        theme: state.theme,
        // Emulator state
        emulator: {
          installedEmulators: state.emulator.installedEmulators,
          availableEmulators: state.emulator.availableEmulators,
          selectedEmulator: state.emulator.selectedEmulator,
        },
        // Controller state
        controller: {
          detectedControllers: state.controller.detectedControllers,
          selectedControllerProfile: state.controller.selectedControllerProfile,
        },
        // Download state
        downloads: {
          activeDownloads: state.downloads.activeDownloads,
          pendingDownloads: state.downloads.pendingDownloads,
          completedDownloads: state.downloads.completedDownloads,
          failedDownloads: state.downloads.failedDownloads,
          downloadHistory: state.downloads.downloadHistory,
        },
        // Scan folders
        scanFolders: {
          scanFolders: state.scanFolders.scanFolders,
          selectedScanFolder: state.scanFolders.selectedScanFolder,
        },
        // Statistics
        statistics: state.statistics.statistics,
        // Game library
        gameLibrary: {
          allGames: state.gameLibrary.allGames,
          favorites: state.gameLibrary.favorites,
          recentlyAdded: state.gameLibrary.recentlyAdded,
          recentlyPlayed: state.gameLibrary.recentlyPlayed,
          collections: state.gameLibrary.collections,
          gameViewState: state.gameLibrary.gameViewState,
        },
        // Systems
        systems: {
          systems: state.systems.systems,
          selectedSystem: state.systems.selectedSystem,
        },
      }),
    }
  )
)

export default useStore