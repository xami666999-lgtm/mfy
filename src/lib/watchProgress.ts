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

/** Poster footer: caught-up shows a check, a started show with episodes left shows a play mark. */
export function watchFace(hist: any[] | undefined, mediaId: any, item?: any): WatchFace {
  const rows = (hist || []).filter((h) => String(h.mediaId) === String(mediaId))
  if (!rows.length) return { state: 'fresh', pct: 0, label: '' }
  const latest = [...rows].sort((a, b) => String(b.watchedAt || '').localeCompare(String(a.watchedAt || '')))[0]
  const pct = watchPercent(latest)
  const ep = Number(latest.episode) || Number(item?.episode) || 0
  const total = Number(item?.number_of_episodes || item?.episodes || item?.episodeCount) || 0
  const movie = latest.mediaType === 'movie' || item?.media_type === 'movie' || item?.mediaType === 'movie' || (!ep && latest.mediaType !== 'tv' && item?.media_type !== 'tv')
  const episodeDone = !!(latest.completed || isFinished(latest))
  const caughtUp = !!(latest.seriesCompleted || item?.seriesCompleted)
    || (movie && episodeDone)
    || (!movie && total > 0 && ep >= total && episodeDone)

  if (caughtUp) return { state: 'watched', pct: 100, label: 'Watched' }

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
