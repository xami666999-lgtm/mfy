import { tmdb } from './tmdb'

/**
 * Franchise definitions.
 * Each franchise is resolved by combining TMDB keyword search results
 * (for broad movie+show coverage) with TMDB collections (for exact
 * series ordering). Results are merged, deduplicated and sorted by date.
 */

export interface Franchise {
  id: string
  name: string
  tagline: string
  color: string
  logo: string
  keywords: number[]
  collections: number[]
}

export const franchises: Franchise[] = [
  {
    id: 'marvel',
    name: 'Marvel',
    tagline: 'Marvel Cinematic Universe',
    color: '#ED1D24',
    logo: '/logos/marvel.svg',
    keywords: [180547], // marvel cinematic universe (mcu)
    collections: [86311], // The Avengers Collection
  },
  {
    id: 'star-wars',
    name: 'Star Wars',
    tagline: 'A long time ago in a galaxy far, far away…',
    color: '#FFE81F',
    logo: '/logos/star-wars.svg',
    keywords: [379196], // star wars
    collections: [10], // Star Wars Collection
  },
  {
    id: 'harry-potter',
    name: 'Harry Potter',
    tagline: 'The wizarding world',
    color: '#B3933F',
    logo: '/logos/harry-potter.svg',
    keywords: [377309], // harry potter
    collections: [1241], // Harry Potter Collection
  },
  {
    id: 'dc',
    name: 'DC',
    tagline: 'DC Universe',
    color: '#0476F4',
    logo: '/logos/dc-white.svg',
    keywords: [229266, 378944, 377234, 362002], // dceu, batman, superman, wonder woman
    collections: [404770, 421904], // Superman DCU Animated, Batman DCU Animated
  },
  {
    id: 'lotr',
    name: 'Lord of the Rings',
    tagline: 'Middle-earth',
    color: '#C6A24B',
    logo: './logos/lotr.png',
    keywords: [361758, 380963], // lord of the rings, hobbit
    collections: [119, 121938], // LOTR Collection, The Hobbit Collection
  },
  {
    id: 'fast-furious',
    name: 'Fast & Furious',
    tagline: 'The family',
    color: '#1B6DC1',
    logo: '/logos/fast-furious.png',
    keywords: [348640], // fast and furious
    collections: [9485], // The Fast and the Furious Collection
  },
  {
    id: 'mission-impossible',
    name: 'Mission Impossible',
    tagline: 'Your mission, should you choose to accept it…',
    color: '#8E2433',
    logo: './logos/mission-impossible.png',
    keywords: [362720], // mission impossible
    collections: [87359], // Mission: Impossible Collection
  },
  {
    id: 'star-trek',
    name: 'Star Trek',
    tagline: 'To boldly go where no one has gone before',
    color: '#FFC60A',
    logo: './logos/star-trek.svg',
    keywords: [327763], // star trek
    collections: [151, 115575], // TOS Collection, Alternate Reality Collection
  },
  {
    id: 'nickelodeon',
    name: 'Nickelodeon',
    tagline: 'Kids’ TV and movies',
    color: '#EA5B0C',
    logo: '/logos/nickelodeon.svg',
    keywords: [210624],
    collections: [],
  },
]

export interface FranchiseItem {
  id: number
  mediaType: 'movie' | 'tv'
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  releaseDate: string | null
  voteAverage: number
  media?: any
}

function toItem(media: any, mediaType: 'movie' | 'tv'): FranchiseItem | null {
  const id = Number(media.id)
  if (!id) return null
  const title = media.title || media.name || ''
  if (!title) return null
  return {
    id,
    mediaType,
    title,
    overview: media.overview || '',
    posterPath: media.poster_path || null,
    backdropPath: media.backdrop_path || null,
    releaseDate: media.release_date || media.first_air_date || null,
    voteAverage: media.vote_average || 0,
    media,
  }
}

async function fetchCollectionParts(collectionId: number): Promise<FranchiseItem[]> {
  try {
    const d = await tmdb.getCollection(collectionId)
    const parts: any[] = d?.parts || []
    return parts
      .map((p) => toItem(p, 'movie'))
      .filter((x): x is FranchiseItem => Boolean(x))
  } catch {
    return []
  }
}

async function fetchByKeywords(franchise: Franchise): Promise<FranchiseItem[]> {
  const keywordIds = franchise.keywords.join(',')
  if (!keywordIds) return []
  const [movies, shows] = await Promise.all([
    fetchKeywordPage('/discover/movie', keywordIds, 'movie'),
    fetchKeywordPage('/discover/tv', keywordIds, 'tv'),
  ])
  return [...movies, ...shows]
}

async function fetchKeywordPage(
  endpoint: string,
  keywordIds: string,
  mediaType: 'movie' | 'tv',
  page = 1
): Promise<FranchiseItem[]> {
  const sortBy = mediaType === 'movie' ? 'release_date.asc' : 'first_air_date.asc'
  const params: Record<string, string> = {
    with_keywords: keywordIds,
    sort_by: sortBy,
    page: String(page),
  }
  const d = mediaType === 'movie' ? await tmdb.discoverMovies(params) : await tmdb.discoverTV(params)
  const results: any[] = d?.results || []
  const items = results.map((r) => toItem(r, mediaType)).filter((x): x is FranchiseItem => Boolean(x))
  const totalPages = Math.min(d?.total_pages || 1, 3)
  if (page < totalPages) {
    const rest = await fetchKeywordPage(endpoint, keywordIds, mediaType, page + 1)
    return [...items, ...rest]
  }
  return items
}

/** Load all items for a franchise, merged + sorted chronologically */
export async function loadFranchise(franchise: Franchise): Promise<FranchiseItem[]> {
  const [keywordItems, ...collectionSets] = await Promise.all([
    fetchByKeywords(franchise),
    ...franchise.collections.map(fetchCollectionParts),
  ])

  const seen = new Set<string>()
  const merged: FranchiseItem[] = []
  for (const item of [...keywordItems, ...collectionSets.flat()]) {
    const key = `${item.mediaType}-${item.id}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(item)
  }

  return merged.sort((a, b) => {
    const ad = a.releaseDate ? Date.parse(a.releaseDate) : 0
    const bd = b.releaseDate ? Date.parse(b.releaseDate) : 0
    if (ad && bd) return ad - bd
    if (ad) return -1
    if (bd) return 1
    return b.voteAverage - a.voteAverage
  })
}