import { tmdb } from './tmdb'

/**
 * AniList items use AniList ids — TMDB can't look them up directly. Resolve by
 * searching TMDB for the anime's title and opening the best movie/series match.
 */
export async function openAnime(item: any, onOpen: (id: number, type: 'movie' | 'tv') => void) {
  const q = (item.title?.english || item.title?.romaji || item.title?.native || '').trim()
  if (!q) return
  try {
    const res = await tmdb.searchMulti(q)
    const results: any[] = res?.results || []
    const hit =
      results.find((r: any) => (r.media_type === 'tv' || r.media_type === 'movie') && (r.name || r.title || '').toLowerCase().includes(q.toLowerCase())) ||
      results.find((r: any) => r.media_type === 'tv' || r.media_type === 'movie') ||
      results[0]
    if (hit) {
      onOpen(hit.id, hit.media_type === 'movie' ? 'movie' : 'tv')
      return
    }
  } catch {
    // fall through
  }
  // Last resort: open the AniList item as a series so the detail page at least shows
  // a loading state rather than nothing (user can search the title manually).
  onOpen(item.id, 'tv')
}