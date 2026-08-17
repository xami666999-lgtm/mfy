import { ipcMain, BrowserWindow } from 'electron'

const VIDEO_EXT = /\.(mp4|mkv|avi|mov|webm|m4v|ts|flv|wmv|mpg|mpeg|3gp|ogv)$/i
let clientPromise: Promise<any> | null = null
let serverBase: string | null = null
let serverPort = 0
let progressTimers = new Map<string, ReturnType<typeof setInterval>>()

function getClient(): Promise<any> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const specifier = 'webtorrent'
      const mod: any = await import(/* @vite-ignore */ specifier)
      const WebTorrent = mod.default || mod
      return new WebTorrent()
    })()
  }
  return clientPromise
}

async function ensureServer() {
  if (serverBase) return serverBase
  const client = await getClient()
  const instance = client.createServer({ hostname: '127.0.0.1' })
  await new Promise<void>((resolve, reject) => {
    instance.server.listen(0, '127.0.0.1', () => resolve())
    instance.server.on('error', reject)
  })
  serverPort = instance.server.address().port
  serverBase = `http://127.0.0.1:${serverPort}`
  return serverBase
}

function fullStreamUrl(torrent: any, file: any) {
  return `${serverBase}${file.streamURL}`
}

function serializeTorrent(torrent: any) {
  return {
    infoHash: torrent.infoHash,
    name: torrent.name || torrent.infoHash,
    length: torrent.length || 0,
    progress: torrent.progress || 0,
    downloadSpeed: torrent.downloadSpeed || 0,
    uploadSpeed: torrent.uploadSpeed || 0,
    numPeers: torrent.numPeers || 0,
    downloaded: torrent.downloaded || 0,
  }
}

function videoFiles(torrent: any) {
  return (torrent.files || [])
    .filter((f: any) => VIDEO_EXT.test(f.name || ''))
    .sort((a: any, b: any) => b.length - a.length)
}

function bestVideo(torrent: any) {
  const videos = videoFiles(torrent)
  return videos[0] || (torrent.files || [])[0]
}

function serializeFiles(torrent: any) {
  return (torrent.files || []).map((f: any) => ({
    name: f.name,
    path: f.path,
    length: f.length,
    streamUrl: fullStreamUrl(torrent, f),
  }))
}

function startProgress(torrent: any) {
  if (progressTimers.has(torrent.infoHash)) return
  const timer = setInterval(() => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win || win.isDestroyed()) return
    win.webContents.send('torrent:progress', serializeTorrent(torrent))
  }, 1000)
  progressTimers.set(torrent.infoHash, timer)
  torrent.on('done', () => {
    const t = progressTimers.get(torrent.infoHash)
    if (t) clearInterval(t)
    progressTimers.delete(torrent.infoHash)
  })
}

function extractFileIdx(torrentId: string, fallback?: unknown): number | undefined {
  const param = typeof fallback === 'number' ? fallback : undefined
  if (typeof param === 'number' && Number.isInteger(param)) return param
  const m = String(torrentId || '').match(/[?&]fileIdx=(\d+)/i)
  return m ? Number(m[1]) : undefined
}

function registerHandlers() {
  if ((ipcMain as any)._mfyTorrentRegistered) return
  ;(ipcMain as any)._mfyTorrentRegistered = true

  ipcMain.handle('torrent:add', async (_event, torrentId: unknown, fileIdx?: unknown) => {
    if (typeof torrentId !== 'string' || !torrentId.trim()) {
      return { ok: false, error: 'Invalid torrent ID.' }
    }
    const client = await getClient()
    try {
      const cleanId = String(torrentId.trim()).replace(/[?&]fileIdx=\d+/i, '')
      const torrent = await new Promise<any>((resolve, reject) => {
        const t = client.add(cleanId, (readyTorrent: any) => resolve(readyTorrent))
        t.once?.('error', reject)
        client.once?.('error', reject)
      })
      await ensureServer()
      startProgress(torrent)
      const allFiles = torrent.files || []
      const wantedIdx = extractFileIdx(torrentId, fileIdx)
      const wanted =
        typeof wantedIdx === 'number' && allFiles[wantedIdx] ? allFiles[wantedIdx] : null
      const best = wanted || bestVideo(torrent)
      const files = serializeFiles(torrent)
      return {
        ok: true,
        infoHash: torrent.infoHash,
        name: torrent.name,
        files,
        best: best ? { name: best.name, length: best.length, streamUrl: fullStreamUrl(torrent, best) } : null,
      }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Could not add torrent.' }
    }
  })

  ipcMain.handle('torrent:list', async () => {
    try {
      const client = await getClient()
      return (client.torrents || []).map((t: any) => serializeTorrent(t))
    } catch {
      return []
    }
  })

  ipcMain.handle('torrent:remove', async (_event, infoHash: unknown) => {
    if (typeof infoHash !== 'string') return { ok: false }
    try {
      const client = await getClient()
      const torrent = client.get(infoHash)
      if (!torrent) return { ok: false, error: 'Not found.' }
      await new Promise<void>((resolve) => {
        torrent.destroy(() => resolve())
      })
      const t = progressTimers.get(infoHash)
      if (t) clearInterval(t)
      progressTimers.delete(infoHash)
      return { ok: true }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Could not remove torrent.' }
    }
  })

  ipcMain.handle('torrent:files', async (_event, infoHash: unknown) => {
    if (typeof infoHash !== 'string') return { ok: false }
    try {
      const client = await getClient()
      const torrent = client.get(infoHash)
      if (!torrent) return { ok: false, error: 'Not found.' }
      await ensureServer()
      return { ok: true, files: serializeFiles(torrent) }
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Could not read torrent.' }
    }
  })
}

export async function setupTorrentEngine() {
  registerHandlers()
  try {
    await ensureServer()
  } catch (e) {
    console.error('[torrent]', e)
  }
}