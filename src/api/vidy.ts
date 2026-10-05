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

export type PlayerSource = 'vidy' | 'playtorrio' | 'simplstream' | 'zangetsu' | 'miruro' | 'mangayomi' | 'mediafusion' | 'flix' | 'nyaa' | 'animeflv' | 'onepace' | 'streamsppv' | 'sportsstreams' | 'moviebox' | 'vixsrc' | 'vidnest' | 'animepahe' | 'pengu' | 'webtorrent' | 'pipe' | 'torrentio' | 'comet' | 'kitsu' | 'vlc'

export const ANIME_SOURCES: PlayerSource[] = ['zangetsu', 'miruro', 'animepahe', 'pipe', 'torrentio', 'comet', 'playtorrio', 'simplstream', 'vidy', 'vixsrc', 'vidnest', 'moviebox', 'pengu']
export const MOVIE_TV_SOURCES: PlayerSource[] = ['pipe', 'torrentio', 'comet', 'playtorrio', 'simplstream', 'vidy', 'moviebox', 'vixsrc', 'vidnest', 'pengu']
export const ALL_PLAY_SOURCES: PlayerSource[] = ['vlc', 'pipe', 'torrentio', 'comet', 'playtorrio', 'simplstream', 'vidy', 'moviebox', 'vixsrc', 'vidnest', 'pengu', 'zangetsu', 'miruro', 'animepahe', 'webtorrent']

export function embedChain(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string[] {
  const s = season ?? 1
  const e = episode ?? 1
  if (type === 'movie') {
    return [
      `https://vidsrc.sh/embed/movie/${tmdbId}`,
      `https://vidlink.pro/movie/${tmdbId}?autoPlay=true&autoplay=1`,
      `https://vidfast.pro/movie/${tmdbId}`,
      `https://vidsrc.su/embed/movie/${tmdbId}`,
      `https://www.2embed.cc/embed/${tmdbId}`,
    ]
  }
  return [
    `https://vidsrc.sh/embed/tv/${tmdbId}/${s}/${e}`,
    `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?autoPlay=true&autoplay=1`,
    `https://vidfast.pro/tv/${tmdbId}/${s}/${e}`,
    `https://vidsrc.su/embed/tv/${tmdbId}/${s}/${e}`,
    `https://www.2embed.cc/embedtv/${tmdbId}&s=${s}&e=${e}`,
  ]
}

export function isDeadEmbed(url: string) {
  return /videasy\.|vidsrc\.xyz|vidsrc\.cc|vidsrc\.me\/|embed\.su|vixsrc\.to|moviesapi\.club|vidsrc\.(icu|in|net|rip|wtf)/i.test(url || '')
}

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number, anime = false): string {
  const chain = embedChain(type, tmdbId, season, episode)
  const order: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro', 'moviebox', 'pengu', 'vixsrc', 'vidnest', 'animepahe', 'mangayomi']
  const at = Math.max(0, order.indexOf(source))
  const pick = chain[at % chain.length]
  if (anime && (source === 'zangetsu' || source === 'miruro' || source === 'animepahe')) return chain[3] || pick
  return pick
}

export function isPlayerEmbed(url: string): boolean {
  if (!url) return false
  if (/127\.0\.0\.1|localhost|magnet:/i.test(url)) return false
  if (/\.(mp4|m3u8|mkv|webm|avi)(\?|$)/i.test(url)) return false
  if (/pengu\.uk\/signin|signin\.mp4/i.test(url)) return false
  return /vidsrc|vidlink|vidfast|2embed|moviebox\.ph|youtube|youtu\.be|invidious|nadeko|vidnest|videasy|epiembeds|embed\/|embedtv|\/player\.|streamed\.pk|embedme|poocloud|strmd/i.test(url)
}

export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  const urls = embedChain(type, tmdbId, season, episode)
  const names: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro']
  return names.map((source, i) => ({ source, url: urls[i] || urls[0] }))
}