import { serializdApi } from '../api/serializd'
import { anilist } from '../api/anilist'

export function letterboxdUrl(title: string) {
  const q = encodeURIComponent(title)
  return `https://letterboxd.com/search/films/${q}/`
}

export function isAnimeItem(item: any) {
  if (!item) return false
  if (item.kind === 'anime' || item.isAnime) return true
  const t = String(item.media_type || item.type || item.format || '')
  if (/anime/i.test(t)) return true
  const g = (item.genres || []).map((x: any) => String(x.name || x).toLowerCase())
  return g.includes('animation') && (item.origin_country || []).includes('JP')
}

export function isPrintItem(item: any) {
  const t = String(item?.media_type || item?.type || item?.format || '')
  return /manga|novel|book|comic/i.test(t)
}

export function trackerFor(kind: string) {
  if (kind === 'movie') return 'Letterboxd'
  if (kind === 'tv') return 'Serializd'
  return 'AniList'
}

export async function syncRating(opts: {
  title: string
  type: 'movie' | 'tv' | 'anime' | 'manga' | 'novel'
  tmdbId?: number | string
  score: number
  season?: number
  episode?: number
  serializdOn: boolean
  note?: string
}) {
  const notes: string[] = []
  const title = String(opts.title || '').replace(/^\d+$/, '') || String(opts.title)
  if (opts.note) {
    try {
      const rows = JSON.parse(localStorage.getItem('mfy-reviews') || '[]')
      rows.unshift({ title: opts.title, type: opts.type, score: opts.score, note: opts.note, at: new Date().toISOString() })
      localStorage.setItem('mfy-reviews', JSON.stringify(rows.slice(0, 100)))
    } catch {}
  }

  // Serializd — TV series only (never anime / movies)
  if (opts.serializdOn && opts.type === 'tv') {
    try {
      const id = Number(opts.tmdbId)
      if (id) {
        if (opts.season && opts.episode) {
          await serializdApi.logEpisodes(id, opts.season, [opts.episode]).catch(() => serializdApi.logShow(id))
        } else {
          await serializdApi.logShow(id)
        }
        notes.push('Serializd')
      }
    } catch {}
  }

  // AniList — anime, manga, novels
  if (opts.type === 'anime' || opts.type === 'manga' || opts.type === 'novel') {
    try {
      const q = title && !/^\d+$/.test(title) ? title : String(opts.title)
      await anilist.saveScore(q, opts.score, opts.type === 'anime' ? 'ANIME' : 'MANGA')
      notes.push('AniList')
    } catch {}
  }

  // Letterboxd — movies only
  if (opts.type === 'movie') {
    try {
      const api = (window as any).electronAPI
      const user = (() => { try { return localStorage.getItem('mfy-letterboxd-user') || '' } catch { return '' } })()
      const url = user
        ? `https://letterboxd.com/${encodeURIComponent(user)}/`
        : letterboxdUrl(title || String(opts.title))
      const multi = user
        ? `https://multiboxd.affogo.fyi/${encodeURIComponent(user)}/`
        : 'https://multiboxd.affogo.fyi/configure'
      if (api?.openExternal) { api.openExternal(url); api.openExternal(multi) }
      else { window.open(url, '_blank'); window.open(multi, '_blank') }
      notes.push('Letterboxd')
      notes.push('Multiboxd')
    } catch {}
  }
  return notes
}
