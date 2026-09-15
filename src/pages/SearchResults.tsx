import { useEffect, useState } from 'react'
import { Search as SearchIcon, Filter } from 'lucide-react'
import { tmdb, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function SearchResults() {
  const { tmdbApiKey, searchQuery, setSelectedMedia, setCurrentPage, setSelectedPersonId } = useStore()
  const [movies, setMovies] = useState<any[]>([])
  const [tv, setTv] = useState<any[]>([])
  const [anime, setAnime] = useState<any[]>([])
  const [people, setPeople] = useState<any[]>([])
  const [tab, setTab] = useState<'all' | 'movies' | 'tv' | 'anime' | 'people'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!searchQuery) return
    load()
  }, [searchQuery])

  async function load() {
    setLoading(true)
    const [m, t, a, pe] = await Promise.allSettled([
      tmdb.searchMovies(searchQuery),
      tmdb.searchTV(searchQuery),
      anilist.search(searchQuery, 1, 20),
      tmdb.searchPerson(searchQuery),
    ])
    setMovies(m.status === 'fulfilled' ? m.value?.results || [] : [])
    setTv(t.status === 'fulfilled' ? t.value?.results || [] : [])
    setAnime(a.status === 'fulfilled' ? a.value?.media || [] : [])
    setPeople(pe.status === 'fulfilled' ? pe.value?.results || [] : [])
    setLoading(false)
  }

  function goDetail(id: number, type: string) {
    setSelectedMedia({ id, type: type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
  }

  const filtered = tab === 'all'
    ? [...movies.map((m) => ({ ...m, _type: 'movie' })), ...tv.map((t) => ({ ...t, _type: 'tv' }))]
    : tab === 'movies' ? movies.map((m) => ({ ...m, _type: 'movie' }))
    : tab === 'tv' ? tv.map((t) => ({ ...t, _type: 'tv' }))
    : []

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold text-white">Results for "{searchQuery}"</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
          {(['all', 'movies', 'tv', 'anime', 'people'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1 rounded-md text-[11px] font-medium transition-all', tab === t ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50')}>
              {t === 'all' ? 'All' : t === 'tv' ? 'TV' : t === 'anime' ? 'Anime' : t === 'people' ? 'People' : 'Movies'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-lg bg-white/[0.03] animate-pulse" />)}
        </div>
      ) : (
        <>
          {tab !== 'anime' && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
              {filtered.map((item: any) => (
                <div key={item.id} className="poster-card aspect-[2/3]" onClick={() => goDetail(item.id, item._type)}>
                  {item.poster_path ? (
                    <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-white/[0.04] flex items-center justify-center text-white/15 text-[10px] text-center px-2">{item.title || item.name}</div>
                  )}
                  <div className="overlay">
                    <p className="text-[11px] font-medium text-white line-clamp-2">{item.title || item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(tab === 'all' || tab === 'anime') && anime.length > 0 && (
            <div>
              {tab === 'all' && <h3 className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-3">Anime</h3>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {anime.map((item: any) => (
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
            </div>
          )}

          {(tab === 'all' || tab === 'people') && people.length > 0 && (
            <div className="mb-8">
              {tab === 'all' && <h3 className="text-[13px] font-semibold text-white/40 uppercase tracking-widest mb-3">People</h3>}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {people.slice(0, 18).map((p: any) => (
                  <button key={p.id} className="text-center" onClick={() => { setSelectedPersonId(p.id); setCurrentPage('person') }}>
                    {p.profile_path ? <img src={`${PROFILE_URL}${p.profile_path}`} className="w-20 h-20 rounded-full object-cover mx-auto" alt="" /> : <div className="w-20 h-20 rounded-full bg-white/10 mx-auto" />}
                    <div className="text-xs mt-1 truncate">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && filtered.length === 0 && anime.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/20 text-sm">No results found</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
