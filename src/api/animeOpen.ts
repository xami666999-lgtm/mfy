import { tmdb } from './tmdb'
import { useStore } from '../store'

/**
 * AniList items use AniList ids — TMDB can't look them up directly. Resolve by
 * searching TMDB for the anime's title and opening the best movie/series match.
 */
export async function openAnime(item: any, onOpen: (id: number, type: 'movie' | 'tv') => void) {
  const q = (
    typeof item.title === 'string'
      ? item.title
      : (item.title?.english || item.title?.romaji || item.title?.native || item.name || '')
  ).trim()
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
  // No TMDB match: open the search page with the title so the user can pick,
  // instead of landing on a broken detail page.
  try {
    useStore.getState().setSearchQuery(q)
    useStore.getState().setCurrentPage('search')
  } catch {
    onOpen(item.id, 'tv')
  }
}