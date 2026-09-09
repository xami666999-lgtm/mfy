/** Posterium-style posters: text-free TMDB art, optional self-hosted Posterium. */

const CACHE = new Map<string, string>()

export function posteriumBase() {
  try { return String(localStorage.getItem('mfy-posterium') || '').replace(/\/+$/, '') } catch { return '' }
}

export function posteriumUrl(type: string, id: string | number) {
  const base = posteriumBase()
  if (!base || !id) return ''
  const kind = type === 'tv' || type === 'anime' || type === 'series' ? 'series' : 'movie'
  return `${base}/api/poster/${kind}/${id}`
}

export function applyPosterium(item: any) {
  if (!item?.id) return item
  const url = posteriumUrl(item.media_type || item.type || (item.name && !item.title ? 'tv' : 'movie'), item.id)
  if (url && !String(item.poster_path || '').startsWith('http')) {
    return { ...item, poster_path: url, _posterium: true }
  }
  return item
}

export function applyPosteriumList(items: any[]) {
  return (items || []).map(applyPosterium)
}

export async function tmdbTextlessPoster(kind: 'movie' | 'tv', id: number, apiKey: string) {
  const key = `${kind}:${id}`
  if (CACHE.has(key)) return CACHE.get(key) || ''
  try {
    const r = await fetch(`https://api.themoviedb.org/3/${kind}/${id}/images?api_key=${apiKey}`)
    const j = await r.json()
    const posters = j.posters || []
    const pick = posters.find((p: any) => !p.iso_639_1) || posters[0]
    const path = pick?.file_path || ''
    if (path) CACHE.set(key, path)
    return path
  } catch {
    return ''
  }
}
