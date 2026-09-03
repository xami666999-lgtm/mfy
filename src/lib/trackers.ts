import { serializdApi } from '../api/serializd'
import { anilist } from '../api/anilist'

export function letterboxdUrl(title: string) {
  const q = encodeURIComponent(title)
  return `https://letterboxd.com/search/films/${q}/`
}

export function isAnimeItem(item: any) {
  if (!item) return false
  if (item.kind === 'anime' || item.isAnime) return true
  const g = (item.genres || []).map((x: any) => String(x.name || x).toLowerCase())
  return g.includes('animation') && (item.origin_country || []).includes('JP')
}

export async function syncRating(opts: {
  title: string
  type: 'movie' | 'tv' | 'anime' | 'manga'
  tmdbId?: number | string
  score: number
  season?: number
  episode?: number
  serializdOn: boolean
  note?: string
}) {
  const notes: string[] = []
  if (opts.note) {
    try {
      const rows = JSON.parse(localStorage.getItem('mfy-reviews') || '[]')
      rows.unshift({ title: opts.title, type: opts.type, score: opts.score, note: opts.note, at: new Date().toISOString() })
      localStorage.setItem('mfy-reviews', JSON.stringify(rows.slice(0, 100)))
    } catch {}
  }
  if (opts.serializdOn && (opts.type === 'movie' || opts.type === 'tv')) {
    try {
      const id = Number(opts.tmdbId)
      if (id) {
        if (opts.type === 'tv' && opts.season && opts.episode) {
          await serializdApi.logEpisodes(id, opts.season, [opts.episode]).catch(() => serializdApi.logShow(id))
        } else {
          await serializdApi.logShow(id)
        }
        notes.push('Serializd')
      }
    } catch {}
  }
  if (opts.type === 'anime' || opts.type === 'manga') {
    try {
      await anilist.saveScore(opts.title, opts.score, opts.type === 'manga' ? 'MANGA' : 'ANIME')
      notes.push('AniList')
    } catch {}
  }
  if (opts.type === 'movie') {
    try {
      const api = (window as any).electronAPI
      const url = letterboxdUrl(opts.title)
      if (api?.openExternal) api.openExternal(url)
      else window.open(url, '_blank')
      notes.push('Letterboxd')
    } catch {}
  }
  return notes
}
