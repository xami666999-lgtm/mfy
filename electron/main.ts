import { app, BrowserWindow, ipcMain, dialog, shell, Notification, Tray, Menu, nativeImage, globalShortcut, screen, powerMonitor } from 'electron'
import path from 'path'
import fs from 'fs'
import Store from 'electron-store'
import { database } from './database'
import { 
  resolveStream, 
  searchPiped, 
  searchYouTubeMusic, 
  getTrendingTracks,
  getTrackInfo,
  getLyrics,
  setPipedInstances,
  setYtmInstances
} from './services/streamResolver'

const store = new Store()
let mainWindow: BrowserWindow | null = null
let miniPlayerWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = !app.isPackaged
const userDataPath = app.getPath('userData')
const cacheDir = path.join(userDataPath, 'audio-cache')

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  let windowIcon: Electron.NativeImage
  const iconPath = path.join(__dirname, '../public/icon.png')
  
  if (fs.existsSync(iconPath)) {
    windowIcon = nativeImage.createFromPath(iconPath)
  } else {
    windowIcon = createDefaultTrayIcon()
  }

  mainWindow = new BrowserWindow({
    width: Math.min(1400, width - 100),
    height: Math.min(900, height - 100),
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#050810',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    show: false,
    title: 'MFY Music',
    icon: windowIcon,
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
    if (!app.isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function createMiniPlayer() {
  miniPlayerWindow = new BrowserWindow({
    width: 360,
    height: 100,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  if (isDev) {
    miniPlayerWindow.loadURL('http://localhost:5173/mini-player')
  } else {
    miniPlayerWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'mini-player' })
  }

  miniPlayerWindow.on('closed', () => {
    miniPlayerWindow = null
  })
}

function createTray() {
  let trayIcon: Electron.NativeImage
  const iconPath = path.join(__dirname, '../public/icon.png')
  
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath)
  } else {
    trayIcon = createDefaultTrayIcon()
  }
  
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))
  
  const updateTrayMenu = () => {
    const isPlaying = store.get('isPlaying', false)
    const currentTrack = store.get('currentTrack', null)
    
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : 'MFY Music', 
        enabled: false 
      },
      { type: 'separator' },
      { 
        label: isPlaying ? 'Pause' : 'Play', 
        click: () => mainWindow?.webContents.send('media-play-pause') 
      },
      { label: 'Next', click: () => mainWindow?.webContents.send('media-next') },
      { label: 'Previous', click: () => mainWindow?.webContents.send('media-previous') },
      { type: 'separator' },
      { label: 'Show MFY Music', click: () => mainWindow?.show() },
      { label: 'Mini Player', click: () => toggleMiniPlayer() },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit() } },
    ])
    tray?.setContextMenu(contextMenu)
    tray?.setToolTip(currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : 'MFY Music')
  }

  updateTrayMenu()
  ipcMain.on('update-tray-menu', updateTrayMenu)
  
  tray.on('double-click', () => mainWindow?.show())
}

function createDefaultTrayIcon(): Electron.NativeImage {
  const canvas = nativeImage.createFromBuffer(Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">' +
    '<rect width="16" height="16" rx="3" fill="#FF1493"/>' +
    '<path d="M5 4h2v8H5V4zm4 0h2v8H9V4zm4 0h2v8h-2V4z" fill="white"/>' +
    '</svg>', 'utf-8'
  ))
  return canvas
}

function registerGlobalShortcuts() {
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('media-play-pause')
  })
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow?.webContents.send('media-next')
  })
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow?.webContents.send('media-previous')
  })
  globalShortcut.register('MediaStop', () => {
    mainWindow?.webContents.send('media-stop')
  })
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll()
}

function setupPowerMonitor() {
  powerMonitor.on('suspend', () => {
    mainWindow?.webContents.send('media-pause')
  })
}

function toggleMiniPlayer() {
  if (miniPlayerWindow?.isVisible()) {
    miniPlayerWindow.hide()
  } else {
    if (!miniPlayerWindow) createMiniPlayer()
    miniPlayerWindow?.show()
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize
    miniPlayerWindow?.setPosition(width - 380, height - 140)
  }
}

app.whenReady().then(() => {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }
  createWindow()
  createTray()
  registerGlobalShortcuts()
  setupPowerMonitor()

  const savedPipedInstances = store.get('pipedInstances', []) as string[]
  const savedYtmInstances = store.get('ytmInstances', []) as string[]
  if (savedPipedInstances.length > 0) setPipedInstances(savedPipedInstances)
  if (savedYtmInstances.length > 0) setYtmInstances(savedYtmInstances)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  unregisterGlobalShortcuts()
  database.close()
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

// Database operations (using the database module)
ipcMain.handle('db-run', (_event, query: string, params: any[] = []) => {
  try {
    const stmt = database.prepare(query)
    const result = stmt.run(...params)
    return { success: true, changes: result.changes, lastInsertRowid: result.lastInsertRowid }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-get', (_event, query: string, params: any[] = []) => {
  try {
    const stmt = database.prepare(query)
    const result = stmt.get(...params)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-all', (_event, query: string, params: any[] = []) => {
  try {
    const stmt = database.prepare(query)
    const result = stmt.all(...params)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('db-transaction', (_event, queries: { query: string; params: any[] }[]) => {
  try {
    const transaction = database.transaction(queries)
    transaction(queries)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Store operations
ipcMain.handle('store-get', (_event, key: string) => store.get(key))
ipcMain.handle('store-set', (_event, key: string, value: unknown) => store.set(key, value))
ipcMain.handle('store-delete', (_event, key: string) => store.delete(key))

// File operations
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  })
  return result.filePaths[0] || null
})

ipcMain.handle('read-file', async (_event, filePath: string) => {
  try {
    const data = fs.readFileSync(filePath)
    return { success: true, data: data.toString('base64') }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-file', async (_event, filePath: string, data: string) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-file', async (_event, filePath: string) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('file-exists', (_event, filePath: string) => {
  return fs.existsSync(filePath)
})

ipcMain.handle('get-cache-dir', () => cacheDir)

// Stream Resolver IPC
ipcMain.handle('stream-resolve', async (_event, trackId: string, sourceUrl: string, sourceType: 'piped' | 'youtube-music') => {
  try {
    const stream = await resolveStream(trackId, sourceUrl, sourceType)
    return { success: true, data: stream }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stream-search', async (_event, query: string, type: 'tracks' | 'artists' | 'albums', limit: number) => {
  try {
    const [pipedResults, ytmResults] = await Promise.all([
      searchPiped(query, type, limit),
      searchYouTubeMusic(query, type, limit),
    ])
    
    const results = {
      tracks: [] as any[],
      artists: [] as any[],
      albums: [] as any[],
    }

    if (pipedResults) {
      if (pipedResults.items) {
        for (const item of pipedResults.items) {
          if (item.type === 'video' && results.tracks.length < limit) {
            results.tracks.push({
              id: `piped-${item.url}`,
              title: item.title,
              artist: item.uploaderName || 'Unknown Artist',
              album: item.album || undefined,
              albumArtUrl: item.thumbnail || undefined,
              duration: item.duration || 0,
              sourceUrl: `https://www.youtube.com/watch?v=${item.url}`,
              sourceType: 'piped',
            })
          }
        }
      }
    }

    if (ytmResults) {
      if (ytmResults.tracks) {
        for (const track of ytmResults.tracks) {
          if (results.tracks.length < limit) {
            results.tracks.push({
              id: `ytm-${track.videoId}`,
              title: track.title,
              artist: track.artists?.[0]?.name || 'Unknown Artist',
              artistId: track.artists?.[0]?.id,
              album: track.album?.name,
              albumId: track.album?.id,
              albumArtUrl: track.thumbnails?.[0]?.url,
              duration: track.duration || 0,
              sourceUrl: `https://music.youtube.com/watch?v=${track.videoId}`,
              sourceType: 'youtube-music',
            })
          }
        }
      }
      if (ytmResults.artists) {
        for (const artist of ytmResults.artists) {
          if (results.artists.length < limit) {
            results.artists.push({
              id: artist.browseId,
              name: artist.name,
              imageUrl: artist.thumbnails?.[0]?.url,
            })
          }
        }
      }
      if (ytmResults.albums) {
        for (const album of ytmResults.albums) {
          if (results.albums.length < limit) {
            results.albums.push({
              id: album.browseId,
              title: album.title,
              artist: album.artist,
              artistId: album.artistId,
              artworkUrl: album.thumbnails?.[0]?.url,
              releaseDate: album.year,
            })
          }
        }
      }
    }

    return { success: true, data: results }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stream-trending', async (_event, limit: number) => {
  try {
    const trending = await getTrendingTracks(limit)
    if (!trending) return { success: false, error: 'Failed to fetch trending' }
    
    const tracks = trending.items?.map((item: any, index: number) => ({
      id: `trending-${item.url}`,
      title: item.title,
      artist: item.uploaderName || 'Unknown Artist',
      album: item.album || undefined,
      albumArtUrl: item.thumbnail || undefined,
      duration: item.duration || 0,
      sourceUrl: `https://www.youtube.com/watch?v=${item.url}`,
      sourceType: 'piped',
    })) || []

    return { success: true, data: { tracks } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stream-track-info', async (_event, videoId: string, sourceType: 'piped' | 'youtube-music') => {
  try {
    const info = await getTrackInfo(videoId, sourceType)
    return { success: true, data: info }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stream-lyrics', async (_event, videoId: string, sourceType: 'piped' | 'youtube-music') => {
  try {
    const lyrics = await getLyrics(videoId, sourceType)
    return { success: true, data: lyrics }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('stream-set-piped-instances', async (_event, instances: string[]) => {
  await setPipedInstances(instances)
  store.set('pipedInstances', instances)
  return { success: true }
})

ipcMain.handle('stream-set-ytm-instances', async (_event, instances: string[]) => {
  await setYtmInstances(instances)
  store.set('ytmInstances', instances)
  return { success: true }
})

ipcMain.handle('get-cache-stats', async () => {
  try {
    const stats = database.getCacheStats()
    return { success: true, data: stats }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Notifications
ipcMain.on('show-notification', (_event, title: string, body: string, icon?: string) => {
  new Notification({ title, body, icon: icon ? nativeImage.createFromPath(icon) : undefined }).show()
})

// Open external URL
ipcMain.on('open-external', (_event, url: string) => shell.openExternal(url))

// Mini player
ipcMain.on('toggle-mini-player', toggleMiniPlayer)
ipcMain.on('show-mini-player', () => {
  if (!miniPlayerWindow) createMiniPlayer()
  miniPlayerWindow?.show()
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  miniPlayerWindow?.setPosition(width - 380, height - 140)
})
ipcMain.on('hide-mini-player', () => miniPlayerWindow?.hide())

// Media session info for tray updates
ipcMain.on('media-session-update', (_event, track: any) => {
  store.set('currentTrack', track)
  store.set('isPlaying', track?.isPlaying ?? false)
  mainWindow?.webContents.send('update-tray-menu')
})