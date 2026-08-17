export interface Stream {
  url: string
  title?: string
  seeders?: number
  source: string
}

export class AddonStreamService {
  private static STREAM_ADDONS = [
    { url: 'https://torrentio.strem.fun', name: 'Torrentio' },
    { url: 'https://comet.strem.dev', name: 'Comet' },
    { url: 'https://sports.stremio.dev', name: 'Sports' },
  ]

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

  static async getStreams(
    imdbId: string,
    type: 'movie' | 'series' | 'sports' = 'movie'
  ): Promise<Stream[]> {
    try {
      const allStreams = await Promise.all(
        this.STREAM_ADDONS.map(async (addon) => {
          try {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
            const res = await fetch(`${addon.url}/stream/${type}/${imdbId}.json`, {
              headers: { Accept: 'application/json' },
              signal: controller.signal,
            })
            clearTimeout(timer)
            if (!res.ok) return []
            const data = await res.json()
            return (data.streams || []).map((s: any) => ({
              url: s.infoHash ? this.magnet(String(s.infoHash).trim()) : s.url,
              title: s.title || s.name || 'Stream',
              seeders: s.seeders,
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
    } catch (error) {
      console.error('[addons] Failed to get streams:', error)
      return []
    }
  }
}