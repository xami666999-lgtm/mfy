export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  media_type?: 'movie'
}

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  media_type?: 'tv'
}

export interface Anime {
  id: number
  title: { romaji: string; english: string; native: string }
  coverImage: { large: string; color: string }
  bannerImage: string | null
  description: string
  averageScore: number
  genres: string[]
  episodes: number
  status: string
}

export interface MediaDetail {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  runtime?: number
  genres: { id: number; name: string }[]
  credits?: {
    cast: { id: number; name: string; profile_path: string | null; character: string }[]
    crew: { id: number; name: string; job: string; profile_path: string | null }[]
  }
  videos?: {
    results: { id: string; key: string; site: string; type: string; name: string }[]
  }
  seasons?: {
    id: number
    name: string
    season_number: number
    episode_count: number
    poster_path: string | null
    air_date: string
  }[]
  episode_run_time?: number[]
  number_of_seasons?: number
  number_of_episodes?: number
}

export interface SeasonDetail {
  id: number
  name: string
  overview: string
  season_number: number
  episodes: Episode[]
}

export interface Episode {
  id: number
  name: string
  overview: string
  episode_number: number
  season_number: number
  air_date: string
  still_path: string | null
  vote_average: number
  runtime: number | null
}

export interface StreamSource {
  url: string
  type: 'hls' | 'dash' | 'mp4' | 'torrent'
  quality: string
  provider: string
  debrid?: boolean
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  createdAt: string
  pin?: string
}

export interface WatchHistoryItem {
  id: string
  mediaId: number | string
  mediaType: 'movie' | 'tv' | 'iptv'
  title: string
  posterPath: string | null
  progress: number
  duration: number
  season?: number
  episode?: number
  watchedAt: string
  profileId: string
}

export interface CustomList {
  id: string
  name: string
  profileId: string
  items: { mediaId: number | string; mediaType: 'movie' | 'tv' | 'iptv'; addedAt: string; title?: string; posterPath?: string | null }[]
}

export interface StreamingService {
  id: string
  name: string
  logo: string
  color: string
}

export type Page = 'home' | 'discover' | 'search' | 'search-results' | 'library' | 'settings' | 'detail' | 'player' | 'wizard' | 'guide' | 'provider' | 'franchise' | 'movies' | 'tv' | 'anime' | 'sports' | 'iptv' | 'providers' | 'franchises' | 'manga' | 'manga-detail' | 'airing' | 'mangayomi' | 'mangayomi-detail' | 'zangetsu' | 'zangetsu-detail' | 'simplstream' | 'simplstream-detail'
