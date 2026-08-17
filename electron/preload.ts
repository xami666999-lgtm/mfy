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

  // Dialog
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Notifications
  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', title, body),

  // Setup
  isSetupComplete: () => ipcRenderer.invoke('is-setup-complete'),
  setSetupComplete: () => ipcRenderer.invoke('set-setup-complete'),
  resetSetup: () => ipcRenderer.invoke('reset-setup'),

  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
})
