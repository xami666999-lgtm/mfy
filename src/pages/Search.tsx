import { useEffect, useState, useRef } from 'react'
import { Search as SearchIcon, X, Filter } from 'lucide-react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function Search() {
  const { searchQuery, setSearchQuery, setCurrentPage, setSelectedMedia } = useStore()
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [year, setYear] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        let d
        if (typeFilter === 'movie') d = await tmdb.searchMovies(searchQuery)
        else if (typeFilter === 'tv') d = await tmdb.searchTV(searchQuery)
        else d = await tmdb.searchMulti(searchQuery)

        let list = (d?.results || []).filter((r: any) => {
          if (typeFilter === 'all') return r.media_type === 'movie' || r.media_type === 'tv' || r.title || r.name
          return true
        })
        if (year.trim()) {
          list = list.filter((r: any) => {
            const y = (r.release_date || r.first_air_date || '').slice(0, 4)
            return y === year.trim()
          })
        }
        setResults(list.slice(0, 40))
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 320)
    return () => clearTimeout(t)
  }, [searchQuery, typeFilter, year])

  function goDetail(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type })
    setCurrentPage('detail')
  }

  return (
    <div className="flex flex-col items-center pt-12 px-8 page-fade-enter">
      <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Search</h2>

      <div className="relative w-full max-w-xl mb-4">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Movies, shows, people…"
          className="w-full h-12 pl-12 pr-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FF1493]/40"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
        <Filter className="w-3.5 h-3.5 text-white/25" />
        {(['all', 'movie', 'tv'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={cn(
              'h-7 px-3 rounded-full text-[11px] border transition-all',
              typeFilter === t
                ? 'bg-[#FF1493]/15 border-[#FF1493]/35 text-[#FF1493]'
                : 'border-white/[0.06] text-white/35 hover:text-white/55'
            )}
          >
            {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
          </button>
        ))}
        <input
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="Year"
          className="h-7 w-16 px-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 text-center focus:outline-none focus:border-[#FF1493]/30"
        />
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full max-w-5xl">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full max-w-5xl pb-12">
          {results.map((item) => (
            <div
              key={`${item.media_type || 'm'}-${item.id}`}
              className="poster-card w-full"
              role="button"
              tabIndex={0}
              onClick={() => goDetail(item)}
              onKeyDown={(e) => e.key === 'Enter' && goDetail(item)}
            >
              {item.poster_path ? (
                <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
              ) : (
                <div className="poster-fallback">{item.title || item.name}</div>
              )}
              <div className="poster-overlay">
                <div className="poster-meta-title">{item.title || item.name}</div>
                <div className="poster-meta-sub">
                  {(item.release_date || item.first_air_date || '').slice(0, 4)}
                  {item.vote_average > 0 ? ` · ★ ${item.vote_average.toFixed(1)}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && searchQuery && results.length === 0 && (
        <p className="text-sm text-white/25">No results for “{searchQuery}”</p>
      )}
    </div>
  )
}
