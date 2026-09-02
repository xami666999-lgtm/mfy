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

export type PlayerSource = 'vidy' | 'playtorrio' | 'simplstream' | 'zangetsu' | 'miruro'

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  const s = season ?? 1
  const e = episode ?? 1
  if (source === 'playtorrio') {
    return type === 'movie' ? `https://playtorrio.com/watch/movie/${tmdbId}` : `https://playtorrio.com/watch/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'simplstream') {
    return type === 'movie' ? `https://simplstream.app/watch/movie/${tmdbId}` : `https://simplstream.app/watch/tv/${tmdbId}/${s}/${e}`
  }
  if (source === 'zangetsu') return `https://zangetsu.moe/watch/${tmdbId}${type === 'tv' ? `/${e}` : ''}`
  if (source === 'miruro') return `https://www.miruro.tv/watch?id=${tmdbId}${type === 'tv' ? `&ep=${e}` : ''}`
  if (type === 'movie') return `https://vidsrc.xyz/embed/movie/${tmdbId}`
  return `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`
}

export function isPlayerEmbed(url: string): boolean {
  if (!url) return false
  return /vidy\.st|playtorrio|simplstream|zangetsu|miruro|youtube|youtu\.be|nadeko|yewtu|invidious|embed/.test(url)
}

export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  const sources: PlayerSource[] = ['playtorrio', 'simplstream', 'vidy', 'zangetsu', 'miruro']
  return sources.map((source) => ({ source, url: getPlayerUrl(source, type, tmdbId, season, episode) }))
}