export interface StreamingService {
  id: string
  name: string
  color: string
  logo: string
  tmdbId: number
}

export const streamingServices: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', logo: './logos/netflix.png', tmdbId: 8 },
  { id: 'prime', name: 'Amazon Prime Video', color: '#00A8E1', logo: './logos/amazon-prime.png', tmdbId: 9 },
  { id: 'disney', name: 'Disney Plus', color: '#113CCF', logo: './logos/disney-plus.png', tmdbId: 337 },
  { id: 'apple', name: 'Apple TV+', color: '#A3AAAE', logo: './logos/apple-tv.svg', tmdbId: 350 },
  { id: 'hbo', name: 'Max', color: '#B01CDB', logo: './logos/max.png', tmdbId: 384 },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', logo: './logos/hulu.png', tmdbId: 15 },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', logo: './logos/paramount-plus.png', tmdbId: 531 },
  { id: 'peacock', name: 'Peacock', color: '#FFFFFF', logo: './logos/peacock.png', tmdbId: 387 },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', logo: './logos/crunchyroll.svg', tmdbId: 283 },
  { id: 'iplayer', name: 'BBC iPlayer', color: '#F54997', logo: './logos/bbc-iplayer.png', tmdbId: 38 },
]

export function getProvidersForMedia(watchProviders: any): string[] {
  if (!watchProviders?.results) return []
  const region = watchProviders.results.US || watchProviders.results.GB || Object.values(watchProviders.results)[0] as any
  if (!region?.flatrate) return []
  return region.flatrate.map((p: any) => p.provider_name)
}
