import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Database
  db: {
    run: (query: string, params?: any[]) => ipcRenderer.invoke('db-run', query, params),
    get: (query: string, params?: any[]) => ipcRenderer.invoke('db-get', query, params),
    all: (query: string, params?: any[]) => ipcRenderer.invoke('db-all', query, params),
    transaction: (queries: { query: string; params: any[] }[]) => ipcRenderer.invoke('db-transaction', queries),
  },

  // Store
  get: (key: string) => ipcRenderer.invoke('store-get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  delete: (key: string) => ipcRenderer.invoke('store-delete', key),

  // File operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('write-file', filePath, data),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  getCacheDir: () => ipcRenderer.invoke('get-cache-dir'),
  getCacheStats: () => ipcRenderer.invoke('get-cache-stats'),

  // Stream Resolver
  stream: {
    resolve: (trackId: string, sourceUrl: string, sourceType: 'piped' | 'youtube-music') => 
      ipcRenderer.invoke('stream-resolve', trackId, sourceUrl, sourceType),
    search: (query: string, type: 'tracks' | 'artists' | 'albums', limit?: number) => 
      ipcRenderer.invoke('stream-search', query, type, limit),
    trending: (limit?: number) => 
      ipcRenderer.invoke('stream-trending', limit),
    trackInfo: (videoId: string, sourceType: 'piped' | 'youtube-music') => 
      ipcRenderer.invoke('stream-track-info', videoId, sourceType),
    lyrics: (videoId: string, sourceType: 'piped' | 'youtube-music') => 
      ipcRenderer.invoke('stream-lyrics', videoId, sourceType),
    setPipedInstances: (instances: string[]) => 
      ipcRenderer.invoke('stream-set-piped-instances', instances),
    setYtmInstances: (instances: string[]) => 
      ipcRenderer.invoke('stream-set-ytm-instances', instances),
  },

  // Notifications
  showNotification: (title: string, body: string, icon?: string) => ipcRenderer.send('show-notification', title, body, icon),

  // External
  openExternal: (url: string) => ipcRenderer.send('open-external', url),

  // Mini player
  toggleMiniPlayer: () => ipcRenderer.send('toggle-mini-player'),
  showMiniPlayer: () => ipcRenderer.send('show-mini-player'),
  hideMiniPlayer: () => ipcRenderer.send('hide-mini-player'),

  // Media session
  updateMediaSession: (track: any) => ipcRenderer.send('media-session-update', track),

  // Media key event listeners
  onMediaPlayPause: (callback: () => void) => {
    ipcRenderer.on('media-play-pause', callback)
    return () => ipcRenderer.removeListener('media-play-pause', callback)
  },
  onMediaNext: (callback: () => void) => {
    ipcRenderer.on('media-next', callback)
    return () => ipcRenderer.removeListener('media-next', callback)
  },
  onMediaPrevious: (callback: () => void) => {
    ipcRenderer.on('media-previous', callback)
    return () => ipcRenderer.removeListener('media-previous', callback)
  },
  onMediaStop: (callback: () => void) => {
    ipcRenderer.on('media-stop', callback)
    return () => ipcRenderer.removeListener('media-stop', callback)
  },
})