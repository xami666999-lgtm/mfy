import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs'

// Auto-updater (only active in packaged builds)
let autoUpdater: any = null
try {
  if (app.isPackaged) {
    autoUpdater = require('electron-updater').autoUpdater
  }
} catch {
  // electron-updater may not be installed yet during first dev runs
}

const store = new Store()
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged

function resolveIcon(...parts: string[]) {
  const candidates = [
    path.join(__dirname, '..', 'dist', ...parts),
    path.join(__dirname, '..', 'public', ...parts),
    path.join(process.resourcesPath || '', ...parts),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#050810',
    icon: resolveIcon('icons', 'mfy-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (e) => {
    if (!(app as any).isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  const iconPath = resolveIcon('icon.png')
  if (fs.existsSync(iconPath)) {
    const icon = nativeImage.createFromPath(iconPath)
    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show MFY', click: () => mainWindow?.show() },
      { type: 'separator' },
      {
        label: 'Check for Updates',
        click: () => {
          if (autoUpdater) autoUpdater.checkForUpdatesAndNotify()
          else new Notification({ title: 'MFY', body: 'Auto-update is only available in packaged builds.' }).show()
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          ;(app as any).isQuitting = true
          app.quit()
        },
      },
    ])
    tray.setToolTip('MFY - Movies For You')
    tray.setContextMenu(contextMenu)
    tray.on('double-click', () => mainWindow?.show())
  }
}

function setupAutoUpdater() {
  if (!autoUpdater || isDev) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info: any) => {
    new Notification({
      title: 'MFY Update Available',
      body: `Version ${info.version} is downloading in the background…`,
    }).show()
  })

  autoUpdater.on('update-downloaded', (info: any) => {
    new Notification({
      title: 'MFY Update Ready',
      body: `Version ${info.version} will install when you quit the app.`,
    }).show()
    // Optional: prompt user
    if (mainWindow) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: 'Update Ready',
          message: `MFY ${info.version} has been downloaded.`,
          detail: 'Restart now to apply the update, or it will install automatically when you quit.',
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall()
        })
    }
  })

  autoUpdater.on('error', (err: Error) => {
    console.error('[autoUpdater]', err.message)
  })

  // Check a few seconds after launch
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {})
  }, 5000)
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window-close', () => mainWindow?.close())
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)

// Store operations
ipcMain.handle('store-get', (_event, key: string) => store.get(key))
ipcMain.handle('store-set', (_event, key: string, value: unknown) => store.set(key, value))
ipcMain.handle('store-delete', (_event, key: string) => store.delete(key))

// Open external URL
ipcMain.on('open-external', (_event, url: string) => shell.openExternal(url))

// File dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0] || null
})

// Notification
ipcMain.on('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show()
})

// Setup complete flag
ipcMain.handle('is-setup-complete', () => store.get('setupComplete', false))
ipcMain.handle('set-setup-complete', () => store.set('setupComplete', true))
ipcMain.handle('reset-setup', () => {
  store.delete('setupComplete')
  return true
})

// Manual update check from renderer
ipcMain.handle('check-for-updates', async () => {
  if (!autoUpdater || isDev) return { ok: false, reason: 'dev-or-unavailable' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { ok: true, updateInfo: result?.updateInfo || null }
  } catch (err: any) {
    return { ok: false, reason: err?.message || 'unknown' }
  }
})
