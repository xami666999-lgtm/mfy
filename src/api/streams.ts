/**
 * Stream resolution helpers.
 * MFY only requests streams from endpoints the user configured (e.g. AIOStreams).
 * It does not scrape or host content.
 */

export interface ResolvedStream {
  url: string
  name?: string
  title?: string
  quality?: string
  provider?: string
  type?: 'hls' | 'dash' | 'mp4' | 'other'
}

function detectType(url: string): ResolvedStream['type'] {
  if (/\.m3u8(?:$|\?)/i.test(url)) return 'hls'
  if (/\.mpd(?:$|\?)/i.test(url)) return 'dash'
  if (/\.mp4(?:$|\?)/i.test(url)) return 'mp4'
  return 'other'
}

/**
 * Query a user-configured AIOStreams-style endpoint.
 * Common patterns:
 *  - {base}/stream/movie/tt1234567.json
 *  - {base}/stream/series/tt1234567:1:1.json
 */
export async function resolveFromAiostreams(
  baseUrl: string,
  mediaType: 'movie' | 'tv',
  imdbIdOrTmdb: string,
  season?: number,
  episode?: number
): Promise<ResolvedStream[]> {
  if (!baseUrl?.trim()) return []

  const base = baseUrl.replace(/\/$/, '')
  let path: string

  if (mediaType === 'movie') {
    path = `/stream/movie/${imdbIdOrTmdb}.json`
  } else {
    const s = season ?? 1
    const e = episode ?? 1
    path = `/stream/series/${imdbIdOrTmdb}:${s}:${e}.json`
  }

  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return []
    const data = await res.json()
    const streams = data?.streams || data?.results || []
    if (!Array.isArray(streams)) return []

    return streams
      .map((s: any) => {
        const url = s.url || s.stream || s.link
        if (!url || typeof url !== 'string') return null
        // Only accept http(s) stream URLs — not magnets/torrents
        if (!/^https?:\/\//i.test(url)) return null
        return {
          url,
          name: s.name || s.provider || 'Stream',
          title: s.title || s.description || '',
          quality: s.quality || extractQuality(s.title || s.name || ''),
          provider: s.provider || s.name || 'AIOStreams',
          type: detectType(url),
        } as ResolvedStream
      })
      .filter(Boolean) as ResolvedStream[]
  } catch (err) {
    console.error('[streams] AIOStreams resolve failed:', err)
    return []
  }
}

function extractQuality(text: string): string {
  const m = text.match(/\b(2160p|4K|1080p|720p|480p|360p)\b/i)
  return m ? m[1] : ''
}

/** Stremio-compatible torrent stream (Torrentio / addons) */
export interface TorrentStream {
  url: string // magnet:?xt=urn:btih:<infoHash>
  infoHash: string
  fileIdx?: number
  name: string
  title: string
  quality: string
  size: string
  seeds?: string
  provider: string
}

const DEFAULT_TORRENTIO = 'https://torrentio.strem.fun'
const COMET_ADDON = 'https://comet.strem.dev'

/** Public trackers so WebTorrent can find peers without relying on DHT alone. */
const PUBLIC_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'https://tracker.tamersunion.org:443/announce',
]

function magnetWithTrackers(infoHash: string): string {
  const tr = PUBLIC_TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join('')
  return `magnet:?xt=urn:btih:${infoHash}${tr}`
}

/**
 * Query a Stremio addon (Torrentio by default) for torrent streams.
 * These are returned as magnet links + infoHash/fileIdx and are played
 * through the built-in WebTorrent engine, so no manual link is needed.
 */
export async function resolveFromTorrentio(
  mediaType: 'movie' | 'tv',
  imdbId: string,
  opts?: { baseUrl?: string; season?: number; episode?: number; provider?: string }
): Promise<TorrentStream[]> {
  const bases = [opts?.baseUrl || DEFAULT_TORRENTIO, COMET_ADDON]
  const streams = await Promise.all(
    bases.map((base) => resolveTorrentAddon(base, mediaType, imdbId, opts))
  )
  const seen = new Set<string>()
  return streams
    .flat()
    .filter((s) => {
      if (seen.has(s.infoHash)) return false
      seen.add(s.infoHash)
      return true
    })
}

async function resolveTorrentAddon(
  base: string,
  mediaType: 'movie' | 'tv',
  imdbId: string,
  opts?: { baseUrl?: string; season?: number; episode?: number; provider?: string }
): Promise<TorrentStream[]> {
  const clean = base.replace(/\/$/, '')
  let path: string
  if (mediaType === 'movie') {
    path = `/stream/movie/${imdbId}.json`
  } else {
    const s = opts?.season ?? 1
    const e = opts?.episode ?? 1
    path = `/stream/series/${imdbId}:${s}:${e}.json`
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    const res = await fetch(`${clean}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!res.ok) return []
    const data = await res.json()
    const streams: any[] = data?.streams || []
    if (!Array.isArray(streams)) return []

    return streams
      .map((s: any) => {
        const infoHash = String(s.infoHash || '').trim()
        if (!infoHash) return null
        const url = magnetWithTrackers(infoHash)
        const title = s.title || s.name || ''
        const quality = extractQuality(title) || s.quality || ''
        const size = title.match(/\b(\d+(?:\.\d+)?)\s*(GB|MB|TB)\b/i)?.[0] ||
          title.match(/💾\s*([\d.]+)\s*(GB|MB|TB)/i)?.[0] || ''
        const seeds = title.match(/\b(\d+)\s*(seeds?|peers?)\b/i)?.[1] ||
          title.match(/👤\s*(\d+)/)?.[1] || ''
        const provider = title.match(/⚙️\s*([A-Za-z0-9.]+)/)?.[1] || opts?.provider || 'Torrentio'
        const cleanName = String(s.name || '')
          .split('\n')[0]
          .replace(/^Torrentio\s*/i, '')
          .trim() || 'Torrent'
        return {
          url,
          infoHash,
          fileIdx: typeof s.fileIdx === 'number' ? s.fileIdx : undefined,
          name: cleanName,
          title,
          quality,
          size,
          seeds,
          provider,
        } as TorrentStream
      })
      .filter(Boolean) as TorrentStream[]
  } catch (err) {
    console.error('[streams] addon resolve failed:', err)
    return []
  }
}

/** Fetch TMDB external IDs so we can prefer IMDb IDs for stream addons */
export async function getExternalIds(
  mediaType: 'movie' | 'tv',
  tmdbId: number,
  tmdbApiKey: string
): Promise<{ imdb_id?: string }> {
  if (!tmdbApiKey) return {}
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids?api_key=${tmdbApiKey}`
    )
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}
