import subprocess

content = """\
/**
 * Vidy player (https://vidy.st) -- an iframe streaming player for movies, TV
 * shows and anime. Alternative to torrent streams that needs no WebTorrent.
 *
 * Routes:
 *   /movie/{tmdbId}
 *   /tv/{tmdbId}/{season}/{episode}
 *   /anime/{anilistId}/{episode}
 */

const VIDY_BASE = 'https://vidy.st'
const VIDKING_BASE = 'https://vidking.net'

/** Build a Vidy embed URL for a movie / TV show (TMDB ids) */
export function vidyUrl(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (type === 'movie') return VIDY_BASE + '/movie/' + tmdbId
  const s = season ?? 1
  const e = episode ?? 1
  return VIDY_BASE + '/tv/' + tmdbId + '/' + s + '/' + e
}

/** Build a Vidy embed URL for an anime (AniList id) */
export function vidyAnimeUrl(anilistId: number | string, episode = 1): string {
  return VIDY_BASE + '/anime/' + anilistId + '/' + episode
}

const VIDKING_BASE = 'https://vidking.net'

/** Build a VidKing embed URL for a movie / TV show (TMDB ids) */
export function vidkingUrl(type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (type === 'movie') return 'https://vidking.net/movie/' + tmdbId
  const s = season ?? 1
  const e = episode ?? 1
  return 'https://vidking.net/tv/' + tmdbId + '/' + s + '/' + e
}

export type PlayerSource = 'vidy' | 'vidking'

export function getPlayerUrl(source: PlayerSource, type: 'movie' | 'tv', tmdbId: number | string, season?: number, episode?: number): string {
  if (source === 'vidking') {
    if (type === 'movie') return 'https://vidking.net/movie/' + tmdbId
    const s = season ?? 1
    const e = episode ?? 1
    return 'https://vidking.net/tv/' + tmdbId + '/' + s + '/' + e
  }
  // vidy
  if (type === 'movie') return VIDY_BASE + '/movie/' + tmdbId
  const s = season ?? 1
  const e = episode ?? 1
  return VIDY_BASE + '/tv/' + tmdbId + '/' + s + '/' + e
}

export function isPlayerEmbed(url: string): boolean {
  return Boolean(url && (url.includes('vidy.st') || url.includes('vidking.net')))
}

/** Fallback sources for a given media */
export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: PlayerSource; url: string }[] {
  if (!tmdbId) return []
  return [
    { source: 'vidy', url: 'https://vidy.st/' + (type === 'movie' ? 'movie' : 'tv') + '/' + tmdbId + (type === 'tv' ? '/' + (season ?? 1) + '/' + (episode ?? 1) : '') },
    { source: 'vidking', url: 'https://vidking.net/' + (type === 'movie' ? 'movie' : 'tv') + '/' + tmdbId + (type === 'tv' ? '/' + (season ?? 1) + '/' + (episode ?? 1) : '') },
  ]
}

export type PlayerSource = 'vidy' | 'vidking'

export function isPlayerEmbed(url: string): boolean {
  return Boolean(url && (url.includes('vidy.st') || url.includes('vidking.net')))
}
"""

with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')