/** Browser-only preview mock so the UI can run without Electron.
 *  In Electron the real API is exposed by the preload via contextBridge,
 *  so we must NOT overwrite it. */
const store: Record<string, unknown> = {
  setupComplete: true,
  tmdbApiKey: '', // user can still paste in Settings
  watchlist: [],
}

if (!(window as any).electronAPI) {
  ;(window as any).electronAPI = {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    isMaximized: async () => false,
    get: async (key: string) => store[key] ?? null,
    set: async (key: string, value: unknown) => { store[key] = value },
    delete: async (key: string) => { delete store[key] },
    openExternal: (url: string) => window.open(url, '_blank'),
    selectFolder: async () => null,
    showNotification: () => {},
    isSetupComplete: async () => true,
    setSetupComplete: async () => { store.setupComplete = true },
    checkForUpdates: async () => ({ ok: false, reason: 'dev-or-unavailable' }),
  }
}
