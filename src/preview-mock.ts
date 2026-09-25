/** Browser / iOS preview mock so the UI can run without Electron.
 *  In Electron the real API is exposed by the preload via contextBridge,
 *  so we must NOT overwrite it. */
const KEY = 'mfy-web-store'
let store: Record<string, unknown> = {
  setupComplete: true,
  tmdbApiKey: '',
  watchlist: [],
  watchHistory: [],
  favorites: [],
}
try {
  const raw = localStorage.getItem(KEY)
  if (raw) store = { ...store, ...JSON.parse(raw) }
} catch {}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch {}
}

if (!(window as any).electronAPI) {
  ;(window as any).electronAPI = {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    isMaximized: async () => false,
    get: async (key: string) => store[key] ?? null,
    set: async (key: string, value: unknown) => { store[key] = value; persist() },
    delete: async (key: string) => { delete store[key]; persist() },
    openExternal: (url: string) => window.open(url, '_blank'),
    selectFolder: async () => null,
    showNotification: () => {},
    isSetupComplete: async () => true,
    setSetupComplete: async () => { store.setupComplete = true; persist() },
    checkForUpdates: async () => ({ ok: false, reason: 'ios-or-web' }),
    loadProgress: async () => store.watchHistory || [],
    saveProgressAll: async (rows: unknown) => { store.watchHistory = rows; persist() },
    onFlushProgress: () => () => {},
    onWindowShown: () => () => {},
    onUpdateDownloaded: () => () => {},
    installUpdate: () => {},
  }
}
