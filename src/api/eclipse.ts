/**
 * Eclipse Music API Client
 * Source: https://github.com/bagusjunio/Eclipse-music
 * A music streaming client that aggregates from multiple sources
 */

const ECLIPSE_BASE = 'https://eclipse-music.vercel.app/api' // API endpoint

export interface EclipseTrack {
  id: string
  title: string
  artist: string
  artistId?: string
  album?: string
  albumId?: string
  duration: number
  artwork?: string
  url: string
  source: 'youtube' | 'soundcloud' | 'bandcamp' | 'spotify' | 'apple' | 'deezer'
  quality?: string
  lyrics?: string
}

export interface EclipseArtist {
  id: string
  name: string
  image?: string
  bio?: string
  followers?: number
  verified?: boolean
  socialLinks?: Array<{ platform: string; url: string }>
}

export interface EclipseAlbum {
  id: string
  title: string
  artist: string
  artistId?: string
  cover?: string
  releaseDate?: string
  tracks: EclipseTrack[]
  totalDuration: number
  genre?: string[]
}

export interface EclipsePlaylist {
  id: string
  title: string
  description?: string
  cover?: string
  tracks: EclipseTrack[]
  owner?: EclipseArtist
  collaborative?: boolean
  public?: boolean
}

export interface EclipseSearchResult {
  tracks: EclipseTrack[]
  artists: EclipseArtist[]
  albums: EclipseAlbum[]
  playlists: EclipsePlaylist[]
}

async function eclipseFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${ECLIPSE_BASE}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MFY/1.0',
    },
  })

  if (!res.ok) {
    throw new Error(`Eclipse Music API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const eclipseApi = {
  /**
   * Search music across all sources
   */
  search: async (query: string, type?: 'tracks' | 'artists' | 'albums' | 'playlists', page = 1, limit = 20): Promise<EclipseSearchResult> => {
    return eclipseFetch<EclipseSearchResult>('/search', { q: query, type, page, limit })
  },

  /**
   * Get trending tracks
   */
  getTrending: async (type: 'tracks' | 'artists' | 'albums' = 'tracks', page = 1, limit = 20): Promise<EclipseSearchResult> => {
    return eclipseFetch<EclipseSearchResult>(`/trending/${type}`, { page, limit })
  },

  /**
   * Get new releases
   */
  getNewReleases: async (page = 1, limit = 20): Promise<{ albums: any[] }> => {
    return eclipseFetch<{ albums: any[] }>('/new-releases', { page, limit })
  },

  /**
   * Get top charts
   */
  getCharts: async (type: 'tracks' | 'albums' | 'artists' = 'tracks', page = 1, limit = 50): Promise<any[]> => {
    return eclipseFetch<any[]>(`/charts/${type}`, { page, limit })
  },

  /**
   * Get track details
   */
  getTrack: async (id: string): Promise<EclipseTrack | null> => {
    try {
      return await eclipseFetch<EclipseTrack>(`/track/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get track stream URL
   */
  getTrackStream: async (id: string, quality = 'high'): Promise<{ url: string; quality: string; format: string } | null> => {
    try {
      return await eclipseFetch<{ url: string; quality: string; format: string }>(`/track/${id}/stream`, { quality })
    } catch {
      return null
    }
  },

  /**
   * Get track lyrics
   */
  getLyrics: async (id: string): Promise<string | null> => {
    try {
      const result = await eclipseFetch<{ lyrics: string }>(`/track/${id}/lyrics`)
      return result.lyrics
    } catch {
      return null
    }
  },

  /**
   * Get artist details
   */
  getArtist: async (id: string): Promise<EclipseArtist | null> => {
    try {
      return await eclipseFetch<EclipseArtist>(`/artist/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get artist top tracks
   */
  getArtistTopTracks: async (id: string, limit = 10): Promise<EclipseTrack[]> => {
    try {
      return await eclipseFetch<EclipseTrack[]>(`/artist/${id}/top-tracks`, { limit })
    } catch {
      return []
    }
  },

  /**
   * Get artist albums
   */
  getArtistAlbums: async (id: string, page = 1, limit = 20): Promise<EclipseAlbum[]> => {
    try {
      return await eclipseFetch<EclipseAlbum[]>(`/artist/${id}/albums`, { page, limit })
    } catch {
      return []
    }
  },

  /**
   * Get album details
   */
  getAlbum: async (id: string): Promise<EclipseAlbum | null> => {
    try {
      return await eclipseFetch<EclipseAlbum>(`/album/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get album tracks
   */
  getAlbumTracks: async (id: string): Promise<EclipseTrack[]> => {
    try {
      return await eclipseFetch<EclipseTrack[]>(`/album/${id}/tracks`)
    } catch {
      return []
    }
  },

  /**
   * Get playlist
   */
  getPlaylist: async (id: string): Promise<EclipsePlaylist | null> => {
    try {
      return await eclipseFetch<EclipsePlaylist>(`/playlist/${id}`)
    } catch {
      return null
    }
  },

  /**
   * Get featured playlists
   */
  getFeaturedPlaylists: async (page = 1, limit = 20): Promise<{ playlists: EclipsePlaylist[] }> => {
    return eclipseFetch<{ playlists: EclipsePlaylist[] }>('/playlists/featured', { page, limit })
  },

  /**
   * Get mood/category playlists
   */
  getMoodPlaylists: async (mood: string, page = 1, limit = 20): Promise<{ playlists: EclipsePlaylist[] }> => {
    return eclipseFetch<{ playlists: EclipsePlaylist[] }>(`/playlists/mood/${mood}`, { page, limit })
  },

  /**
   * Get genres
   */
  getGenres: async (): Promise<string[]> => {
    try {
      return await eclipseFetch<string[]>('/genres')
    } catch {
      return []
    }
  },

  /**
   * Get recommendations based on seed
   */
  getRecommendations: async (seedTracks: string[], seedArtists: string[], seedGenres: string[], limit = 20): Promise<EclipseTrack[]> => {
    return eclipseFetch<EclipseTrack[]>('/recommendations', { 
      seed_tracks: seedTracks.join(','),
      seed_artists: seedArtists.join(','),
      seed_genres: seedGenres.join(','),
      limit 
    })
  },
}

export { eclipseFetch }