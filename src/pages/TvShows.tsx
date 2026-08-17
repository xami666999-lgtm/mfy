import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage, tmdbApiKey } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [onAir, setOnAir] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tmdbApiKey) {
      setLoading(false)
      return
    }
    let c = false
    ;(async () => {
      try {
        const [p, t, o] = await Promise.all([
          tmdb.getPopular('tv'),
          tmdb.getTopRated('tv'),
          tmdb.getOnTheAir(),
        ])
        if (!c) {
          setPopular(p?.results || [])
          setTop(t?.results || [])
          setOnAir(o?.results || [])
        }
      } catch {
        if (!c) {
          setPopular([])
          setTop([])
          setOnAir([])
        }
      }
      if (!c) setLoading(false)
    })()
    return () => {
      c = true
    }
  }, [tmdbApiKey])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv' })
    setCurrentPage('detail')
  }

  if (!tmdbApiKey) {
    return <p className="p-8 text-sm text-white/30">Add a TMDB key in Settings to browse TV shows.</p>
  }

  return (
    <div className="p-6 md:p-8 page-fade-enter space-y-8">
      <h2 className="text-lg font-semibold text-white tracking-tight">TV Shows</h2>
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <Grid title="Popular" items={popular} onOpen={open} />
          <Grid title="Top rated" items={top} onOpen={open} />
          <Grid title="On the air" items={onAir} onOpen={open} />
        </>
      )}
    </div>
  )
}

function Grid({ title, items, onOpen }: { title: string; items: any[]; onOpen: (i: any) => void }) {
  if (!items.length) return null
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/30 mb-3">{title}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {items.map((item) => (
          <div key={item.id} className="poster-card w-full" role="button" tabIndex={0} onClick={() => onOpen(item)}>
            {item.poster_path ? (
              <img src={`${POSTER_URL}${item.poster_path}`} alt={item.name} loading="lazy" />
            ) : (
              <div className="poster-fallback">{item.name}</div>
            )}
            {item.vote_average > 0 && (
              <div className="imdb-badge">
                <span className="imdb-badge-label">IMDb</span>
                <span className="imdb-badge-score">{Number(item.vote_average).toFixed(1)}</span>
              </div>
            )}
            <div className="poster-overlay">
              <div className="poster-meta-title">{item.name}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
