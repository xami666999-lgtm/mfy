import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const GENRES = [
  { id: 0, name: 'All' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

export default function Movies() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [genre, setGenre] = useState(0)
  const [sort, setSort] = useState('popularity.desc')
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    ;(async () => {
      setLoading(true)
      try {
        const params: Record<string, string> = { sort_by: sort, page: String(page) }
        if (genre > 0) params.with_genres = String(genre)
        const d = await tmdb.discoverMovies(params)
        if (!c) setItems(d?.results || [])
      } catch {
        if (!c) setItems([])
      }
      if (!c) setLoading(false)
    })()
    return () => {
      c = true
    }
  }, [genre, sort, page])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'movie' })
    setCurrentPage('detail')
  }

  return (
    <div className="p-6 md:p-8 page-fade-enter">
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <h2 className="text-lg font-semibold text-white tracking-tight">Movies</h2>
        <div className="flex-1" />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="h-7 px-2 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 focus:outline-none"
        >
          <option value="popularity.desc">Popularity</option>
          <option value="vote_average.desc">Rating</option>
          <option value="release_date.desc">Newest</option>
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
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 2xl:grid-cols-7 gap-3">
          {items.map((item) => (
            <div key={item.id} className="poster-card aspect-[2/3]" role="button" tabIndex={0} onClick={() => open(item)}>
              {item.poster_path ? (
                <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title} loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/15 text-[10px] text-center px-2">{item.title}</div>
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
      ) : (
        <p className="text-sm text-white/30 py-12 text-center">No movies found for this filter.</p>
      )}

      <div className="flex justify-center gap-3 mt-8">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-8 px-4 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 disabled:opacity-30">
          Prev
        </button>
        <span className="h-8 px-3 text-xs text-white/30 flex items-center">Page {page}</span>
        <button onClick={() => setPage(page + 1)} className="h-8 px-4 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/60">
          Next
        </button>
      </div>
    </div>
  )
}