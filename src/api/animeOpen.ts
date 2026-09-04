import { tmdb } from './tmdb'
import { useStore } from '../store'

function namesOf(item: any): string[] {
  const raw = [
    typeof item.title === 'string' ? item.title : '',
    item.title?.english,
    item.title?.romaji,
    item.title?.native,
    item.name,
    item.original_name,
    item.original_title,
  ].map((s) => String(s || '').trim()).filter(Boolean)
  const extra = raw.flatMap((s) => [
    s,
    s.replace(/\s*season\s*\d+.*$/i, '').trim(),
    s.replace(/\s*\(.*?\)\s*/g, ' ').trim(),
  ])
  return [...new Set(extra.filter((s) => s.length > 1))]
}

export async function openAnime(item: any, onOpen: (id: number, type: 'movie' | 'tv') => void) {
  const queries = namesOf(item)
  if (!queries.length) return
  const wantMovie = /movie/i.test(String(item.format || item.media_type || item.type || ''))
  try {
    for (const q of queries.slice(0, 4)) {
      const res = await tmdb.searchMulti(q)
      const results: any[] = res?.results || []
      const scored = results
        .filter((r: any) => r.media_type === 'tv' || r.media_type === 'movie')
        .map((r: any) => {
          const name = String(r.name || r.title || '').toLowerCase()
          const ql = q.toLowerCase()
          let n = 0
          if (name === ql) n += 8
          if (name.includes(ql) || ql.includes(name)) n += 4
          if ((r.genre_ids || []).includes(16)) n += 3
          if (r.origin_country?.includes?.('JP') || r.original_language === 'ja') n += 2
          if (wantMovie && r.media_type === 'movie') n += 3
          if (!wantMovie && r.media_type === 'tv') n += 2
          return { r, n }
        })
        .sort((a, b) => b.n - a.n)
      const hit = scored[0]?.r
      if (hit) {
        onOpen(hit.id, hit.media_type === 'movie' ? 'movie' : 'tv')
        return
      }
    }
  } catch {}
  try {
    useStore.getState().setSearchQuery(queries[0])
    useStore.getState().setCurrentPage('search')
  } catch {
    onOpen(item.id, wantMovie ? 'movie' : 'tv')
  }
}
