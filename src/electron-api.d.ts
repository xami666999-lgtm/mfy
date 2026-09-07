interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
  changes?: number
  lastInsertRowid?: number | bigint
}

interface ResolvedStream {
  streamUrl: string
  mimeType: string
  quality: string
  bitrate: number
  sourceType: 'piped' | 'youtube-music'
  cachedPath?: string
  contentLength?: number
}

interface StreamResult {
  success: boolean
  data?: ResolvedStream
  error?: string
}

interface TrendingResult {
  success: boolean
  data?: {
    tracks: any[]
  }
  error?: string
}

interface SearchResult {
  success: boolean
  data?: {
    tracks: any[]
    artists: any[]
    albums: any[]
  }
  error?: string
}

interface CacheStats {
  count: number
  totalSize: number
}

interface ElectronAPI {
  // Window controls
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>

  // Database
  db: {
    run: (query: string, params?: any[]) => Promise<DatabaseResult<any>>
    get: (query: string, params?: any[]) => Promise<DatabaseResult<any>>
    all: (query: string, params?: any[]) => Promise<DatabaseResult<any[]>>
    transaction: (queries: { query: string; params: any[] }[]) => Promise<DatabaseResult<any>>
  }

  // Store
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
  delete: (key: string) => Promise<void>

  // File operations
  selectFolder: () => Promise<string | null>
  readFile: (filePath: string) => Promise<DatabaseResult<string>>
  writeFile: (filePath: string, data: string) => Promise<DatabaseResult<any>>
  deleteFile: (filePath: string) => Promise<DatabaseResult<any>>
  fileExists: (filePath: string) => Promise<boolean>
  getCacheDir: () => Promise<string>
  getCacheStats: () => Promise<CacheStats | null>

  // Stream Resolver
  stream: {
    resolve: (trackId: string, sourceUrl: string, sourceType: 'piped' | 'youtube-music') => Promise<StreamResult>
    search: (query: string, type: 'tracks' | 'artists' | 'albums', limit?: number) => Promise<SearchResult>
    trending: (limit?: number) => Promise<TrendingResult>
    trackInfo: (videoId: string, sourceType: 'piped' | 'youtube-music') => Promise<StreamResult>
    lyrics: (videoId: string, sourceType: 'piped' | 'youtube-music') => Promise<StreamResult>
    setPipedInstances: (instances: string[]) => Promise<StreamResult>
    setYtmInstances: (instances: string[]) => Promise<StreamResult>
  }

  // Notifications
  showNotification: (title: string, body: string, icon?: string) => void

  // External
  openExternal: (url: string) => void

  // Mini player
  toggleMiniPlayer: () => void
  showMiniPlayer: () => void
  hideMiniPlayer: () => void

  // Media session
  updateMediaSession: (track: any) => void

  // Media key event listeners
  onMediaPlayPause: (callback: () => void) => () => void
  onMediaNext: (callback: () => void) => () => void
  onMediaPrevious: (callback: () => void) => () => void
  onMediaStop: (callback: () => void) => () => void
}

export {}
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}