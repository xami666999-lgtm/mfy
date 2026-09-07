const FLIX = 'https://flix-music.vercel.app'
const CRUNCH = 'https://stremio-crunch-addon.onrender.com'

export type Track = {
  id: string
  title: string
  artist: string
  poster: string
  source: 'flix' | 'crunch'
  rawId: string
  type: string
}

async function pull(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    const d = api?.fetchJson ? (await api.fetchJson(url, { timeoutMs: 14000 }))?.json : await (await fetch(url)).json()
    return d
  } catch {
    return null
  }
}

function mapFlix(m: any): Track {
  const desc = String(m.description || '')
  const artist = (desc.match(/Artist:\s*(.+)/i)?.[1] || m.cast?.[0] || '').split('\n')[0]
  return {
    id: String(m.id),
    rawId: String(m.id),
    title: m.name || 'Track',
    artist,
    poster: m.poster || m.background || '',
    source: 'flix',
    type: 'movie',
  }
}

function mapCrunch(m: any): Track {
  return {
    id: String(m.id),
    rawId: String(m.id),
    title: m.name || 'Track',
    artist: m.cast?.[0] || m.releaseInfo || 'Crunch',
    poster: m.poster || '',
    source: 'crunch',
    type: m.type || 'music',
  }
}

export async function flixCatalog(kind: 'top' | 'trending' | 'search', q = '') {
  const path = kind === 'search'
    ? `/catalog/movie/lastfm-search.json?search=${encodeURIComponent(q)}`
    : `/catalog/movie/lastfm-${kind}.json`
  const d = await pull(FLIX + path)
  return ((d?.metas || []) as any[]).map(mapFlix)
}

export async function crunchSearch(q: string) {
  const urls = [
    `${CRUNCH}/catalog/music/crunch_search/search=${encodeURIComponent(q)}.json`,
    `${CRUNCH}/catalog/music/crunch_search.json?search=${encodeURIComponent(q)}`,
    `${CRUNCH}/catalog/movie/crunch_search/search=${encodeURIComponent(q)}.json`,
  ]
  for (const u of urls) {
    const d = await pull(u)
    const rows = (d?.metas || []) as any[]
    if (rows.length) return rows.map(mapCrunch)
  }
  return []
}

export async function searchMusic(q: string) {
  const [a, b] = await Promise.all([flixCatalog('search', q), crunchSearch(q)])
  const seen = new Set<string>()
  const out: Track[] = []
  for (const t of [...b, ...a]) {
    const k = t.title.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

export async function streamUrl(track: Track) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const bases = track.source === 'crunch'
    ? [`${CRUNCH}/stream/${track.type}/${encodeURIComponent(track.rawId)}.json`, `${CRUNCH}/stream/music/${encodeURIComponent(track.rawId)}.json`]
    : [`${FLIX}/stream/movie/${encodeURIComponent(track.rawId)}.json`]
  for (const url of bases) {
    try {
      const d = api?.fetchJson ? (await api.fetchJson(url, { timeoutMs: 18000 }))?.json : await (await fetch(url)).json()
      const hit = (d?.streams || []).find((s: any) => s.url)
      if (hit?.url) return String(hit.url)
    } catch {}
  }
  return ''
}
