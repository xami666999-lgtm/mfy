import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu, nativeImage, powerMonitor } from 'electron'
import path from 'path'
import Store from 'electron-store'
import fs from 'fs'
import https from 'https'
import { spawn } from 'child_process'
import { setupTorrentEngine } from './torrent'
import { setupAdBlocker } from './adblock'
import { loadAllProgress, saveProgressRow, saveProgressList } from './progress'
import { launchAndroidApp } from './android-apps'

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

app.setAppUserModelId('com.mfy.app')
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow()
      return
    }
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })
}

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
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
    return
  }
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    movable: true,
    resizable: true,
    fullscreenable: true,
    backgroundColor: '#050810',
    icon: resolveIcon('icons', 'mfy-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
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
    mainWindow?.focus()
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
  app.on('web-contents-created', (_evt, contents) => {
    contents.setWindowOpenHandler((details) => {
      try {
        if (contents.getType() === 'webview' && details.url && /^https?:/i.test(details.url)) {
          contents.loadURL(details.url)
        }
      } catch {}
      return { action: 'deny' }
    })
    contents.on('before-input-event', (_e, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') {
        mainWindow?.webContents.send('mfy-player-escape')
      }
    })
    if (contents.getType() === 'webview') {
      contents.on('ipc-message', (_e, channel) => {
        if (channel === 'mfy-exit') mainWindow?.webContents.send('mfy-player-escape')
        if (channel === 'mfy-mm') mainWindow?.webContents.send('mfy-player-mm')
      })
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault()
    }
  })

  mainWindow.on('close', (e) => {
    try { mainWindow?.webContents.send('mfy-flush') } catch {}
    try { flushWatch() } catch {}
    if (!(app as any).isQuitting) {
      e.preventDefault()
      ;(app as any).isQuitting = true
      setTimeout(() => app.quit(), 500)
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

function downloadHttps(url: string, dest?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const go = (u: string, hops = 0) => {
      if (hops > 8) return reject(new Error('too many redirects'))
      https.get(u, { headers: { 'User-Agent': 'MFY-Updater' } }, (res) => {
        const loc = res.headers.location
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && loc) {
          res.resume()
          return go(loc.startsWith('http') ? loc : new URL(loc, u).toString(), hops + 1)
        }
        if ((res.statusCode || 0) >= 400) return reject(new Error('http ' + res.statusCode))
        if (dest) {
          const out = fs.createWriteStream(dest)
          res.pipe(out)
          out.on('finish', () => resolve(dest))
          out.on('error', reject)
        } else {
          const chunks: Buffer[] = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        }
      }).on('error', reject)
    }
    go(url)
  })
}

async function mfySelfUpdate(installIfNewer = true) {
  const current = app.getVersion()
  const text = await downloadHttps('https://github.com/xami666999-lgtm/mfy/releases/latest/download/latest.yml')
  const latest = (String(text).match(/version:\s*([0-9.]+)/) || [])[1] || current
  const newer = latest.localeCompare(current, undefined, { numeric: true, sensitivity: 'base' }) > 0
  const url = `https://github.com/xami666999-lgtm/mfy/releases/latest/download/MFY-Setup-${latest}.exe`
  if (!newer) return { ok: true, current, latest, newer: false, url }
  new Notification({ title: 'MFY Update', body: `Downloading ${latest}…` }).show()
  mainWindow?.webContents.send('mfy:update-available', { version: latest })
  if (!installIfNewer) return { ok: true, current, latest, newer: true, url }
  const dest = path.join(app.getPath('temp'), `MFY-Setup-${latest}.exe`)
  await downloadHttps(url, dest)
  new Notification({ title: 'MFY Update Ready', body: `Installing ${latest}` }).show()
  mainWindow?.webContents.send('mfy:update-downloaded', { version: latest })
  spawn(dest, [], { detached: true, stdio: 'ignore' }).unref()
  setTimeout(() => { ;(app as any).isQuitting = true; app.quit() }, 600)
  return { ok: true, current, latest, newer: true, url, installing: true }
}

function setupAutoUpdater() {
  const enabled = store.get('autoUpdate', true) !== false
  if (enabled) {
    setTimeout(() => { mfySelfUpdate(true).catch(() => {}) }, 4000)
  }
  if (!autoUpdater || isDev) return

  try {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: 'https://github.com/xami666999-lgtm/mfy/releases/latest/download',
    })
  } catch {}

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

function addDesktopShortcut() {
  try {
    const path = require('path')
    const exePath = process.execPath
    const shortcutPath = path.join(app.getPath('desktop'), 'MFY.lnk')
    return shell.writeShortcutLink(shortcutPath, 'replace', {
      target: exePath,
      args: '',
      description: 'MFY - Movies For You',
      cwd: path.dirname(exePath),
      icon: path.join(process.resourcesPath || path.dirname(exePath), 'mfy.ico'),
      iconIndex: 0,
    })
  } catch {
    return false
  }
}

app.whenReady().then(() => {
  const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  app.userAgentFallback = chromeUA
  const { session } = require('electron')
  session.defaultSession.setUserAgent(chromeUA)
  try {
    session.fromPartition('persist:mfy').setUserAgent(chromeUA)
    session.fromPartition('persist:mfy').setPreloads([path.join(__dirname, 'guest-preload.js')])
    session.fromPartition('persist:mfy-sport').setUserAgent(chromeUA)
  } catch {}
  const stripFrame = (details: any, callback: any) => {
    const headers = { ...(details.responseHeaders || {}) }
    for (const key of Object.keys(headers)) {
      const k = key.toLowerCase()
      if (k === 'x-frame-options' || k === 'content-security-policy') delete headers[key]
    }
    callback({ responseHeaders: headers })
  }
  session.defaultSession.webRequest.onHeadersReceived(stripFrame)
  try { session.fromPartition('persist:mfy').webRequest.onHeadersReceived(stripFrame) } catch {}
  try { session.fromPartition('persist:mfy-sport').webRequest.onHeadersReceived(stripFrame) } catch {}
  createWindow()
  createTray()
  setupAutoUpdater()
  setupTorrentEngine()
  setupAdBlocker()
  if (app.isPackaged) addDesktopShortcut()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function flushWatch() {
  try {
    const rows = store.get('watchHistory') as any[]
    if (Array.isArray(rows)) saveProgressList(rows)
  } catch {}
}

app.on('before-quit', () => flushWatch())
app.on('will-quit', () => flushWatch())
try {
  powerMonitor.on('suspend', () => flushWatch())
  powerMonitor.on('lock-screen', () => flushWatch())
} catch {}

// Window controls
ipcMain.on('window-minimize', () => mainWindow?.minimize())
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window-fullscreen', () => {
  if (!mainWindow) return
  if (mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(false)
    mainWindow.setMovable(true)
    return
  }
  mainWindow.setFullScreen(true)
})
ipcMain.on('window-exit-fullscreen', () => {
  mainWindow?.setFullScreen(false)
  mainWindow?.setMovable(true)
})
ipcMain.on('window-move-display', () => {
  if (!mainWindow) return
  const { screen } = require('electron')
  const displays = screen.getAllDisplays()
  if (displays.length < 2) return
  const cur = screen.getDisplayMatching(mainWindow.getBounds())
  const next = displays.find((d: any) => d.id !== cur.id) || displays[0]
  const b = next.workArea
  mainWindow.setFullScreen(false)
  mainWindow.setMovable(true)
  mainWindow.setBounds({ x: b.x + 40, y: b.y + 40, width: Math.min(1400, b.width - 80), height: Math.min(900, b.height - 80) })
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
  ipcMain.handle('progress-load', (_event, email?: string, profileId?: string) => loadAllProgress(email, profileId))
  ipcMain.handle('progress-save', (_event, row: any) => saveProgressRow(row))
  ipcMain.handle('progress-save-all', (_event, rows: any[], email?: string, profileId?: string) => saveProgressList(rows, email, profileId))

  // Create desktop shortcut
  ipcMain.handle('createDesktopShortcut', async () => addDesktopShortcut())

// Open external URL
ipcMain.on('open-external', (_event, url: string) => shell.openExternal(url))
ipcMain.on('open-vlc', (_event, url: string) => {
  try {
    const { spawn } = require('child_process') as typeof import('child_process')
    const candidates = ['vlc', 'C:\\Program Files\\VideoLAN\\VLC\\vlc.exe', 'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe']
    let started = false
    for (const bin of candidates) {
      try {
        const child = spawn(bin, [String(url || '')], { detached: true, stdio: 'ignore' })
        child.unref()
        started = true
        break
      } catch {}
    }
    if (!started) shell.openExternal(String(url || ''))
  } catch {
    shell.openExternal(String(url || ''))
  }
})

ipcMain.handle('fetch-json', async (_event, url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; timeoutMs?: number }) => {
  const timeout = init?.timeoutMs || 8000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      method: init?.method || 'GET',
      headers: init?.headers,
      body: init?.body,
      signal: controller.signal,
    })
    const text = await res.text()
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}`, text }
    try { return { ok: true, json: JSON.parse(text) } } catch { return { ok: true, text } }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'fetch failed' }
  } finally {
    clearTimeout(timer)
  }
})

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
  try {
    return await mfySelfUpdate(true)
  } catch (err: any) {
    return { ok: false, current: app.getVersion(), reason: err?.message || 'unknown', url: 'https://github.com/xami666999-lgtm/mfy/releases/latest' }
  }
})

// Install a downloaded update (renderer "Restart & install" button)
ipcMain.handle('launch-android-app', async (_e, key: 'sportzx' | 'ak47') => launchAndroidApp(key))

ipcMain.handle('install-update', () => {
  if (!autoUpdater || isDev) return false
  try {
    autoUpdater.quitAndInstall()
    return true
  } catch {
    return false
  }
})
