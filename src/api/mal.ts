const MAL = 'https://api.myanimelist.net/v2'
const CLIENT = '6114d00ca681b7701d1e15fe11a4987e'
const JIKAN = 'https://api.jikan.moe/v4'

async function raw(url: string, headers?: Record<string, string>) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { headers, timeoutMs: 20000 })
    if (r?.ok && r.json) return r.json
    throw new Error(r?.error || 'fetch failed')
  }
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

function malCard(node: any) {
  const pic = node.main_picture?.large || node.main_picture?.medium || ''
  const type = String(node.media_type || 'manga').toLowerCase()
  return {
    id: node.id,
    mal_id: node.id,
    title: node.alternative_titles?.en || node.title,
    name: node.alternative_titles?.en || node.title,
    image: pic,
    coverImage: pic,
    poster_path: pic,
    score: node.mean || 0,
    vote_average: node.mean || 0,
    overview: node.synopsis || '',
    genres: (node.genres || []).map((g: any) => g.name),
    media_type: /novel/.test(type) ? 'novel' : 'manga',
    mal_type: type,
    status: node.status,
  }
}

function jikanCard(row: any) {
  const img = row.images?.jpg?.large_image_url || row.images?.jpg?.image_url || row.images?.webp?.large_image_url || ''
  const type = String(row.type || 'Manga')
  return {
    id: row.mal_id,
    mal_id: row.mal_id,
    title: row.title_english || row.title,
    name: row.title_english || row.title,
    image: img,
    coverImage: img,
    poster_path: img,
    score: row.score || 0,
    vote_average: row.score || 0,
    overview: row.synopsis || '',
    genres: (row.genres || []).map((g: any) => g.name),
    media_type: /novel/i.test(type) ? 'novel' : 'manga',
    mal_type: type,
    status: row.status,
  }
}

const FIELDS = 'id,title,main_picture,alternative_titles,start_date,mean,synopsis,genres,media_type,status,num_volumes,num_chapters,popularity,rank'

export const MAL_RANKS = [
  { id: 'all', name: 'Top manga' },
  { id: 'manga', name: 'Manga series' },
  { id: 'novels', name: 'Novels' },
  { id: 'oneshots', name: 'One-shots' },
  { id: 'manhwa', name: 'Manhwa' },
  { id: 'manhua', name: 'Manhua' },
  { id: 'popularity', name: 'Most popular' },
  { id: 'favorite', name: 'Most favorited' },
] as const

export const MAL_GENRES = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Thriller' },
  { id: 27, name: 'Shounen' },
  { id: 42, name: 'Seinen' },
  { id: 25, name: 'Shoujo' },
  { id: 43, name: 'Josei' },
]

export const mal = {
  ranking: async (type: string, limit = 50) => {
    try {
      const d = await raw(
        `${MAL}/manga/ranking?ranking_type=${encodeURIComponent(type)}&limit=${limit}&fields=${FIELDS}`,
        { 'X-MAL-CLIENT-ID': CLIENT },
      )
      return (d.data || []).map((x: any) => malCard(x.node || x))
    } catch {
      const d = await raw(`${JIKAN}/top/manga?filter=${type === 'popularity' ? 'bypopularity' : type === 'favorite' ? 'favorite' : 'bypopularity'}&limit=25`)
      return (d.data || []).map(jikanCard)
    }
  },
  search: async (q: string, limit = 25) => {
    try {
      const d = await raw(
        `${MAL}/manga?q=${encodeURIComponent(q)}&limit=${limit}&fields=${FIELDS}`,
        { 'X-MAL-CLIENT-ID': CLIENT },
      )
      return (d.data || []).map((x: any) => malCard(x.node || x))
    } catch {
      const d = await raw(`${JIKAN}/manga?q=${encodeURIComponent(q)}&limit=25&sfw=true`)
      return (d.data || []).map(jikanCard)
    }
  },
  genre: async (genreId: number) => {
    const d = await raw(`${JIKAN}/manga?genres=${genreId}&order_by=score&sort=desc&limit=25&sfw=true`)
    return (d.data || []).map(jikanCard)
  },
  publishing: async () => {
    try {
      const d = await raw(`${JIKAN}/top/manga?filter=publishing&limit=25`)
      return (d.data || []).map(jikanCard)
    } catch {
      return []
    }
  },
}
