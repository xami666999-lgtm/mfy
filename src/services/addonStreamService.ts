export interface Stream {
  url: string
  title?: string
  seeders?: number
  source: string
}

interface AddonManifest {
  id: string
  name: string
  types: string[]
  baseUrl: string
  priority: number
}

/**
 * Free, public Stremio community addons that resolve streams for movies/series.
 * Sources: https://stremio-addons.net (Torrentio, Comet, MediaFusion, TorrentsDB,
 * ThePirateBay+, IlCorsaroViola, FrostStream, StreamAsia, PenguPlay, HdHub, Flix-Streams,
 * TorrentClaw, USA TV) + the Marvel catalogue addon for MCU content discovery.
 * Each is self-hostable or has a public instance; none require a paid account to
 * return free (torrent) results. Priority orders the picker so the most reliable
 * sources surface first.
 */
const STREAM_ADDONS: AddonManifest[] = [
  { id: 'torrentio', name: 'Torrentio', types: ['movie', 'series'], baseUrl: 'https://torrentio.strem.fun', priority: 1 },
  { id: 'comet-elfhosted', name: 'Comet', types: ['movie', 'series'], baseUrl: 'https://comet.strem.dev', priority: 2 },
  { id: 'mediafusion', name: 'MediaFusion', types: ['movie', 'series'], baseUrl: 'https://mediafusion.elfhosted.com', priority: 3 },
  { id: 'knightcrawler', name: 'Knightcrawler', types: ['movie', 'series'], baseUrl: 'https://knightcrawler.elfhosted.com', priority: 4 },
  { id: 'juan-carlos', name: 'Juan Carlos', types: ['movie', 'series'], baseUrl: 'https://juan-carlos-peliculas.elfhosted.com', priority: 5 },
  { id: 'torrentsdb', name: 'TorrentsDB', types: ['movie', 'series'], baseUrl: 'https://torrentsdb.com', priority: 6 },
  { id: 'thepiratebayplus', name: 'ThePirateBay+', types: ['movie', 'series'], baseUrl: 'https://thepiratebay-plus.elfhosted.com', priority: 7 },
  { id: 'peerflix', name: 'Peerflix', types: ['movie', 'series'], baseUrl: 'https://peerflix.strem.fun', priority: 8 },
  { id: 'ilcorsaroviola', name: 'IlCorsaroViola', types: ['movie', 'series'], baseUrl: 'https://ilcorsaroviola.elfhosted.com', priority: 9 },
  { id: 'froststream', name: 'FrostStream', types: ['movie', 'series'], baseUrl: 'https://froststream.stream', priority: 10 },
  { id: 'streamasia', name: 'StreamAsia', types: ['movie', 'series'], baseUrl: 'https://streamasia-tv.duckdns.org', priority: 11 },
  { id: 'penguplay', name: 'PenguPlay', types: ['movie', 'series'], baseUrl: 'https://penguplay.firash.ml', priority: 12 },
  { id: 'hdhub', name: 'HdHub', types: ['movie', 'series'], baseUrl: 'https://hdhub.thevolecitor.qzz.io', priority: 13 },
  { id: 'flix-streams', name: 'Flix-Streams', types: ['movie', 'series'], baseUrl: 'https://flixnest.app/flix-streams', priority: 14 },
  { id: 'torrentclaw', name: 'TorrentClaw', types: ['movie', 'series'], baseUrl: 'https://torrents-claw.com', priority: 15 },
  { id: 'usa-tv', name: 'USA TV', types: ['movie', 'series'], baseUrl: 'https://usatv.baby-beamup.club', priority: 16 },
  { id: 'marvel', name: 'Marvel', types: ['movie', 'series'], baseUrl: 'https://addon-marvel.github.io/stremio', priority: 17 },
  { id: 'froststream-sports', name: 'FrostStream Sports', types: ['movie', 'series'], baseUrl: 'https://froststream-sports.stream', priority: 18 },
]

const CATALOG_ADDONS: AddonManifest[] = [
  { id: 'streaming-catalogs', name: 'Streaming Catalogs', types: ['movie', 'series'], baseUrl: 'https://streaming-catalogs.elfhosted.com', priority: 1 },
  { id: 'tmdb-addon', name: 'TMDb Addon', types: ['movie', 'series'], baseUrl: 'https://themoviedatabase-addon.firash.ml', priority: 2 },
]

export class AddonStreamService {
  private static TIMEOUT_MS = 5000

private static PUBLIC_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'https://tracker.tamersunion.org:443/announce',
]

private static magnet(infoHash: string): string {
  const tr = this.PUBLIC_TRACKERS.map((t) => `&tr=${encodeURIComponent(t)}`).join('')
  return `magnet:?xt=urn:btih:${infoHash}${tr}`
}

/** Map a user-facing type to the stremio `stream/<type>/<id>.json` shape */
private static stremioType(type: 'movie' | 'series' | 'sports'): string {
  if (type === 'sports') return 'movie'
  if (type === 'series') return 'series'
  return 'movie'
}

/**
 * Resolve streams for a given IMDB id + type across all free streaming addons.
 * Addons are queried in priority order; results are deduped by URL/magnet and
 * returned as they resolve so the UI can show the best sources first.
 */
static async getStreams(
  imdbId: string,
  type: 'movie' | 'series' | 'sports' = 'movie'
): Promise<Stream[]> {
  const stype = this.stremioType(type)
  const usable = STREAM_ADDONS.filter((a) => a.types.includes(stype))

  const allStreams = await Promise.all(
    usable.map(async (addon) => {
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
        const res = await fetch(`${addon.baseUrl}/stream/${stype}/${imdbId}.json`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (!res.ok) return []
        const data = await res.json()
        return (data.streams || []).map((s: any) => ({
          url: s.infoHash ? this.magnet(String(s.infoHash).trim()) : s.url,
          title: s.title || s.name || 'Stream',
          seeders: s.seeders ?? s.peers,
          source: addon.name,
        }))
      } catch (error) {
        console.warn(`[addons] ${addon.name} failed:`, error)
        return []
      }
    })
  )

  const streams = allStreams.flat()
  const seen = new Set<string>()
  return streams.filter((s) => {
    const key = s.url || ''
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Discover catalogue metadata (used to populate genre/anime shelves from addons) */
static async getCatalogs(type: 'movie' | 'series'): Promise<any[]> {
  const results: any[] = []
  for (const addon of CATALOG_ADDONS) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
      const res = await fetch(`${addon.baseUrl}/catalog/${type}/top.json`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) continue
      const data = await res.json().catch(() => null)
      if (data?.metas) results.push(...data.metas)
    } catch (error) {
      console.warn(`[addons] catalog ${addon.name} failed:`, error)
    }
  }
  return results
}
}
