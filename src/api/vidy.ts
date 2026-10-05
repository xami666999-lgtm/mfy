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
      `https://vidsrc2.ru/embed/movie/${tmdbId}`,
      `https://vidsrc.ir/embed/movie/${tmdbId}`,
      `https://vidlink.pro/movie/${tmdbId}?autoplay=1`,
      `https://vidcore.org/embed/movie/${tmdbId}`,
    ]
  }
  return [
    `https://vidsrc.sh/embed/tv/${tmdbId}/${s}/${e}`,
    `https://vidsrc2.ru/embed/tv/${tmdbId}/${s}/${e}`,
    `https://vidsrc.ir/embed/tv/${tmdbId}/${s}/${e}`,
    `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?autoplay=1`,
    `https://vidcore.org/embed/tv/${tmdbId}/${s}/${e}`,
  ]
}

export function isDeadEmbed(url: string) {
  return /videasy\.|vidsrc\.xyz|vidsrc\.cc|vidsrc\.me\/|embed\.su|vixsrc\.to|moviesapi\.club|vidsrc\.(icu|in|net|rip|wtf)/i.test(url || '')
}

export function withAudioLang(url: string, lang: 'ja' | 'en' | 'orig') {
  if (!url || lang === 'orig') return url
  const code = lang === 'en' ? 'en' : 'ja'
  const base = url.split('#')[0]
  const hash = url.includes('#') ? url.slice(url.indexOf('#')) : ''
  const [path, query = ''] = base.split('?')
  const params = new URLSearchParams(query)
  for (const key of ['audio', 'al', 'audio_lang', 'alang', 'dub']) params.set(key, code)
  if (!params.get('sub_lang')) params.set('sub_lang', 'en')
  return `${path}?${params.toString()}${hash}`
}

function withEnglishSubs(url: string) {
  if (!url || /[?&](sub_lang|ds_lang|lang)=/i.test(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}sub_lang=en&lang=en&ds_lang=en`
}

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number, _anime = false): string {
  const chain = embedChain(type, tmdbId, season, episode)
  const order: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro', 'moviebox', 'pengu', 'vixsrc', 'vidnest', 'animepahe', 'mangayomi']
  const at = Math.max(0, order.indexOf(source))
  return withEnglishSubs(chain[at % chain.length])
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