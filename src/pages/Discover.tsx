import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const genres = [
  { id: 0, name: 'All' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
]

const tvGenres = [
  { id: 0, name: 'All' },
  { id: 10759, name: 'Action & Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648, name: 'Mystery' },
  { id: 10768, name: 'War & Politics' },
]

export default function Discover() {
  const { tmdbApiKey, setSelectedMedia, setCurrentPage } = useStore()
  const [tab, setTab] = useState<'movies' | 'tv' | 'anime'>('movies')
  const [genre, setGenre] = useState(0)
  const [sort, setSort] = useState('popularity.desc')
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tmdbApiKey && tab !== 'anime') return
    load()
  }, [tab, genre, sort, page, tmdbApiKey])

  async function load() {
    setLoading(true)
    try {
      if (tab === 'anime') {
        const d = await anilist.getPopular(page, 24)
        setItems(d?.media || [])
      } else {
        const params: Record<string, string> = { sort_by: sort, page: String(page) }
        if (genre > 0) params.with_genres = String(genre)
        const d = tab === 'movies'
          ? await tmdb.discoverMovies(params)
          : await tmdb.discoverTV(params)
        setItems(d?.results || [])
      }
    } catch {}
    setLoading(false)
  }

  function goDetail(id: number, type: string) {
    setSelectedMedia({ id, type: type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
  }

  const activeGenres = tab === 'movies' ? genres : tab === 'tv' ? tvGenres : []

  return (
    <div className="p-8 page-fade-enter">
      <div className="flex items-center gap-6 mb-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">Discover</h2>

        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
          {(['movies', 'tv', 'anime'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setGenre(0); setPage(1) }}
              className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all', tab === t ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white/60')}
            >
              {t === 'movies' ? 'Movies' : t === 'tv' ? 'TV Shows' : 'Anime'}
            </button>
          ))}
        </div>

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

      {activeGenres.length > 0 && (
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {activeGenres.map((g: any) => (
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
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl w-full" style={{ height: 'auto' }} />
          ))}
        </div>
      ) : tab === 'anime' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="poster-card aspect-[2/3]" onClick={() => goDetail(item.id, 'tv')}>
              {item.coverImage?.large ? (
                <img src={item.coverImage.large} alt={item.title?.romaji} loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/[0.04]" />
              )}
              <div className="overlay">
                <p className="text-[11px] font-medium text-white line-clamp-2">{item.title?.english || item.title?.romaji}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="poster-card aspect-[2/3]" onClick={() => goDetail(item.id, tab)}>
              {item.poster_path ? (
                <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
              ) : (
                <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/15 text-[10px] text-center px-2">
                  {item.title || item.name}
                </div>
              )}
              {item.vote_average > 0 && (
                <div className="absolute top-1.5 right-1.5">
                  <span className={cn('badge', item.vote_average >= 7 ? 'bg-green-500/80 text-white' : item.vote_average >= 5 ? 'bg-yellow-500/80 text-black' : 'bg-red-500/80 text-white')}>
                    {item.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="overlay">
                <p className="text-[11px] font-medium text-white line-clamp-2">{item.title || item.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-8">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-8 px-4 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/60 disabled:opacity-30">
          Prev
        </button>
        <span className="h-8 px-3 text-xs text-white/30 flex items-center">{page}</span>
        <button onClick={() => setPage(page + 1)} className="h-8 px-4 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 hover:text-white/60">
          Next
        </button>
      </div>
    </div>
  )
}
