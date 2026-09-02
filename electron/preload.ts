import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // Store
  get: (key: string) => ipcRenderer.invoke('store-get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  delete: (key: string) => ipcRenderer.invoke('store-delete', key),

  // External
  openExternal: (url: string) => ipcRenderer.send('open-external', url),

  // CORS-free text fetch (IPTV playlists)
  fetchText: (url: string, timeoutMs?: number) => ipcRenderer.invoke('fetch-text', url, timeoutMs),
  fetchJson: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; timeoutMs?: number }) => ipcRenderer.invoke('fetch-json', url, init),

  // Dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFileText: () => ipcRenderer.invoke('select-file-text'),

  // Notifications
  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),

  // Setup
  isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
  setSetupComplete: () => ipcRenderer.invoke('set-setup-complete'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateDownloaded: (cb: (info: any) => void) => {
    const listener = (_e: unknown, info: any) => cb(info)
    ipcRenderer.on('mfy:update-downloaded', listener)
    return () => ipcRenderer.removeListener('mfy:update-downloaded', listener)
  },
  onUpdateAvailable: (cb: (info: any) => void) => {
    const listener = (_e: unknown, info: any) => cb(info)
    ipcRenderer.on('mfy:update-available', listener)
    return () => ipcRenderer.removeListener('mfy:update-available', listener)
  },

  // Window visibility (for the intro splash)
  onWindowShown: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('mfy-window-shown', listener)
    return () => ipcRenderer.removeListener('mfy-window-shown', listener)
  },

  // Desktop shortcut
  createDesktopShortcut: () => ipcRenderer.invoke('createDesktopShortcut'),
})

contextBridge.exposeInMainWorld('torrentAPI', {
  add: (torrentId: string) => ipcRenderer.invoke('torrent:add', torrentId),
  list: () => ipcRenderer.invoke('torrent:list'),
  remove: (infoHash: string) => ipcRenderer.invoke('torrent:remove', infoHash),
  files: (infoHash: string) => ipcRenderer.invoke('torrent:files', infoHash),
  onProgress: (cb: (t: any) => void) => {
    const listener = (_e: unknown, t: any) => cb(t)
    ipcRenderer.on('torrent:progress', listener)
    return () => ipcRenderer.removeListener('torrent:progress', listener)
  },
})
