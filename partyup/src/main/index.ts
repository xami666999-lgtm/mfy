import { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme, session, protocol } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Store from 'electron-store';
import windowStateKeeper from 'electron-window-state';
import { isDev } from './utils/env.js';
import { setupIpcHandlers } from './ipc/index.js';
import { initializeServices } from './services/index.js';
import { PluginManager } from './plugins/PluginManager.js';
import { ThemeManager } from './theme/ThemeManager.js';
import { Database } from './database/Database.js';
import { SteamService } from './services/SteamService.js';
import { TorrentService } from './services/TorrentService.js';
import { EmulatorService } from './services/EmulatorService.js';
import { ModManagerService } from './services/ModManagerService.js';
import { MultiplayerService } from './services/MultiplayerService.js';
import { CloudGamingService } from './services/CloudGamingService.js';
import { OptimizationService } from './services/OptimizationService.js';
import { AchievementService } from './services/AchievementService.js';
import { SaveManagerService } from './services/SaveManagerService.js';
import { LibraryService } from './services/LibraryService.js';
import { SocialService } from './services/SocialService.js';
import { DiscordService } from './services/DiscordService.js';
import { MetadataService } from './services/MetadataService.js';
import { DownloadService } from './services/DownloadService.js';
import { HoardSyncService } from './services/HoardSyncService.js';

declare const __dirname: string;

const store = new Store<any>({
  name: 'partyup-config',
  defaults: {
    windowBounds: { width: 1400, height: 900 },
    theme: 'partyup-dark',
    language: 'en',
    steam: { enabled: true, apiKey: '', autoLogin: true },
    torrent: { enabled: true, downloadPath: '', maxConnections: 100 },
    emulators: { paths: {}, autoDetect: true },
    library: { paths: [], autoScan: true },
    cloudGaming: { services: {} },
    optimization: { profiles: {} },
    social: { enabled: true, platforms: [] },
    discord: { enabled: true, richPresence: true },
    updates: { autoCheck: true, autoDownload: true },
    plugins: { enabled: [], marketplace: true },
  },
});

log.initialize({ preload: true });
log.info('PartyUp starting...');

let mainWindow: BrowserWindow | null = null;
let pluginManager: PluginManager;
let themeManager: ThemeManager;
let database: Database;

const services = {
  steam: null as SteamService | null,
  torrent: null as TorrentService | null,
  emulator: null as EmulatorService | null,
  modManager: null as ModManagerService | null,
  multiplayer: null as MultiplayerService | null,
  cloudGaming: null as CloudGamingService | null,
  optimization: null as OptimizationService | null,
  achievement: null as AchievementService | null,
  saveManager: null as SaveManagerService | null,
  hoardSync: null as HoardSyncService | null,
  library: null as LibraryService | null,
  social: null as SocialService | null,
  discord: null as DiscordService | null,
  metadata: null as MetadataService | null,
  download: null as DownloadService | null,
};

async function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: store.get('windowBounds.width') as number,
    defaultHeight: store.get('windowBounds.height') as number,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1a2e',
      symbolColor: '#ffffff',
      height: 36,
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev,
      experimentalFeatures: true,
    },
    show: false,
    backgroundColor: '#0f0f1a',
    icon: join(__dirname, '../../build/icon.ico'),
  });

  mainWindowState.manage(mainWindow);

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow?.getBounds());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (isDev) {
    await mainWindow.loadURL('http://localhost:3000');
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

async function initializeApp() {
  try {
    database = new Database();
    await database.initialize();

    themeManager = new ThemeManager(mainWindow!);
    await themeManager.initialize();

    pluginManager = new PluginManager();
    await pluginManager.loadPlugins();

    services.steam = new SteamService();
    services.torrent = new TorrentService();
    services.emulator = new EmulatorService();
    services.modManager = new ModManagerService();
    services.multiplayer = new MultiplayerService();
    services.cloudGaming = new CloudGamingService();
    services.optimization = new OptimizationService();
services.hoardSync = new HoardSyncService(database);
    services.hoardSync = new HoardSyncService(database);
    services.achievement = new AchievementService();
    services.saveManager = new SaveManagerService();
    services.library = new LibraryService();
    services.social = new SocialService();
    services.discord = new DiscordService();
    services.metadata = new MetadataService();
    services.download = new DownloadService();

    await initializeServices(services, store, database, pluginManager);

    setupIpcHandlers(mainWindow!, services, store, database, pluginManager, themeManager);

    setupAutoUpdater();

    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    await app.whenReady();
    await createWindow();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });

    log.info('PartyUp initialized successfully');
  } catch (error) {
    log.error('Failed to initialize app:', error);
    dialog.showErrorBox('PartyUp Error', `Failed to start: ${error.message}`);
    app.quit();
  }
}

function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', () => {
    log.info('Update available');
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart to apply?',
      buttons: ['Restart Now', 'Later'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  log.info('Shutting down...');
  for (const [name, service] of Object.entries(services)) {
    if (service && typeof service.shutdown === 'function') {
      try {
        await service.shutdown();
      } catch (e) {
        log.error(`Error shutting down ${name}:`, e);
      }
    }
  }
  await pluginManager.shutdown();
  await database.close();
});

initializeApp();

export { mainWindow, services, store, database, pluginManager, themeManager };
