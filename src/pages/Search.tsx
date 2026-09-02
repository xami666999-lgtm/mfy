import { useEffect, useState, useRef } from 'react'
import { Search as SearchIcon, X, Filter, Clock, TrendingUp } from 'lucide-react'
import { tmdb, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const GENRES = [
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
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]

const HISTORY_KEY = 'mfy-search-history'

export default function Search() {
  const { searchQuery, setSearchQuery, setCurrentPage, setSelectedMedia } = useStore()
  const [results, setResults] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'tv'>('all')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))
    } catch {}
  }, [])

  function recordQuery(q: string) {
    const clean = q.trim()
    if (!clean) return
    try {
      const next = [clean, ...history.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(0, 8)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      setHistory(next)
    } catch {}
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      setPeople([])
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        let d
        if (typeFilter === 'movie') d = await tmdb.searchMovies(searchQuery)
        else if (typeFilter === 'tv') d = await tmdb.searchTV(searchQuery)
        else d = await tmdb.searchMulti(searchQuery)

        const [personRes, staff] = await Promise.all([
          tmdb.searchPerson(searchQuery).catch(() => ({ results: [] })),
          anilist.searchStaff(searchQuery, 1, 8).catch(() => []),
        ])
        setPeople([
          ...(personRes?.results || []).map((p: any) => ({
            id: p.id, source: 'tmdb', name: p.name,
            image: p.profile_path ? `${PROFILE_URL}${p.profile_path}` : '',
            job: p.known_for_department,
          })),
          ...(staff || []).map((s: any) => ({
            id: s.id, source: 'anilist', name: s.name?.full || s.name?.native,
            image: s.image?.large, job: (s.primaryOccupations || []).join(' · ') || 'Anime / manga',
          })),
        ].slice(0, 16))

        let list = (d?.results || []).filter((r: any) => {
          if (r.media_type === 'person') return false
          if (typeFilter === 'all') return r.media_type === 'movie' || r.media_type === 'tv' || r.title || r.name
          return true
        })
        if (year.trim()) {
          list = list.filter((r: any) => {
            const y = (r.release_date || r.first_air_date || '').slice(0, 4)
            return y === year.trim()
          })
        }
        if (genre) {
          list = list.filter((r: any) => (r.genre_ids || []).includes(genre))
        }
        setResults(list.slice(0, 40))
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 320)
    return () => clearTimeout(t)
  }, [searchQuery, typeFilter, year, genre])

  function goDetail(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type })
    setCurrentPage('detail')
  }

  function pickHistory(q: string) {
    setSearchQuery(q)
    inputRef.current?.focus()
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
          onKeyDown={(e) => e.key === 'Enter' && recordQuery(searchQuery)}
          placeholder="Movies, shows, people…"
          className="w-full h-12 pl-12 pr-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#FF1493]/40"
        />
        {searchQuery && (
          <button
            type="button"
            className="absolute right-10 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 transition-all',
            showFilters ? 'text-[#FF1493]' : 'text-white/30 hover:text-white/60'
          )}
          title="Filters"
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-3 page-fade-enter">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-white/30 w-16 flex-shrink-0">Type</span>
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
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-white/30 w-16 flex-shrink-0">Genre</span>
            <select
              value={genre}
              onChange={(e) => setGenre(Number(e.target.value))}
              className="h-7 px-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 focus:outline-none focus:border-[#FF1493]/30"
            >
              <option value={0}>Any</option>
              {GENRES.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Year"
              className="h-7 w-16 px-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 text-center focus:outline-none focus:border-[#FF1493]/30"
            />
          </div>
        </div>
      )}

      {!searchQuery.trim() && history.length > 0 && !showFilters && (
        <div className="w-full max-w-xl mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-white/25" />
            <span className="text-[11px] uppercase tracking-wider text-white/25">Recent searches</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => pickHistory(h)}
                className="h-8 px-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-white/70 hover:border-white/[0.12] transition-all"
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      {!searchQuery.trim() && !showFilters && (
        <div className="w-full max-w-xl mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-white/25" />
            <span className="text-[11px] uppercase tracking-wider text-white/25">Try</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Spider-Man', 'Dune', 'Breaking Bad', 'Stranger Things', 'Inception', 'Attack on Titan'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => pickHistory(q)}
                className="h-8 px-3 rounded-full bg-[#FF1493]/10 border border-[#FF1493]/20 text-xs text-[#FF1493]/70 hover:bg-[#FF1493]/20 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full max-w-5xl">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      )}

      {!loading && people.length > 0 && (
        <div className="w-full max-w-5xl mb-8">
          <h3 className="text-[11px] uppercase tracking-widest text-white/35 mb-3">People</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {people.map((p) => (
              <button
                key={`${p.source}-${p.id}`}
                type="button"
                className="w-[88px] flex-shrink-0 text-left"
                onClick={() => {
                  if (p.source === 'tmdb') {
                    tmdb.getPersonDetail(p.id).then((d: any) => {
                      const work = (d?.combined_credits?.cast || d?.movie_credits?.cast || [])[0]
                      if (work) {
                        setSelectedMedia({ id: work.id, type: work.media_type === 'tv' || work.first_air_date ? 'tv' : 'movie' })
                        setCurrentPage('detail')
                      }
                    }).catch(() => {})
                  } else setCurrentPage('anime')
                }}
              >
                <div className="w-16 h-16 rounded-full overflow-hidden bg-white/[0.06] mx-auto mb-1.5">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-white/30 text-xs">{(p.name || '?')[0]}</div>}
                </div>
                <p className="text-[10px] text-white text-center truncate">{p.name}</p>
                <p className="text-[9px] text-white/35 text-center truncate">{p.job}</p>
              </button>
            ))}
          </div>
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