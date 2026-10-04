export function posterYear(item: any) {
  return String(item.release_date || item.first_air_date || item.startDate?.year || '').slice(0, 4)
}

export function scoreOf(item: any): number {
  const v = Number(item.vote_average)
  if (Number.isFinite(v) && v > 0) return v > 10 ? v / 10 : v
  const s = Number(item.score)
  if (Number.isFinite(s) && s > 0) return s > 10 ? s / 10 : s
  const a = Number(item.averageScore ?? item.meanScore)
  if (Number.isFinite(a) && a > 0) return a > 10 ? a / 10 : a
  return 0
}

export function PosterMarks({ item }: { item: any; rank?: number }) {
  const pct = item.progressPct ?? (item.progress && item.duration ? Math.round((item.progress / Math.max(item.duration, 1)) * 100) : 0)
  const score = scoreOf(item)
  return (
    <>
      {score > 0 && <span className="mfy-score">★ {score.toFixed(1)}</span>}
      {(item.completed || pct >= 90) && (
        <div className="absolute top-1.5 right-1.5 z-20 h-6 w-6 rounded-full bg-[#e50914] text-white grid place-items-center text-[11px] font-black shadow">✓</div>
      )}
      {pct > 0 && pct < 90 && !item.completed && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div className="h-full bg-[#e50914]" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </>
  )
}
