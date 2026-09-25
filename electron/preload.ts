import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  fullscreen: () => ipcRenderer.send('window-fullscreen'),
  exitFullscreen: () => ipcRenderer.send('window-exit-fullscreen'),
  close: () => ipcRenderer.send('window-close'),
  moveDisplay: () => ipcRenderer.send('window-move-display'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  get: (key: string) => ipcRenderer.invoke('store-get', key),
  set: (key: string, value: unknown) => ipcRenderer.invoke('store-set', key, value),
  delete: (key: string) => ipcRenderer.invoke('store-delete', key),

  openExternal: (url: string) => ipcRenderer.send('open-external', url),
  openVlc: (url: string) => ipcRenderer.send('open-vlc', url),

  fetchText: (url: string, timeoutMs?: number) => ipcRenderer.invoke('fetch-text', url, timeoutMs),
  fetchJson: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; timeoutMs?: number }) => ipcRenderer.invoke('fetch-json', url, init),

  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFileText: () => ipcRenderer.invoke('select-file-text'),

  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),

  isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
  setSetupComplete: () => ipcRenderer.invoke('set-setup-complete'),

  onPlayerEscape: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('mfy-player-escape', listener)
    return () => ipcRenderer.removeListener('mfy-player-escape', listener)
  },
  onPlayerMouse: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('mfy-player-mm', listener)
    return () => ipcRenderer.removeListener('mfy-player-mm', listener)
  },
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

  onWindowShown: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('mfy-window-shown', listener)
    return () => ipcRenderer.removeListener('mfy-window-shown', listener)
  },

  createDesktopShortcut: () => ipcRenderer.invoke('createDesktopShortcut'),
  launchAndroidApp: (key: 'sportzx' | 'ak47') => ipcRenderer.invoke('launch-android-app', key),
  loadProgress: (email?: string, profileId?: string) => ipcRenderer.invoke('progress-load', email, profileId),
  saveProgressRow: (row: unknown) => ipcRenderer.invoke('progress-save', row),
  saveProgressAll: (rows: unknown[], email?: string, profileId?: string) => ipcRenderer.invoke('progress-save-all', rows, email, profileId),
  onFlushProgress: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('mfy-flush', listener)
    return () => ipcRenderer.removeListener('mfy-flush', listener)
  },

  openYouTubeLogin: () => ipcRenderer.invoke('youtube-login'),
  youtubeLoginStatus: () => ipcRenderer.invoke('youtube-login-status'),

  jellyfinStatus: () => ipcRenderer.invoke('jellyfin-status'),
  jellyfinStart: () => ipcRenderer.invoke('jellyfin-start'),
  jellyfinStop: () => ipcRenderer.invoke('jellyfin-stop'),
  jellyfinPickPlugin: () => ipcRenderer.invoke('jellyfin-pick-plugin'),
  jellyfinInstallUrl: (url: string) => ipcRenderer.invoke('jellyfin-install-url', url),
  jellyfinOpenDashboard: () => ipcRenderer.invoke('jellyfin-open-dashboard'),
  jellyfinOpenPlugins: () => ipcRenderer.invoke('jellyfin-open-plugins'),
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
