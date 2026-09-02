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
  return `${BASE}/api/images/proxy/${badge}.webp`
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
