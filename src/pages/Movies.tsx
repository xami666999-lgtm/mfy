import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

export default function Movies() {
  const { setSelectedMedia, setCurrentPage, tmdbApiKey } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [now, setNow] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tmdbApiKey) {
      setLoading(false)
      return
    }
    let c = false
    ;(async () => {
      try {
        const [p, t, n] = await Promise.all([
          tmdb.getPopular('movie'),
          tmdb.getTopRated('movie'),
          tmdb.getNowPlaying(),
        ])
        if (!c) {
          setPopular(p?.results || [])
          setTop(t?.results || [])
          setNow(n?.results || [])
        }
      } catch {
        if (!c) {
          setPopular([])
          setTop([])
          setNow([])
        }
      }
      if (!c) setLoading(false)
    })()
    return () => {
      c = true
    }
  }, [tmdbApiKey])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'movie' })
    setCurrentPage('detail')
  }

  if (!tmdbApiKey) {
    return <p className="p-8 text-sm text-white/30">Add a TMDB key in Settings to browse movies.</p>
  }

  return (
    <div className="p-6 md:p-8 page-fade-enter space-y-8">
      <h2 className="text-lg font-semibold text-white tracking-tight">Movies</h2>
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
          <Grid title="In theatres" items={now} onOpen={open} />
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
              <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title} loading="lazy" />
            ) : (
              <div className="poster-fallback">{item.title}</div>
            )}
            {item.vote_average > 0 && (
              <div className="imdb-badge">
                <span className="imdb-badge-label">IMDb</span>
                <span className="imdb-badge-score">{Number(item.vote_average).toFixed(1)}</span>
              </div>
            )}
            <div className="poster-overlay">
              <div className="poster-meta-title">{item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
