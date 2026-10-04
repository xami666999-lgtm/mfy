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
  state: 'fresh' | 'progress' | 'watched'
  pct: number
  label: string
}

/** Poster footer: new titles stay on the rating line, mid-watch shows a bar, finished shows Watched. */
export function watchFace(hist: any[] | undefined, mediaId: any, item?: any): WatchFace {
  const rows = (hist || []).filter((h) => String(h.mediaId) === String(mediaId))
  if (!rows.length) return { state: 'fresh', pct: 0, label: '' }
  const latest = [...rows].sort((a, b) => String(b.watchedAt || '').localeCompare(String(a.watchedAt || '')))[0]
  const pct = watchPercent(latest)
  const ep = Number(latest.episode) || Number(item?.episode) || 0
  const total = Number(item?.number_of_episodes || item?.episodes || item?.episodeCount) || 0
  const seriesDone = !!(latest.completed || latest.seriesCompleted || item?.completed)
  const movie = latest.mediaType === 'movie' || (!ep && latest.mediaType !== 'tv')

  if (seriesDone || (movie && isFinished(latest))) {
    return { state: 'watched', pct: 100, label: 'Watched' }
  }
  if (pct > 2 || ep > 0) {
    const label = ep
      ? (total > ep ? `${ep} of ${total}` : `E${ep}`)
      : `${Math.round(pct)}%`
    const bar = ep && total > ep
      ? Math.round((((ep - 1) + Math.max(pct, 8) / 100) / total) * 100)
      : Math.max(8, pct)
    return { state: 'progress', pct: Math.min(100, bar), label }
  }
  return { state: 'fresh', pct: 0, label: '' }
}
