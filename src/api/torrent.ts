export interface TorrentFileInfo {
  name: string
  path: string
  length: number
  streamUrl: string
}

export interface TorrentInfo {
  infoHash: string
  name: string
  length: number
  progress: number
  downloadSpeed: number
  uploadSpeed: number
  numPeers: number
  downloaded: number
}

const VIDEO_EXT = /\.(mp4|mkv|avi|mov|webm|m4v|ts|flv|wmv|mpg|mpeg|3gp|ogv)$/i

function api(): any {
  return (window as any).torrentAPI
}

export function isTorrentInput(input: string) {
  const s = input.trim().toLowerCase()
  if (s.startsWith('magnet:?')) return true
  if (/^[a-f0-9]{40}$/i.test(s)) return true
  if (/^https?:\/\/.+(\.torrent(?:$|\?))/i.test(s)) return true
  return false
}

export async function addTorrent(torrentId: string) {
  const a = api()
  if (!a?.add) return { ok: false, error: 'WebTorrent is only available inside the Electron app.' }
  return a.add(torrentId)
}

export async function listTorrents(): Promise<TorrentInfo[]> {
  const a = api()
  if (!a?.list) return []
  return a.list()
}

export async function removeTorrent(infoHash: string) {
  const a = api()
  if (!a?.remove) return { ok: false }
  return a.remove(infoHash)
}

export async function pickBestFile(torrentId: string, fileIdx?: number): Promise<{ streamUrl: string; name: string; infoHash: string } | null> {
  const magnet = withFileIdx(torrentId, fileIdx)
  const res = await addTorrent(magnet)
  if (!res?.ok) return null
  const files: TorrentFileInfo[] = res.files || []
  const video =
    res.best ||
    files
      .filter((f) => VIDEO_EXT.test(f.name))
      .sort((a, b) => b.length - a.length)[0] ||
    files[0]
  if (!video) return null
  return { streamUrl: video.streamUrl, name: video.name, infoHash: res.infoHash }
}

/** Embed the chosen file index into the magnet so the engine picks the right file */
function withFileIdx(torrentId: string, fileIdx?: number): string {
  if (typeof fileIdx !== 'number' || !Number.isInteger(fileIdx)) return torrentId
  const s = torrentId.trim()
  if (/^magnet:?/i.test(s)) return `${s}${s.includes('&fileIdx') ? '' : `&fileIdx=${fileIdx}`}`
  return s
}

export function onTorrentProgress(cb: (t: TorrentInfo) => void) {
  const a = api()
  if (!a?.onProgress) return () => {}
  return a.onProgress(cb)
}

export function formatBytes(n: number) {
  if (!Number.isFinite(n) || n < 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`
}

export function formatSpeed(n: number) {
  return `${formatBytes(n)}/s`
}