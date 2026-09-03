export function watchPercent(h?: { progress?: number; duration?: number } | null) {
  if (!h) return 0
  const p = Number(h.progress) || 0
  const d = Number(h.duration) || 0
  if (d < 30) return p > 0 ? 3 : 0
  return Math.max(0, Math.min(100, Math.round((p / d) * 100)))
}

export function isFinished(h?: { progress?: number; duration?: number } | null) {
  return watchPercent(h) >= 90
}
