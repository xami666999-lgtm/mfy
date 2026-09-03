export function posterYear(item: any) {
  return String(item.release_date || item.first_air_date || item.startDate?.year || '').slice(0, 4)
}

export function PosterMarks({ item }: { item: any }) {
  const y = Number(posterYear(item)) || 0
  const pct = item.progressPct ?? (item.progress && item.duration ? Math.round((item.progress / Math.max(item.duration, 1)) * 100) : 0)
  const fourK = y >= 2017
  return (
    <>
      <div className="absolute top-1 left-1 flex gap-1 z-10">
        {fourK && <span className="text-[8px] font-black bg-black/70 text-[#f5c518] px-1 rounded">4K</span>}
        <span className="text-[8px] font-black bg-black/70 text-white px-1 rounded">HD</span>
        {item.vote_average > 0 && <span className="text-[8px] font-black bg-[#f5c518] text-black px-1 rounded">{Number(item.vote_average).toFixed(1)}</span>}
      </div>
      {pct > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div className="h-full bg-[#FF1493]" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </>
  )
}
