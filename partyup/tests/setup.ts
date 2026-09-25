import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Electron APIs
vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    send: vi.fn(),
  },
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
}));

// Mock window.electron
Object.defineProperty(window, 'electron', {
  value: {
    ipc: {
      invoke: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    },
    platform: 'win32',
    versions: { node: '20.0.0', electron: '28.0.0' },
  },
  writable: true,
});

// Mock window.api
Object.defineProperty(window, 'api', {
  value: {
    steam: {
      getLibrary: vi.fn(),
      getAchievements: vi.fn(),
      getPlaytime: vi.fn(),
      launchGame: vi.fn(),
      getDepots: vi.fn(),
      downloadDepot: vi.fn(),
      getWorkshopItems: vi.fn(),
      subscribeWorkshop: vi.fn(),
      unsubscribeWorkshop: vi.fn(),
      getDlc: vi.fn(),
      installDlcUnlocker: vi.fn(),
      getControllerConfig: vi.fn(),
      setControllerConfig: vi.fn(),
    },
    torrent: {
      addMagnet: vi.fn(),
      addTorrent: vi.fn(),
      getTorrents: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      remove: vi.fn(),
      getHydraSources: vi.fn(),
      searchHydra: vi.fn(),
    },
    emulator: {
      getEmulators: vi.fn(),
      detectEmulators: vi.fn(),
      launchRom: vi.fn(),
      getRoms: vi.fn(),
      scanRoms: vi.fn(),
      getRetroArchCores: vi.fn(),
      installCore: vi.fn(),
      updateCores: vi.fn(),
    },
    mods: {
      getMods: vi.fn(),
      installMod: vi.fn(),
      uninstallMod: vi.fn(),
      enableMod: vi.fn(),
      disableMod: vi.fn(),
      getLoadOrder: vi.fn(),
      setLoadOrder: vi.fn(),
      getSources: vi.fn(),
      searchMods: vi.fn(),
      installModlist: vi.fn(),
    },
    library: {
      getGames: vi.fn(),
      addGame: vi.fn(),
      removeGame: vi.fn(),
      updateGame: vi.fn(),
      getViews: vi.fn(),
      createView: vi.fn(),
      getStats: vi.fn(),
      getBacklog: vi.fn(),
      addToBacklog: vi.fn(),
      rateGame: vi.fn(),
      addNote: vi.fn(),
      detectDuplicates: vi.fn(),
      scanPortable: vi.fn(),
    },
    settings: {
      get: vi.fn(),
      set: vi.fn(),
      getAll: vi.fn(),
      reset: vi.fn(),
    },
    themes: {
      get: vi.fn(),
      setTheme: vi.fn(),
      install: vi.fn(),
      create: vi.fn(),
      getMarketplace: vi.fn(),
    },
    system: {
      openExternal: vi.fn(),
      showInFolder: vi.fn(),
      openPath: vi.fn(),
      getInfo: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
      setFullscreen: vi.fn(),
    },
  },
  writable: true,
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console.error in tests (optional)
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
  originalError.call(console, ...args);
};
