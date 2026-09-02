/**
 * NouTube API Client - YouTube integration
 * Source: https://github.com/nonbili/NouTube
 * A privacy-friendly YouTube frontend
 */

const NOUTUBE_BASE = 'https://api.noutube.xyz' // API endpoint

export interface NouTubeVideo {
  videoId: string
  title: string
  author: string
  authorId: string
  authorUrl: string
  videoThumbnails: Array<{ quality: string; url: string; width: number; height: number }>
  description: string
  viewCount: number
  published: number
  publishedText: string
  lengthSeconds: number
  duration: string
  liveNow: boolean
  premium: boolean
  isFamilyFriendly: boolean
  allowedRegions: string[]
  genre?: string
  genreUrl?: string
}

export interface NouTubeChannel {
  author: string
  authorId: string
  authorUrl: string
  authorThumbnails: Array<{ url: string; width: number; height: number }>
  authorVerified: boolean
  subCount: number
  description: string
  authorBanners: Array<{ url: string; width: number; height: number }>
}

export interface NouTubeSearchResult {
  videos: NouTubeVideo[]
  channels: NouTubeChannel[]
  playlists: any[]
  continuation?: string
}

async function noutubeFetch<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const url = new URL(`${NOUTUBE_BASE}${endpoint}`)
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
    throw new Error(`NouTube API error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

export const noutubeApi = {
  /**
   * Search YouTube
   */
  search: async (query: string, page = 1): Promise<NouTubeSearchResult> => {
    return noutubeFetch<NouTubeSearchResult>('/search', { q: query, page })
  },

  /**
   * Get trending videos
   */
  getTrending: async (page = 1): Promise<NouTubeSearchResult> => {
    try {
      return await noutubeFetch<NouTubeSearchResult>('/trending', { page })
    } catch {
      const d = await fetch('./data/noutube.json').then((r) => r.json())
      return { videos: d.videos || [], continuation: undefined } as any
    }
  },

  /**
   * Get video details
   */
  getVideoDetails: async (videoId: string): Promise<NouTubeVideo | null> => {
    try {
      return await noutubeFetch<NouTubeVideo>(`/video/${videoId}`)
    } catch {
      return null
    }
  },

  /**
   * Get video streams
   */
  getVideoStreams: async (videoId: string): Promise<{ adaptiveFormats: Array<{ itag: number; url: string; mimeType: string; bitrate: number; quality: string; qualityLabel?: string; container: string }> }> => {
    return noutubeFetch(`/video/${videoId}/streams`)
  },

  /**
   * Get channel details
   */
  getChannel: async (channelId: string): Promise<NouTubeChannel | null> => {
    try {
      return await noutubeFetch<NouTubeChannel>(`/channel/${channelId}`)
    } catch {
      return null
    }
  },

  /**
   * Get channel videos
   */
  getChannelVideos: async (channelId: string, page = 1): Promise<NouTubeSearchResult> => {
    return noutubeFetch<NouTubeSearchResult>(`/channel/${channelId}/videos`, { page })
  },

  /**
   * Get related videos
   */
  getRelated: async (videoId: string): Promise<NouTubeVideo[]> => {
    const result = await noutubeFetch<{ videos: NouTubeVideo[] }>(`/video/${videoId}/related`)
    return result.videos || []
  },

  /**
   * Get comments
   */
  getComments: async (videoId: string, page = 1): Promise<any[]> => {
    const result = await noutubeFetch<{ comments: any[] }>(`/video/${videoId}/comments`, { page })
    return result.comments || []
  },

  /**
   * Get trending music
   */
  getTrendingMusic: async (page = 1): Promise<NouTubeSearchResult> => {
    try {
      return await noutubeFetch<NouTubeSearchResult>('/music/trending', { page })
    } catch {
      const d = await fetch('./data/noutube.json').then((r) => r.json())
      return { videos: d.videos || [] } as any
    }
  },

  /**
   * Get music charts
   */
  getMusicCharts: async (page = 1): Promise<NouTubeSearchResult> => {
    return noutubeFetch<NouTubeSearchResult>('/music/charts', { page })
  },

  /**
   * Get video info for embed player
   */
  getEmbedUrl: (videoId: string): string => {
    return `https://www.youtube-nocookie.com/embed/${videoId}`
  },

  /**
   * Get Invidious instances as fallback
   */
  getInstances: async (): Promise<string[]> => {
    try {
      const res = await fetch('https://api.invidious.io/instances.json')
      const data = await res.json() as Record<string, { health: number; type: string; api: boolean; api_latency: number }>
      return Object.entries(data)
        .filter(([, v]) => v.health === 1 && v.type === 'public' && v.api)
        .sort((a, b) => b[1].api_latency - a[1].api_latency)
        .slice(0, 5)
        .map(([k]) => k)
    } catch {
      return ['https://yewtu.be', 'https://yewtu.be', 'https://inv.nadeko.net', 'https://inv.nadeko.net']
    }
  },
}

export { noutubeFetch }