import { useEffect, useState } from 'react'

export function watchPercent(h?: { progress?: number; duration?: number } | null) {
  if (!h) return 0
  const p = Number(h.progress) || 0
  const d = Number(h.duration) || 0
  if (d < 30) return p > 0 ? 3 : 0
  return Math.max(0, Math.min(100, Math.round((p / d) * 100)))
}

export function isFinished(h?: { progress?: number; duration?: number; completed?: boolean; seriesCompleted?: boolean } | null) {
  if (!h) return false
  if (h.completed || h.seriesCompleted) return true
  const d = Number(h.duration) || 0
  if (d < 8 * 60) return false
  return watchPercent(h) >= 92
}

export function isEpisodeWatched(hist: any[] | undefined, mediaId: any, season?: number, episode?: number) {
  const rows = hist || []
  return rows.some((h) =>
    String(h.mediaId) === String(mediaId)
    && Number(h.season || 0) === Number(season || 0)
    && Number(h.episode || 0) === Number(episode || 0)
    && isFinished(h)
  )
}

export type WatchFace = {
  state: 'fresh' | 'progress' | 'watched' | 'started'
  pct: number
  label: string
  pending?: number
}

type Finale = { seasons: number; lastSeason: number; lastEps: number; episodes: number }
const finales = new Map<string, Finale | 0>()
const finaleWaiters = new Set<() => void>()

function normTitle(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function useSeriesTotals(hist: any[] | undefined) {
  const [, bump] = useState(0)
  useEffect(() => {
    const kick = () => bump((n) => n + 1)
    finaleWaiters.add(kick)
    const ids = new Set<string>()
    for (const row of hist || []) {
      if (row?.mediaType === 'movie' || row?.seriesCompleted) continue
      if (!row?.completed && !isFinished(row)) continue
      const id = String(row.mediaId || '')
      if (id && !finales.has(id)) ids.add(id)
    }
    ids.forEach((id) => {
      finales.set(id, 0)
      import('../api/tmdb').then(({ tmdb }) => tmdb.getTVDetail(Number(id))).then((detail: any) => {
        const seasons = (detail?.seasons || []).filter((s: any) => Number(s.season_number) > 0)
        const last = [...seasons].sort((a: any, b: any) => Number(b.season_number) - Number(a.season_number))[0]
        const info: Finale = {
          seasons: Number(detail?.number_of_seasons) || seasons.length || 0,
          lastSeason: Number(last?.season_number) || Number(detail?.number_of_seasons) || 1,
          lastEps: Number(last?.episode_count) || 0,
          episodes: Number(detail?.number_of_episodes) || 0,
        }
        if (info.lastEps > 0 || info.episodes > 0) finales.set(id, info)
        finaleWaiters.forEach((fn) => fn())
      }).catch(() => {})
    })
    return () => { finaleWaiters.delete(kick) }
  }, [hist])
}

/** Poster footer: a finished series says Finished. A started show with episodes left keeps a progress bar. */
export function watchFace(hist: any[] | undefined, mediaId: any, item?: any): WatchFace {
  const want = normTitle(item?.title || item?.name)
  const rows = (hist || []).filter((h) => String(h.mediaId) === String(mediaId) || (want.length > 4 && normTitle(h.title) === want))
  if (!rows.length) return { state: 'fresh', pct: 0, label: '' }
  const latest = [...rows].sort((a, b) => String(b.watchedAt || '').localeCompare(String(a.watchedAt || '')))[0]
  const pct = watchPercent(latest)
  const ep = Number(latest.episode) || Number(item?.episode) || 0
  const ids = new Set(rows.map((h) => String(h.mediaId)))
  const known = [...ids].map((id) => finales.get(id)).find((info) => info && typeof info === 'object') as Finale | undefined
  const total = Number(item?.number_of_episodes || item?.episodes || item?.episodeCount || known?.episodes) || 0
  const movie = latest.mediaType === 'movie' || item?.media_type === 'movie' || item?.mediaType === 'movie' || (!ep && latest.mediaType !== 'tv' && item?.media_type !== 'tv')
  const episodeDone = !!(latest.completed || isFinished(latest))
  const doneRows = rows.filter((h) => h.completed || h.seriesCompleted || isFinished(h))
  const hitFinale = !!known && doneRows.some((h) => {
    const season = Number(h.season) || 1
    const episode = Number(h.episode) || 0
    return season >= known.lastSeason && episode >= known.lastEps && known.lastEps > 0
  })
  const caughtUp = rows.some((h) => h.seriesCompleted) || !!item?.seriesCompleted
    || (movie && doneRows.length > 0)
    || hitFinale
    || (!movie && total > 0 && doneRows.some((h) => (Number(h.episode) || 0) >= total))

  if (caughtUp) return { state: 'watched', pct: 100, label: 'Finished' }

  const watchedThrough = episodeDone ? ep : Math.max(0, ep - 1)
  const pending = !movie && total > watchedThrough ? total - watchedThrough : 0
  const bar = ep && total > ep
    ? Math.round((((Math.max(ep, 1) - 1) + Math.max(pct, 8) / 100) / total) * 100)
    : Math.max(8, pct)
  const label = pending
    ? `${pending} left`
    : ep
      ? `E${ep}`
      : 'Watching'

  if (pct > 2 && pct < 92 && !episodeDone) {
    return { state: 'progress', pct: Math.min(100, bar), label, pending }
  }
  return { state: 'started', pct: Math.min(100, Math.max(8, bar)), label, pending }
}
