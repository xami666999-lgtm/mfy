/**
 * IPTV Enhanced API - iptv-org/iptvgen integration + Metegol sports
 * iptv-org: https://github.com/iptv-org/iptv
 * iptvgen: https://iptvgen.pages.dev/
 * Metegol: https://github.com/Geber-Dev0/Metegol (Stremio sports addon)
 */

const IPTV_ORG_BASE = 'https://iptv-org.github.io/iptv'
const IPTV_GEN_BASE = 'https://iptvgen.pages.dev/api'
const METEGOL_BASE = 'https://metegol.vercel.app' // Or local proxy

export interface IPTVChannel {
  id: string
  name: string
  url: string
  logo?: string
  group?: string
  groupTitle?: string
  tvgId?: string
  tvgName?: string
  tvgLogo?: string
  tvgCountry?: string
  tvgLanguage?: string
  tvgUrl?: string
  radio?: boolean
  nsfw?: boolean
  categories?: string[]
  isLive?: boolean
  epg?: {
    title: string
    start: number
    end: number
    description?: string
  }[]
}

export interface IPTVCategory {
  id: string
  name: string
  channels: IPTVChannel[]
}

export interface MetegolEvent {
  id: string
  title: string
  competition: string
  sport: string
  startTime: number // Unix timestamp
  endTime?: number
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  streams: MetegolStream[]
  homeTeam?: { name: string; logo?: string; score?: number }
  awayTeam?: { name: string; logo?: string; score?: number }
  venue?: string
  country?: string
}

export interface MetegolStream {
  id: string
  title: string
  url: string
  quality?: string
  language?: string
  provider: string
  isHLS?: boolean
}

async function iptvOrgFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${IPTV_ORG_BASE}${path}`)
  if (!res.ok) throw new Error(`IPTV-org error: ${res.status}`)
  return res.json()
}

async function iptvGenFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${IPTV_GEN_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`IPTVgen error: ${res.status}`)
  return res.json()
}

async function metegolFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${METEGOL_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.append(key, String(value))
    })
  }
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'MFY/1.0' }
  })
  if (!res.ok) throw new Error(`Metegol error: ${res.status}`)
  return res.json()
}

/**
 * Parse M3U playlist text into channels
 */
export function parseM3U(text: string): IPTVChannel[] {
  const lines = text.split(/\r?\n/)
  const channels: IPTVChannel[] = []
  let pending: { attrs: string; name: string } | null = null
  
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#EXTINF')) {
      const attrs = line.slice(line.indexOf(':') + 1)
      const nameMatch = attrs.match(/,(.+)$/)
      const name = nameMatch ? nameMatch[1].trim() : 'Channel'
      pending = { attrs, name }
    } else if (!line.startsWith('#')) {
      if (pending) {
        const logoMatch = pending.attrs.match(/tvg-logo="([^"]*)"/)
        const groupMatch = pending.attrs.match(/group-title="([^"]*)"/)
        const tvgIdMatch = pending.attrs.match(/tvg-id="([^"]*)"/)
        const tvgNameMatch = pending.attrs.match(/tvg-name="([^"]*)"/)
        const tvgCountryMatch = pending.attrs.match(/tvg-country="([^"]*)"/)
        const tvgLanguageMatch = pending.attrs.match(/tvg-language="([^"]*)"/)
        
        channels.push({
          id: tvgIdMatch ? tvgIdMatch[1] : pending.name,
          name: pending.name,
          url: line,
          logo: logoMatch ? logoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : undefined,
          tvgId: tvgIdMatch ? tvgIdMatch[1] : undefined,
          tvgName: tvgNameMatch ? tvgNameMatch[1] : undefined,
          tvgCountry: tvgCountryMatch ? tvgCountryMatch[1] : undefined,
          tvgLanguage: tvgLanguageMatch ? tvgLanguageMatch[1] : undefined,
        })
      } else {
        channels.push({ id: line, name: 'Channel', url: line })
      }
      pending = null
    }
  }
  return channels
}

export const iptvEnhancedApi = {
  /**
   * Get all channels from iptv-org main playlist
   */
  getAllChannels: async (): Promise<IPTVChannel[]> => {
    try {
      const text = await fetch(`${IPTV_ORG_BASE}/index.m3u`).then(r => r.text())
      return parseM3U(text)
    } catch {
      const d = await fetch('./data/iptv-channels.json').then((r) => r.json()).catch(() => ({ channels: [] }))
      return d.channels || []
    }
  },

  /**
   * Get channels by country
   */
  getChannelsByCountry: async (countryCode: string): Promise<IPTVChannel[]> => {
    const text = await fetch(`${IPTV_ORG_BASE}/countries/${countryCode.toLowerCase()}.m3u`).then(r => r.text())
    return parseM3U(text)
  },

  /**
   * Get channels by category
   */
  getChannelsByCategory: async (category: string): Promise<IPTVChannel[]> => {
    const text = await fetch(`${IPTV_ORG_BASE}/categories/${category.toLowerCase().replace(/\s+/g, '-')}.m3u`).then(r => r.text())
    return parseM3U(text)
  },

  /**
   * Get channels by language
   */
  getChannelsByLanguage: async (languageCode: string): Promise<IPTVChannel[]> => {
    const text = await fetch(`${IPTV_ORG_BASE}/languages/${languageCode.toLowerCase()}.m3u`).then(r => r.text())
    return parseM3U(text)
  },

  /**
   * Get auto-generated playlist (best quality)
   */
  getAutoPlaylist: async (): Promise<IPTVChannel[]> => {
    const text = await fetch(`${IPTV_ORG_BASE}/auto.m3u`).then(r => r.text())
    return parseM3U(text)
  },

  /**
   * Get iptvgen playlist
   */
  getIPTVGenPlaylist: async (category?: string): Promise<IPTVChannel[]> => {
    const endpoint = category ? `/playlist.m3u?category=${encodeURIComponent(category)}` : '/playlist.m3u'
    const text = await fetch(`${IPTV_GEN_BASE}${endpoint}`).then(r => r.text())
    return parseM3U(text)
  },

  /**
   * Get all categories from iptv-org
   */
  getCategories: async (): Promise<string[]> => {
    try {
      const data = await iptvOrgFetch<{ categories: string[] }>('/categories.json')
      return data.categories || []
    } catch {
      return ['news', 'sports', 'movies', 'music', 'kids', 'documentary', 'entertainment', 'general', 'religious', 'weather']
    }
  },

  /**
   * Get all countries from iptv-org
   */
  getCountries: async (): Promise<{ code: string; name: string }[]> => {
    try {
      const data = await iptvOrgFetch<{ countries: Array<{ code: string; name: string }> }>('/countries.json')
      return data.countries || []
    } catch {
      return []
    }
  },

  /**
   * Get languages from iptv-org
   */
  getLanguages: async (): Promise<{ code: string; name: string }[]> => {
    try {
      const data = await iptvOrgFetch<{ languages: Array<{ code: string; name: string }> }>('/languages.json')
      return data.languages || []
    } catch {
      return []
    }
  },

  /**
   * Get Metegol sports events (live/upcoming)
   */
  getMetegolEvents: async (date?: string): Promise<MetegolEvent[]> => {
    try {
      const params = date ? { date } : {}
      const data = await metegolFetch<{ events: MetegolEvent[] }>('/api/events', params)
      return data.events || []
    } catch {
      try {
        const res = await fetch('http://localhost:7000/catalog/series/metegol.json')
        if (res.ok) {
          const data = await res.json()
          return data.metas || []
        }
      } catch {}
      try {
        const d = await fetch('./data/metegol.json').then((r) => r.json())
        return d.events || []
      } catch {
        return []
      }
    }
  },

  /**
   * Get Metegol streams for an event
   */
  getMetegolStreams: async (eventId: string): Promise<MetegolStream[]> => {
    try {
      const data = await metegolFetch<{ streams: MetegolStream[] }>(`/api/events/${eventId}/streams`)
      return data.streams || []
    } catch {
      // Try Stremio addon
      try {
        const res = await fetch(`http://localhost:7000/stream/series/${eventId}.json`)
        if (res.ok) {
          const data = await res.json()
          return data.streams?.map((s: any) => ({
            id: s.url,
            title: s.name || s.title || 'Stream',
            url: s.url,
            quality: s.quality,
            language: s.language,
            provider: s.provider || 'Metegol',
            isHLS: s.url?.includes('.m3u8')
          })) || []
        }
      } catch {}
      return []
    }
  },

  /**
   * Search channels across all sources
   */
  searchChannels: async (query: string): Promise<IPTVChannel[]> => {
    const allChannels = await iptvEnhancedApi.getAllChannels()
    const lowerQuery = query.toLowerCase()
    return allChannels.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.group?.toLowerCase().includes(lowerQuery) ||
      c.tvgName?.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Get channel categories with counts
   */
  getCategoriesWithCounts: async (): Promise<IPTVCategory[]> => {
    const channels = await iptvEnhancedApi.getAllChannels()
    const categoryMap = new Map<string, IPTVChannel[]>()
    
    channels.forEach(c => {
      const cat = c.group || c.groupTitle || 'Uncategorized'
      if (!categoryMap.has(cat)) categoryMap.set(cat, [])
      categoryMap.get(cat)!.push(c)
    })
    
    return Array.from(categoryMap.entries())
      .map(([name, channels]) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, channels }))
      .sort((a, b) => b.channels.length - a.channels.length)
  },

  /**
   * Get EPG data for a channel
   */
  getChannelEPG: async (channelId: string): Promise<MetegolEvent[]> => {
    // This would typically come from an EPG source
    // For now, return Metegol events that match the channel
    const events = await iptvEnhancedApi.getMetegolEvents()
    return events.filter(e => e.streams.some(s => s.id.includes(channelId) || s.title.includes(channelId)))
  },

  /**
   * Get sports-specific channels
   */
  getSportsChannels: async (): Promise<IPTVChannel[]> => {
    const channels = await iptvEnhancedApi.getAllChannels()
    const sportsKeywords = ['sport', 'football', 'soccer', 'basketball', 'tennis', 'cricket', 'racing', 'f1', 'mma', 'ufc', 'wwe', 'boxing', 'golf', 'baseball', 'hockey', 'olympics']
    return channels.filter(c => 
      sportsKeywords.some(k => c.name.toLowerCase().includes(k) || c.group?.toLowerCase().includes(k))
    )
  },

  /**
   * Get news channels
   */
  getNewsChannels: async (): Promise<IPTVChannel[]> => {
    const channels = await iptvEnhancedApi.getAllChannels()
    return channels.filter(c => c.group?.toLowerCase().includes('news'))
  },

  /**
   * Get kids channels
   */
  getKidsChannels: async (): Promise<IPTVChannel[]> => {
    const channels = await iptvEnhancedApi.getAllChannels()
    return channels.filter(c => c.group?.toLowerCase().includes('kids') || c.group?.toLowerCase().includes('children'))
  },

  /**
   * Get movie channels
   */
  getMovieChannels: async (): Promise<IPTVChannel[]> => {
    const channels = await iptvEnhancedApi.getAllChannels()
    return channels.filter(c => c.group?.toLowerCase().includes('movie') || c.group?.toLowerCase().includes('cinema'))
  },
}