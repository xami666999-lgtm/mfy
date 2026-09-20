import { tmdb } from './tmdb'

const IMG = 'https://image.tmdb.org/t/p/w500'
const cache = new Map<string, string | null>()

function pickLogo(logos: any[] | undefined): string | null {
  if (!Array.isArray(logos) || !logos.length) return null
  const scored = logos
    .filter((l) => l?.file_path)
    .map((l) => {
      const lang = l.iso_639_1
      let score = Number(l.vote_count || 0)
      if (lang === 'en') score += 1000
      if (!lang) score += 400
      if (String(l.file_path).endsWith('.png')) score += 80
      return { path: l.file_path as string, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0] ? `${IMG}${scored[0].path}` : null
}

export async function getTitleLogo(
  mediaType: 'movie' | 'tv',
  id: number
): Promise<string | null> {
  const key = `${mediaType}:${id}`
  if (cache.has(key)) return cache.get(key) || null
  try {
    const images = await (tmdb as any).getImages?.(mediaType, id)
    if (images?.logos) {
      const url = pickLogo(images.logos)
      cache.set(key, url)
      return url
    }
    const endpoint = mediaType === 'movie' ? `/movie/${id}/images` : `/tv/${id}/images`
    const apiKey =
      (window as any).__mfyTmdbKey ||
      (import.meta as any).env?.VITE_TMDB_API_KEY ||
      '15fdef3642df31491f4e1cfc08782dc6'
    const res = await fetch(
      `https://api.themoviedb.org/3${endpoint}?api_key=${encodeURIComponent(apiKey)}&include_image_language=en,null`
    )
    if (!res.ok) {
      cache.set(key, null)
      return null
    }
    const data = await res.json()
    const url = pickLogo(data?.logos)
    cache.set(key, url)
    return url
  } catch {
    cache.set(key, null)
    return null
  }
}
