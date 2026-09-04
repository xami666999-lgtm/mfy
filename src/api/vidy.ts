/**
 * Vidy player (https://vidsrc.xyz) — an iframe streaming player for movies, TV
 * shows and anime. Alternative to torrent streams that needs no WebTorrent.
 *
 * Routes:
 *   /movie/{tmdbId}
 *   /tv/{tmdbId}/{season}/{episode}
 *   /anime/{anilistId}/{episode}
 */

const VIDY_BASE = 'https://vidsrc.xyz/embed'

/** Build a Vidy embed URL for a movie / TV show (TMDB ids) */
export function vidyUrl(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (type === 'movie') return `https://vidsrc.xyz/embed/movie/${tmdbId}`
  const s = season ?? 1
  const e = episode ?? 1
  return `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`
}

/** Build a Vidy embed URL for an anime (AniList id) */
export function vidyAnimeUrl(anilistId: number | string, episode = 1): string {
  return `${VIDY_BASE}/anime/${anilistId}/${episode}`
}

export type PlayerSource = 'vidy' | 'playtorrio' | 'simplstream' | 'zangetsu' | 'miruro' | 'mangayomi' | 'mediafusion' | 'flix' | 'nyaa' | 'animeflv' | 'onepace' | 'streamsppv' | 'sportsstreams' | 'moviebox'

export const ANIME_SOURCES: PlayerSource[] = ['zangetsu', 'miruro', 'mangayomi', 'mediafusion', 'flix', 'nyaa', 'animeflv', 'sportsstreams']
export const MOVIE_TV_SOURCES: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'mediafusion', 'flix', 'moviebox']

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number, anime = false): string {
  const s = season ?? 1
  const e = episode ?? 1
  if (source === 'zangetsu' || (anime && source === 'zangetsu')) {
    return type === 'movie'
      ? `https://vidfast.pro/movie/${tmdbId}`
      : `https://vidfast.pro/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'miruro' || (anime && source === 'miruro')) {
    return type === 'movie'
      ? `https://vidsrc.to/embed/movie/${tmdbId}`
      : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'mangayomi' || (anime && source === 'mangayomi')) {
    return type === 'movie'
      ? `https://vidsrc.to/embed/movie/${tmdbId}`
      : `https://vidsrc.to/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (anime) {
    return `https://vidfast.pro/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'moviebox') {
    return `https://moviebox.ph/web/searchResult?keyword=${encodeURIComponent(String(tmdbId))}`
  }
  if (source === 'mediafusion') {
    return `mfusion:${type}:${tmdbId}:${s}:${e}`
  }
  if (source === 'playtorrio') {
    return type === 'movie' ? `https://vidsrc.me/embed/movie/${tmdbId}` : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'simplstream') {
    return type === 'movie' ? `https://vidlink.pro/movie/${tmdbId}` : `https://vidlink.pro/tv/${tmdbId}/${s}/${e}`
  }
  if (type === 'movie') return `https://vidsrc.me/embed/movie/${tmdbId}`
  return `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
}

export function isPlayerEmbed(url: string): boolean {
  if (!url) return false
  return /vidy\.st|playtorrio|simplstream|zangetsu|miruro|youtube|youtu\.be|nadeko|yewtu|invidious|embed/.test(url)
}

export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  const sources: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro', 'mediafusion']
  return sources.map((source) => ({ source, url: getPlayerUrl(source, type, tmdbId, season, episode) }))
}