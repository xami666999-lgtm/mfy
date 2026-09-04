export function watchPercent(h?: { progress?: number; duration?: number } | null) {
  if (!h) return 0
  const p = Number(h.progress) || 0
  const d = Number(h.duration) || 0
  if (d < 30) return p > 0 ? 3 : 0
  return Math.max(0, Math.min(100, Math.round((p / d) * 100)))
}

export function isFinished(h?: { progress?: number; duration?: number; completed?: boolean } | null) {
  if (!h) return false
  if (h.completed) return true
  return watchPercent(h) >= 90
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
