/**
 * Vidy player (https://vidy.st) — an iframe streaming player for movies, TV
 * shows and anime. Alternative to torrent streams that needs no WebTorrent.
 *
 * Routes:
 *   /movie/{tmdbId}
 *   /tv/{tmdbId}/{season}/{episode}
 *   /anime/{anilistId}/{episode}
 */

const VIDY_BASE = 'https://vidy.st'

/** Build a Vidy embed URL for a movie / TV show (TMDB ids) */
export function vidyUrl(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (type === 'movie') return `${VIDY_BASE}/movie/${tmdbId}`
  const s = season ?? 1
  const e = episode ?? 1
  return `${VIDY_BASE}/tv/${tmdbId}/${s}/${e}`
}

/** Build a Vidy embed URL for an anime (AniList id) */
export function vidyAnimeUrl(anilistId: number | string, episode = 1): string {
  return `${VIDY_BASE}/anime/${anilistId}/${episode}`
}

export type PlayerSource = 'vidy'

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  // vidy
  if (type === 'movie') return `${VIDY_BASE}/movie/${tmdbId}`
  const s = season ?? 1
  const e = episode ?? 1
  return `${VIDY_BASE}/tv/${tmdbId}/${s}/${e}`
}

export function isPlayerEmbed(url: string): boolean {
  return Boolean(url && url.includes('vidy.st'))
}

/** Fallback sources for a given media */
export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  return [
    { source: 'vidy', url: `https://vidy.st/${type === 'movie' ? 'movie' : 'tv'}/${tmdbId}${type === 'tv' ? `/${season ?? 1}/${episode ?? 1}` : ''}` },
  ]
}