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

export type PlayerSource = 'vidy' | 'playtorrio' | 'simplstream' | 'zangetsu' | 'miruro' | 'mangayomi' | 'mediafusion' | 'flix' | 'nyaa' | 'animeflv' | 'onepace' | 'streamsppv' | 'sportsstreams' | 'moviebox' | 'vixsrc' | 'vidnest' | 'animepahe' | 'pengu' | 'pengu'

export const ANIME_SOURCES: PlayerSource[] = ['zangetsu', 'miruro', 'animepahe', 'playtorrio', 'simplstream', 'vidy', 'vixsrc', 'vidnest', 'moviebox', 'pengu']
export const MOVIE_TV_SOURCES: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'moviebox', 'vixsrc', 'vidnest', 'pengu']

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
    return type === 'movie' ? `https://embed.su/embed/movie/${tmdbId}` : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'pengu') {
    return type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}` : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'vixsrc') {
    return type === 'movie' ? `https://vixsrc.to/movie/${tmdbId}` : `https://vixsrc.to/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'vidnest') {
    return type === 'movie' ? `https://vidnest.fun/movie/${tmdbId}` : `https://vidnest.fun/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'animepahe') {
    return type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}` : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'mediafusion') {
    return `mfusion:${type}:${tmdbId}:${s}:${e}`
  }
  if (source === 'playtorrio') {
    return type === 'movie' ? `https://vidsrc.me/embed/movie/${tmdbId}` : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'simplstream') {
    const extra = 'autoPlay=true&muted=false&autoplay=1'
    return type === 'movie' ? `https://vidlink.pro/movie/${tmdbId}?${extra}` : `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?${extra}`
  }
  if (type === 'movie') return `https://vidsrc.me/embed/movie/${tmdbId}`
  return `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
}

export function isPlayerEmbed(url: string): boolean {
  if (!url) return false
  if (/pengu\.uk\/signin|signin\.mp4/i.test(url)) return false
  if (/pengu\.uk|vixsrc\.to|vidnest\.fun|vidsrc\.|vidlink\.pro|vidfast\.pro|moviebox\.ph|youtube|youtu\.be|invidious|nadeko|embed|player\.|epiembeds/i.test(url)) return true
  if (/^https?:/i.test(url) && !/\.(mp4|m3u8|mkv|webm|avi)(\?|$)/i.test(url)) return true
  return false
}

export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  const sources: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro', 'mediafusion']
  return sources.map((source) => ({ source, url: getPlayerUrl(source, type, tmdbId, season, episode) }))
}