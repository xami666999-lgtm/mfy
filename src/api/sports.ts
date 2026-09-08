/** Streamed.pk public API — https://streamed.pk/docs */

const BASE = 'https://streamed.pk'

export interface SportCategory {
  id: string
  name: string
}

export interface MatchTeam {
  name: string
  badge?: string
}

export interface MatchSource {
  source: string
  id: string
}

export interface SportMatch {
  id: string
  title: string
  category: string
  date: number
  popular?: boolean
  live?: boolean
  poster?: string
  teams?: { home?: MatchTeam; away?: MatchTeam }
  sources?: MatchSource[]
  score?: { home?: number | string; away?: number | string }
}

export interface SportStream {
  id: string
  streamNo?: number
  language?: string
  hd?: boolean
  embedUrl?: string
  source?: string
  viewers?: number
}

export function badgeUrl(badge?: string) {
  if (!badge) return ''
  const raw = String(badge).trim()
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  const path = raw.startsWith('/') ? raw : `/${raw}`
  if (path.startsWith('/api/')) return `${BASE}${path}`
  const id = raw.replace(/^\/+/, '').replace(/\.(webp|png|jpe?g|svg)$/i, '')
  return `${BASE}/api/images/badge/${encodeURIComponent(id)}.webp`
}

export function badgeFallbacks(badge?: string) {
  if (!badge) return []
  const raw = String(badge).trim()
  const id = raw.replace(/^https?:\/\/[^/]+\//, '').replace(/^\/+/, '').replace(/\.(webp|png|jpe?g|svg)$/i, '')
  return [
    badgeUrl(badge),
    `${BASE}/api/images/proxy/${encodeURIComponent(id)}.webp`,
    `${BASE}/api/images/badge/${encodeURIComponent(id)}.png`,
    `https://api.watchfooty.st/badges/${encodeURIComponent(id)}`,
  ].filter((u, i, a) => u && a.indexOf(u) === i)
}

export const SPORT_ICONS: Record<string, string> = {
  football: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/128px-Soccerball.svg.png',
  basketball: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Basketball.png/128px-Basketball.png',
  'american-football': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/American_Football_NFL.svg/128px-American_Football_NFL.svg.png',
  hockey: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Ice_hockey_pictogram.svg/128px-Ice_hockey_pictogram.svg.png',
  baseball: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Baseball.svg/128px-Baseball.svg.png',
  'motor-sports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/128px-F1.svg.png',
  fight: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Martial_arts_pictogram.svg/128px-Martial_arts_pictogram.svg.png',
  tennis: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Tennis_pictogram.svg/128px-Tennis_pictogram.svg.png',
  rugby: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Rugby_union_pictogram.svg/128px-Rugby_union_pictogram.svg.png',
  golf: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Golf_pictogram.svg/128px-Golf_pictogram.svg.png',
  cricket: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Cricket_pictogram.svg/128px-Cricket_pictogram.svg.png',
}

export function sportIcon(id?: string) {
  return SPORT_ICONS[String(id || '')] || SPORT_ICONS.football
}

export function posterUrl(poster?: string) {
  if (!poster) return ''
  if (poster.startsWith('http')) return poster
  return `${BASE}${poster}`
}

async function getJson<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`
  const api = (globalThis as any).electronAPI || (typeof window !== 'undefined' ? (window as any).electronAPI : null)
  if (api?.fetchText) {
    const r = await api.fetchText(url, 15000)
    if (r?.ok && r.text) return JSON.parse(r.text) as T
    throw new Error(r?.error || 'Sports fetch failed')
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Sports API ${res.status}`)
  return res.json() as Promise<T>
}

export const sportsApi = {
  getSports: () => getJson<SportCategory[]>('/api/sports'),

  getMatches: (sportId: string) =>
    getJson<SportMatch[]>(`/api/matches/${encodeURIComponent(sportId)}`),

  getMatchesPopular: (sportId: string) =>
    getJson<SportMatch[]>(`/api/matches/${encodeURIComponent(sportId)}/popular`),

  getLive: () => getJson<SportMatch[]>('/api/matches/live'),

  getLivePopular: () => getJson<SportMatch[]>('/api/matches/live/popular'),

  getAllToday: () => getJson<SportMatch[]>('/api/matches/all-today'),

  getStreams: (source: string, id: string) =>
    getJson<SportStream[]>(
      `/api/stream/${encodeURIComponent(source)}/${encodeURIComponent(id)}`
    ),
}

async function timFetch<T>(path: string): Promise<T> {
  const url = `https://timst.cfd${path}`
  const api = (globalThis as any).electronAPI || (typeof window !== 'undefined' ? (window as any).electronAPI : null)
  if (api?.fetchText) {
    const r = await api.fetchText(url, 15000)
    if (r?.ok && r.text) return JSON.parse(r.text) as T
    throw new Error(r?.error || 'TimStreams failed')
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Tim ${res.status}`)
  return res.json() as Promise<T>
}

export const timStreamsApi = {
  live: () => timFetch<{ events: any[]; genres: any[] }>('/api/live-upcoming'),
  replays: () => timFetch<{ replays: any[] }>('/api/replays'),
  channels: () => timFetch<{ channels: any[] }>('/api/channels'),
}

const WF = 'https://api.watchfooty.st'

async function wfJson<T>(path: string): Promise<T> {
  const url = `${WF}${path}`
  const api = (globalThis as any).electronAPI || (typeof window !== 'undefined' ? (window as any).electronAPI : null)
  if (api?.fetchText) {
    const r = await api.fetchText(url, 18000)
    if (r?.ok && r.text) return JSON.parse(r.text) as T
    throw new Error(r?.error || 'WatchFooty failed')
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WatchFooty ${res.status}`)
  return res.json() as Promise<T>
}

export function wfSport(id: string) {
  if (id === 'fight') return 'fighting'
  if (id === 'motor-sports') return 'racing'
  if (id === 'afl') return 'australian-football'
  return id
}

export const watchfootyApi = {
  sports: () => wfJson<any[]>('/api/v1/sports'),
  matches: (sport: string) => wfJson<any[]>(`/api/v1/matches/${encodeURIComponent(wfSport(sport))}`),
  live: (sport: string) => wfJson<any[]>(`/api/v1/matches/${encodeURIComponent(wfSport(sport))}/live`),
}
