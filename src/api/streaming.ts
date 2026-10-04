export interface StreamingService {
  id: string
  name: string
  color: string
  logo: string
  tmdbId: number
}

export const streamingServices: StreamingService[] = [
  { id: 'netflix', name: 'Netflix', color: '#E50914', logo: './logos/netflix.png', tmdbId: 8 },
  { id: 'prime', name: 'Prime Video', color: '#00A8E1', logo: './logos/amazon-prime.png', tmdbId: 9 },
  { id: 'disney', name: 'Disney+', color: '#113CCF', logo: './logos/disney-plus.png', tmdbId: 337 },
  { id: 'apple', name: 'Apple TV+', color: '#55585c', logo: './logos/apple-tv.svg', tmdbId: 350 },
  { id: 'hulu', name: 'Hulu', color: '#1CE783', logo: './logos/hulu.png', tmdbId: 15 },
  { id: 'paramount', name: 'Paramount+', color: '#0064FF', logo: './logos/paramount-plus.png', tmdbId: 531 },
  { id: 'peacock', name: 'Peacock', color: '#0c1222', logo: './logos/peacock.png', tmdbId: 387 },
  { id: 'hbo', name: 'HBO Max', color: '#4b1d8f', logo: './logos/max.png', tmdbId: 1899 },
  { id: 'crunchyroll', name: 'Crunchyroll', color: '#F47521', logo: './logos/crunchyroll.svg', tmdbId: 283 },
  { id: 'viki', name: 'Rakuten Viki', color: '#3a22b8', logo: '', tmdbId: 344 },
]

export function getProvidersForMedia(watchProviders: any): string[] {
  if (!watchProviders?.results) return []
  const region = watchProviders.results.US || watchProviders.results.GB || Object.values(watchProviders.results)[0] as any
  if (!region?.flatrate) return []
  return region.flatrate.map((p: any) => p.provider_name)
}
