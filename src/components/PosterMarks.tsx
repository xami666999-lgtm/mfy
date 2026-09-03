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

function isPrint(item: any) {
  const t = String(item.media_type || item.type || item.format || '')
  return /manga|manhwa|manhua|novel|book|comic/i.test(t)
}

export function PosterMarks({ item }: { item: any }) {
  const pct = item.progressPct ?? (item.progress && item.duration ? Math.round((item.progress / Math.max(item.duration, 1)) * 100) : 0)
  const score = scoreOf(item)
  const quality = String(item.quality || item.resolution || '').toUpperCase()
  const show4k = quality.includes('4K') || quality.includes('2160')
  const showHd = !isPrint(item) && (quality.includes('HD') || quality.includes('1080') || quality.includes('720'))
  return (
    <>
      <div className="absolute top-1 left-1 flex gap-1 z-10">
        {show4k && <span className="text-[8px] font-black bg-black/70 text-[#f5c518] px-1 rounded">4K</span>}
        {showHd && !show4k && <span className="text-[8px] font-black bg-black/70 text-white px-1 rounded">HD</span>}
        {score > 0 && <span className="text-[8px] font-black bg-[#f5c518] text-black px-1 rounded">{score.toFixed(1)}</span>}
      </div>
      {pct > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div className="h-full bg-[#FF1493]" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </>
  )
}
