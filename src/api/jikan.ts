const BASE = 'https://api.jikan.moe/v4'

async function getJson(path: string) {
  const url = `${BASE}${path}`
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 20000 })
    if (r?.ok && r.json) return r.json
    throw new Error(r?.error || 'Jikan failed')
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jikan ${res.status}`)
  return res.json()
}

function card(row: any) {
  const img = row.images?.jpg?.large_image_url || row.images?.jpg?.image_url || row.images?.webp?.large_image_url || ''
  return {
    id: row.mal_id,
    mal_id: row.mal_id,
    title: row.title_english || row.title,
    name: row.title_english || row.title,
    image: img,
    coverImage: img,
    poster_path: img,
    score: row.score,
    genres: (row.genres || []).map((g: any) => g.name),
    overview: row.synopsis,
    media_type: /novel/i.test(row.type||'') ? 'book' : /manga|manhwa|manhua|one.shot|doujin/i.test(row.type||'') ? 'manga' : (row.type === 'Movie' ? 'movie' : 'tv'),
  }
}

export const jikan = {
  topAnime: async (page = 1) => {
    const d = await getJson(`/top/anime?page=${page}&limit=25`)
    return (d.data || []).map(card)
  },
  topManga: async (page = 1) => {
    const d = await getJson(`/top/manga?page=${page}&limit=25`)
    return (d.data || []).map(card)
  },
  searchAnime: async (q: string, page = 1) => {
    const d = await getJson(`/anime?q=${encodeURIComponent(q)}&page=${page}&limit=25&sfw=true`)
    return (d.data || []).map(card)
  },
  searchManga: async (q: string, page = 1) => {
    const d = await getJson(`/manga?q=${encodeURIComponent(q)}&page=${page}&limit=25&sfw=true`)
    return (d.data || []).map(card)
  },
  seasonNow: async () => {
    const d = await getJson('/seasons/now?limit=25')
    return (d.data || []).map(card)
  },
  seasonUpcoming: async () => {
    const d = await getJson('/seasons/upcoming?limit=25')
    return (d.data || []).map(card)
  },
  topByType: async (type: string, page = 1) => {
    const d = await getJson(`/top/manga?type=${encodeURIComponent(type)}&page=${page}&limit=25`)
    return (d.data || []).map(card)
  },
}

