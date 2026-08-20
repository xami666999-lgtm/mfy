import { useCallback, useEffect, useRef, useState } from 'react'
import { anilist } from '../api/anilist'
import { openAnime } from '../api/animeOpen'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const GENRES = [
  { id: 0, name: 'All' },
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Comedy' },
  { id: 4, name: 'Drama' },
  { id: 5, name: 'Fantasy' },
  { id: 6, name: 'Horror' },
  { id: 7, name: 'Mecha' },
  { id: 8, name: 'Music' },
  { id: 9, name: 'Mystery' },
  { id: 10, name: 'Romance' },
  { id: 11, name: 'Sci-Fi' },
  { id: 12, name: 'Slice of Life' },
  { id: 13, name: 'Sports' },
  { id: 14, name: 'Supernatural' },
  { id: 15, name: 'Thriller' },
]

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [genre, setGenre] = useState('All')
  const [sort, setSort] = useState('POPULARITY_DESC')
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
        const g = genre === 'All' ? null : genre
        const d = await anilist.getByGenre(g, page, 24)
        if (!c) {
          setItems(d?.media || [])
          setHasNext(Boolean(d?.pageInfo?.hasNextPage))
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
      const g = genre === 'All' ? null : genre
      const d = await anilist.getByGenre(g, next, 24)
      const list = d?.media || []
      setItems((prev) => [...prev, ...list])
      setHasNext(Boolean(d?.pageInfo?.hasNextPage))
      setPage(next)
    } catch {}
    setLoadingMore(false)
  }, [loadingMore, hasNext, page, genre, sort])

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
    openAnime(item, (id, type) => {
      setSelectedMedia({ id, type })
      setCurrentPage('detail')
    })
  }

  return (
    <div className="p-6 md:p-8 page-fade-enter">
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <h2 className="text-lg font-semibold text-white tracking-tight">Anime</h2>
        <div className="flex-1" />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="h-7 px-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 focus:outline-none"
        >
          <option value="POPULARITY_DESC">Popularity</option>
          <option value="SCORE_DESC">Rating</option>
          <option value="TRENDING_DESC">Trending</option>
        </select>
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => { setGenre(g.name); setPage(1) }}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium border transition-all',
              genre === g.name ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/[0.06] hover:text-white/50 hover:border-white/10'
            )}
          >
            {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-3">
            {items.map((item: any) => (
              <div key={item.id} className="poster-card aspect-[2/3]" role="button" tabIndex={0} onClick={() => open(item)}>
                {item.coverImage?.large ? (
                  <img src={item.coverImage.large} alt={item.title?.english || item.title?.romaji} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
                ) : (
                  <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/15 text-[10px] text-center px-2">
                    {item.title?.english || item.title?.romaji}
                  </div>
                )}
                {item.averageScore != null && item.averageScore > 0 && (
                  <div className="imdb-badge">
                    <span className="imdb-badge-label">SCORE</span>
                    <span className="imdb-badge-score">{(item.averageScore / 10).toFixed(1)}</span>
                  </div>
                )}
                <div className="poster-overlay">
                  <div className="poster-meta-title">{item.title?.english || item.title?.romaji}</div>
                </div>
              </div>
            ))}
          </div>
          <div ref={sentinelRef} className="h-16 flex items-center justify-center">
            {loadingMore && <div className="skeleton skeleton-text w-24" />}
          </div>
        </>
      ) : (
        <p className="text-sm text-white/30 py-12 text-center">No anime found for this filter.</p>
      )}
    </div>
  )
}