import { useCallback, useEffect, useRef, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const GENRES = [
  { id: 0, name: 'All' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
]

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [genre, setGenre] = useState(0)
  const [sort, setSort] = useState('popularity.desc')
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      try {
        const params: Record<string, string> = { sort_by: sort, page: String(page) }
        if (genre > 0) params.with_genres = String(genre)
        const d = await tmdb.discoverTV(params)
        if (!c) {
          setItems(d?.results || [])
          setHasNext(Boolean(d?.total_pages && d.total_pages > page))
        }
      } catch {
        if (!c) setItems([])
      }
      if (!c) setLoading(false)
    })()
    return () => {
      c = true
    }
  }, [genre, sort, page === 1])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return
    setLoadingMore(true)
    const next = page + 1
    try {
      const params: Record<string, string> = { sort_by: sort, page: String(next) }
      if (genre > 0) params.with_genres = String(genre)
      const d = await tmdb.discoverTV(params)
      const list = d?.results || []
      setItems((prev) => [...prev, ...list])
      setHasNext(Boolean(d?.total_pages && d.total_pages > next))
      setPage(next)
    } catch {}
    setLoadingMore(false)
  }, [loadingMore, hasNext, page, sort, genre])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '600px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore, loading])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv' })
    setCurrentPage('detail')
  }

  function posterFallback(e: any) {
    const el = e.currentTarget
    el.onerror = null
    el.style.display = 'none'
    if (el.parentElement) el.parentElement.classList.add('has-fallback')
  }

  return (
    <div className="page-fade-enter">
      {items[0]?.backdrop_path && (
        <section className="hero mx-5 mt-4" style={{ height: 280 }}>
          <div className="hero-backdrop" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${items[0].backdrop_path})` }} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-kicker">SERIES</div>
              <h1>{items[0].name}</h1>
              <div className="hero-actions">
                <button className="hero-play" type="button" onClick={() => open(items[0])}>Watch now</button>
              </div>
            </div>
          </div>
        </section>
      )}
      <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <h2 className="text-lg font-semibold text-white tracking-tight">TV Shows</h2>
        <div className="flex-1" />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="h-7 px-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 focus:outline-none"
        >
          <option value="popularity.desc">Popularity</option>
          <option value="vote_average.desc">Rating</option>
          <option value="first_air_date.desc">Newest</option>
        </select>
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => { setGenre(g.id); setPage(1) }}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
              genre === g.id ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/10'
            )}
          >
            {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-3">
          {Array.from({ length: 21 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-3">
            {items.map((item) => (
              <div key={item.id} className="poster-card aspect-[2/3]" role="button" tabIndex={0} onClick={() => open(item)}>
                {item.poster_path ? (
                  <img src={`${POSTER_URL}${item.poster_path}`} alt={item.name} loading="lazy" onError={posterFallback} />
                ) : (
                  <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/15 text-[10px] text-center px-2">{item.name}</div>
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
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loadingMore && <div className="skeleton skeleton-text w-24" />}
          </div>
        </>
      ) : (
        <p className="text-sm text-white/30 py-12 text-center">No TV shows found for this filter.</p>
      )}
      </div>
    </div>
  )
}