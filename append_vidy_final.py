with open('C:\\Users\\Noah\\Desktop\\mfy-app\\src\\api\\vidy.ts', 'a', encoding='utf-8') as f:
    f.write('''
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
    return 'https://vidking.net/tv/' + tmdbId + '/' + (season ?? 1) + '/' + (episode ?? 1)
  }
  // vidy
  if (type === 'movie') return 'https://vidy.st/movie/' + tmdbId
  return 'https://vidy.st/tv/' + tmdbId + '/' + (season ?? 1) + '/' + (episode ?? 1)
}

export function isPlayerEmbed(url: string): boolean {
  return Boolean(url && (url.includes('vidy.st') || url.includes('vidking.net')))
}

/** Fallback sources for a given media */
export function getFallbackSources(type: 'movie' | 'tv', tmdbId: number | string | undefined, season?: number, episode?: number): { source: string; url: string }[] {
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
""")
print('Done')