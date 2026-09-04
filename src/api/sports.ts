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
  if (badge.startsWith('http')) return badge
  if (badge.startsWith('/')) return `https://api.watchfooty.st${badge}`
  return `${BASE}/api/images/proxy/${encodeURIComponent(badge)}.webp`
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
