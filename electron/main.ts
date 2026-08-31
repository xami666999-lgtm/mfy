import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu, nativeImage } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs'
import { setupTorrentEngine } from './torrent'
import { setupAdBlocker } from './adblock'

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

  // Re-trigger the intro splash whenever the window becomes visible
  // (including re-opening from the tray).
  mainWindow.on('show', () => {
    mainWindow?.webContents.send('mfy-window-shown')
  })

  // Never allow popup windows (popunder/popup ads from embedded players).
  // Deny everything — embedded players should stay inside the app. Links that
  // the user explicitly opens (e.g. IMDb) go through `electronAPI.openExternal`.
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault()
    }
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

  const enabled = store.get('autoUpdate', true) !== false
  autoUpdater.autoDownload = enabled
  autoUpdater.autoInstallOnAppQuit = enabled

  autoUpdater.on('update-available', (info: any) => {
    if (!enabled) return
    new Notification({
      title: 'MFY Update Available',
      body: `Version ${info.version} is downloading in the background…`,
    }).show()
    mainWindow?.webContents.send('mfy:update-available', info)
  })

  autoUpdater.on('update-downloaded', (info: any) => {
    if (!enabled) return
    new Notification({
      title: 'MFY Update Ready',
      body: `Version ${info.version} will install when you quit the app.`,
    }).show()
    mainWindow?.webContents.send('mfy:update-downloaded', info)
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
  if (enabled) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {})
    }, 5000)
  }
}

app.whenReady().then(() => {
  createWindow()
  createTray()
  setupAutoUpdater()
  setupTorrentEngine()
  setupAdBlocker()

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
  ipcMain.handle('store-set', (_event, key: string, value: unknown) => {
    store.set(key, value)
    // If autoUpdate setting changed, reconfigure autoUpdater
    if (key === 'autoUpdate' && autoUpdater && !isDev) {
      const enabled = value !== false
      autoUpdater.autoDownload = enabled
      autoUpdater.autoInstallOnAppQuit = enabled
    }
    return true
  })
  ipcMain.handle('store-delete', (_event, key: string) => store.delete(key))

  // Create desktop shortcut
  ipcMain.handle('createDesktopShortcut', async () => {
    try {
      const { app, shell } = require('electron')
      const path = require('path')
      const fs = require('fs')
      const exePath = process.execPath
      const desktopDir = app.getPath('desktop')
      const shortcutPath = path.join(desktopDir, 'MFY.lnk')
      if (!fs.existsSync(shortcutPath)) {
        await shell.writeShortcutLink({
          target: exePath,
          args: '',
          description: 'MFY - Movies For You',
          cwd: path.dirname(exePath),
        }, shortcutPath)
      }
      return true
    } catch (e) {
      console.error('Failed to create desktop shortcut:', e)
      return false
    }
  })

// Open external URL
ipcMain.on('open-external', (_event, url: string) => shell.openExternal(url))

// Fetch text via Node (bypasses renderer CORS) — used for IPTV playlists
ipcMain.handle('fetch-text', async (_event, url: string, timeoutMs?: number) => {
  const timeout = timeoutMs || 15000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return { ok: true, text: await res.text() }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'fetch failed' }
  } finally {
    clearTimeout(timer)
  }
})

// File dialog
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0] || null
})

// Open a file picker and return { path, text } for importable text files
ipcMain.handle('select-file-text', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Playlists & Subtitles', extensions: ['m3u', 'm3u8', 'srt', 'vtt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  const path = result.filePaths[0]
  if (!path) return null
  try {
    const fs = await import('node:fs/promises')
    const text = await fs.readFile(path, 'utf-8')
    return { path, text }
  } catch {
    return null
  }
})

// Notification
ipcMain.on('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show()
})

// Setup complete flag
ipcMain.handle('is-setup-complete', () => store.get('setupComplete', false))
ipcMain.handle('set-setup-complete', () => store.set('setupComplete', true))

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

// Install a downloaded update (renderer "Restart & install" button)
ipcMain.handle('install-update', () => {
  if (!autoUpdater || isDev) return false
  try {
    autoUpdater.quitAndInstall()
    return true
  } catch {
    return false
  }
})
