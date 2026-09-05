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

export type PlayerSource = 'vidy' | 'playtorrio' | 'simplstream' | 'zangetsu' | 'miruro' | 'mangayomi' | 'mediafusion' | 'flix' | 'nyaa' | 'animeflv' | 'onepace' | 'streamsppv' | 'sportsstreams' | 'moviebox' | 'vixsrc' | 'vidnest' | 'animepahe' | 'pengu' | 'webtorrent'

export const ANIME_SOURCES: PlayerSource[] = ['zangetsu', 'miruro', 'animepahe', 'playtorrio', 'simplstream', 'vidy', 'vixsrc', 'vidnest', 'moviebox', 'pengu']
export const MOVIE_TV_SOURCES: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'moviebox', 'vixsrc', 'vidnest', 'pengu']
export const ALL_PLAY_SOURCES: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'moviebox', 'vixsrc', 'vidnest', 'pengu', 'zangetsu', 'miruro', 'animepahe', 'webtorrent']

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number, anime = false): string {
  const s = season ?? 1
  const e = episode ?? 1
  const movie = type === 'movie'
  const dub = anime ? 'dub=true&' : ''
  if (source === 'zangetsu') {
    return movie
      ? `https://player.videasy.net/movie/${tmdbId}?${dub}color=FF1493`
      : `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?${dub}color=FF1493`
  }
  if (source === 'miruro') {
    return movie
      ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}?autoPlay=true`
      : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}?autoPlay=true`
  }
  if (source === 'animepahe' || source === 'mangayomi') {
    return movie
      ? `https://vidsrc.xyz/embed/movie/${tmdbId}`
      : (anime ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}` : `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`)
  }
  if (source === 'moviebox') {
    return movie ? `https://embed.su/embed/movie/${tmdbId}` : `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'pengu') {
    return movie ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}` : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'vixsrc') {
    return movie ? `https://vixsrc.to/movie/${tmdbId}` : `https://vixsrc.to/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'vidnest') {
    return movie ? `https://vidnest.fun/movie/${tmdbId}` : `https://vidnest.fun/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'mediafusion') {
    return `mfusion:${type}:${tmdbId}:${s}:${e}`
  }
  if (source === 'playtorrio') {
    return movie ? `https://vidsrc.me/embed/movie/${tmdbId}` : `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'simplstream') {
    const extra = `${dub}autoPlay=true&muted=false&autoplay=1`
    return movie ? `https://vidlink.pro/movie/${tmdbId}?${extra}` : `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?${extra}`
  }
  if (source === 'vidy') {
    return movie ? `https://vidsrc.xyz/embed/movie/${tmdbId}` : `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`
  }
  if (movie) return `https://vidsrc.me/embed/movie/${tmdbId}`
  return `https://vidsrc.me/embed/tv/${tmdbId}/${s}/${e}`
}

export function isPlayerEmbed(url: string): boolean {
  if (!url) return false
  if (/127\.0\.0\.1|localhost|magnet:/i.test(url)) return false
  if (/pengu\.uk\/signin|signin\.mp4/i.test(url)) return false
  if (/pengu\.uk|vixsrc\.to|vidnest\.fun|vidsrc\.|vidlink\.pro|vidfast\.pro|moviebox\.ph|youtube|youtu\.be|invidious|nadeko|embed|player\.|videasy|epiembeds/i.test(url)) return true
  if (/^https?:/i.test(url) && !/\.(mp4|m3u8|mkv|webm|avi)(\?|$)/i.test(url)) return true
  return false
}

export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  const sources: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro', 'mediafusion']
  return sources.map((source) => ({ source, url: getPlayerUrl(source, type, tmdbId, season, episode) }))
}