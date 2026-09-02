/**
 * Serializd API Client for MFY
 * Serializd API: https://serializd.com/api
 * Based on serializd-py: https://github.com/Velocidensity/serializd-py
 */

const SERIALIZD_BASE = 'https://serializd.onrender.com/api'
const SERIALIZD_HEADERS = {
  'Content-Type': 'application/json',
  Origin: 'https://www.serializd.com',
  Referer: 'https://www.serializd.com',
  'X-Requested-With': 'serializd_vercel',
}

export interface SerializdUser {
  id: number
  email: string
  username: string
  avatar?: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: SerializdUser
}

export interface ValidateAuthTokenResponse {
  valid: boolean
  user?: SerializdUser
}

export interface ShowResponse {
  id: number
  name: string
  overview?: string
  first_air_date?: string
  last_air_date?: string
  status: string
  number_of_seasons: number
  number_of_episodes: number
  genres: Array<{ id: number; name: string }>
  networks: Array<{ id: number; name: string; logo_path?: string }>
  poster_path?: string
  backdrop_path?: string
  vote_average: number
  vote_count: number
  popularity: number
  seasons: SeasonResponse[]
  user_data?: {
    watched_episodes: number
    watched_seasons: number
    total_episodes: number
    rating?: number
    in_watchlist: boolean
  }
}

export interface SeasonResponse {
  id: number
  season_number: number
  name: string
  overview?: string
  air_date?: string
  episode_count: number
  poster_path?: string
  episodes: EpisodeResponse[]
  user_data?: {
    watched_episodes: number
    total_episodes: number
  }
}

export interface EpisodeResponse {
  id: number
  episode_number: number
  name: string
  overview?: string
  air_date?: string
  runtime?: number
  still_path?: string
  vote_average: number
  vote_count: number
}

class SerializdError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'SerializdError'
  }
}

export const serializdApi = {
  accessToken: null as string | null,

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${SERIALIZD_BASE}/login`, {
      method: 'POST',
      headers: SERIALIZD_HEADERS,
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || err.message || 'Login failed', res.status)
    }

    const data = await res.json()
    this.accessToken = data.token || data.access_token
    return {
      access_token: this.accessToken || '',
      token_type: 'Bearer',
      user: data.user || { id: 0, email, username: String(email).split('@')[0], created_at: '' },
    }
  },

  async checkToken(token?: string): Promise<ValidateAuthTokenResponse> {
    const authToken = token || this.accessToken
    if (!authToken) return { valid: false }

    const res = await fetch(`${SERIALIZD_BASE}/auth/validate`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })

    if (!res.ok) return { valid: false }
    return res.json()
  },

  loadToken(token: string, check = true): void {
    this.accessToken = token
    if (check) this.checkToken(token)
  },

  getAuthHeaders(): HeadersInit {
    if (!this.accessToken) return {}
    return { Authorization: `Bearer ${this.accessToken}` }
  },

  async getShow(showId: number): Promise<ShowResponse> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}`, {
      headers: this.getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to fetch show', res.status)
    }

    return res.json()
  },

  async getSeason(showId: number, seasonNumber: number): Promise<SeasonResponse> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/seasons/${seasonNumber}`, {
      headers: this.getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to fetch season', res.status)
    }

    return res.json()
  },

  async logShow(showId: number): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/log`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to log show', res.status)
    }

    return res.json()
  },

  async logSeasons(showId: number, seasonIds: number[]): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/seasons/log`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_ids: seasonIds }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to log seasons', res.status)
    }

    return res.json()
  },

  async logEpisodes(showId: number, seasonId: number, episodeNumbers: number[]): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/seasons/${seasonId}/episodes/log`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode_numbers: episodeNumbers }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to log episodes', res.status)
    }

    return res.json()
  },

  async unlogShow(showId: number): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/log`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to unlog show', res.status)
    }

    return res.json()
  },

  async unlogSeasons(showId: number, seasonIds: number[]): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/seasons/log`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ season_ids: seasonIds }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to unlog seasons', res.status)
    }

    return res.json()
  },

  async unlogEpisodes(showId: number, seasonId: number, episodeNumbers: number[]): Promise<boolean> {
    const res = await fetch(`${SERIALIZD_BASE}/shows/${showId}/seasons/${seasonId}/episodes/log`, {
      method: 'DELETE',
      headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ episode_numbers: episodeNumbers }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new SerializdError(err.detail || 'Failed to unlog episodes', res.status)
    }

    return res.json()
  },
}

export { SerializdError }