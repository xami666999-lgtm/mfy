import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Plus, Info, ChevronRight, ArrowRight, Check, Tv } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { openAnime } from '../api/animeOpen'
import { streamingServices } from '../api/streaming'
import { franchises } from '../api/franchises'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { SkeletonPoster, SkeletonHero } from '../components/Skeleton'

const STAR_COLOR = '#FFD24C'

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const v = Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : 0
  const filled = Math.round(v / 2)
  return (
    <span className="stars" title={`${v.toFixed(1)}/10`} style={{ color: STAR_COLOR, fontSize: size + 2, lineHeight: 1 }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  )
}

const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 10770, name: 'TV Movie' }, { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
]
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10763, name: 'News' }, { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' }, { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' },
  { id: 37, name: 'Western' },
]
const ANIME_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']

export default function Board() {
  const { tmdbApiKey, setCurrentPage, setSelectedMedia, addToWatchlist, isInWatchlist, removeFromWatchlist, watchHistory, favorites } = useStore()
  const [trending, setTrending] = useState<any[]>([])
  const [movies, setMovies] = useState<any[]>([])
  const [shows, setShows] = useState<any[]>([])
  const [anime, setAnime] = useState<any[]>([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [nowPlaying, setNowPlaying] = useState<any[]>([])
  const [onTheAir, setOnTheAir] = useState<any[]>([])
  const [topRatedTv, setTopRatedTv] = useState<any[]>([])
  const [collection, setCollection] = useState<any[]>([])
  const [genreMovie, setGenreMovie] = useState<Record<number, any[]>>({})
  const [genreTv, setGenreTv] = useState<Record<number, any[]>>({})
  const [homeTab, setHomeTab] = useState<'movie' | 'tv'>('movie')
  const [recommended, setRecommended] = useState<any[]>([])

  useEffect(() => {
    load()
  }, [tmdbApiKey])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const seeds = [
        ...favorites.map((f) => ({ id: f.mediaId, type: f.mediaType })),
        ...watchHistory.map((h) => ({ id: h.mediaId, type: h.mediaType })),
      ]
      if (seeds.length === 0) {
        if (!cancelled) setRecommended([])
        return
      }
      try {
        const unique = Array.from(new Map(seeds.map((s) => [`${s.type}-${s.id}`, s])).values()).slice(0, 3)
        const lists = await Promise.all(
          unique.map((s) =>
            s.type === 'movie' ? tmdb.getMovieDetail(s.id) : tmdb.getTVDetail(s.id)
          )
        )
        const picked: any[] = []
        for (const d of lists) {
          if (!d) continue
          const recs = d?.recommendations?.results || []
          if (recs.length) picked.push(...recs.slice(0, 8))
        }
        const seen = new Set(seeds.map((s) => `${s.type}-${s.id}`))
        const out = picked.filter((r) => {
          const t = (r.media_type === 'tv' || r.first_air_date) ? 'tv' as const : 'movie' as const
          return !seen.has(`${t}-${r.id}`)
        })
        if (!cancelled) setRecommended(Array.from(new Map(out.map((r) => [`${r.media_type}-${r.id}`, r])).values()).slice(0, 16))
      } catch {
        if (!cancelled) setRecommended([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [favorites, watchHistory])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [t, m, s, u] = await Promise.all([
        tmdb.getTrending('all', 'week'),
        tmdb.getPopular('movie'),
        tmdb.getPopular('tv'),
        tmdb.getUpcoming(),
      ])
      setTrending(t?.results?.slice(0, 12) || [])
      setMovies(m?.results || [])
      setShows(s?.results || [])
      setUpcoming(u?.results?.slice(0, 16) || [])
      const top = await tmdb.getTopRated('movie')
      setCollection(top?.results?.slice(0, 12) || [])
      const [np, ota, trt] = await Promise.all([
        tmdb.getNowPlaying(),
        tmdb.getOnTheAir(),
        tmdb.getTopRated('tv'),
      ])
      setNowPlaying(np?.results?.slice(0, 16) || [])
      setOnTheAir(ota?.results?.slice(0, 16) || [])
      setTopRatedTv(trt?.results?.slice(0, 12) || [])
      try {
        const a = await anilist.getTrending(1, 20)
        setAnime(a?.media || [])
      } catch {
        setAnime([])
      }
    } catch (e) {
      setError('Could not load catalog. Check your TMDB API key in Settings.')
    }
    setLoading(false)
    loadGenres().catch(() => {})
  }

  async function loadGenres() {
    const gm: Record<number, any[]> = {}
    const gt: Record<number, any[]> = {}
    await Promise.all([
      ...MOVIE_GENRES.map(async (g) => {
        try {
          const d = await tmdb.discoverMovies({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' })
          gm[g.id] = d?.results || []
        } catch {
          gm[g.id] = []
        }
      }),
      ...TV_GENRES.map(async (g) => {
        try {
          const d = await tmdb.discoverTV({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' })
          gt[g.id] = d?.results || []
        } catch {
          gt[g.id] = []
        }
      }),
    ])
    setGenreMovie(gm)
    setGenreTv(gt)
  }

  useEffect(() => {
    if (trending.length < 2) return
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 8)), 7000)
    return () => clearInterval(id)
  }, [trending.length])

  const hero = trending[heroIdx]

  function goDetail(id: number, type: string) {
    setSelectedMedia({ id, type: type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
  }

  function toggleList(item: any) {
    const type = (item.media_type === 'tv' || item.first_air_date) ? 'tv' as const : 'movie' as const
    const title = item.title || item.name || ''
    if (isInWatchlist(item.id, type)) {
      removeFromWatchlist(item.id, type)
    } else {
      addToWatchlist({
        mediaId: item.id,
        mediaType: type,
        title,
        posterPath: item.poster_path || null,
        addedAt: new Date().toISOString(),
      })
    }
  }

  const movieRow = useMemo(() => trending.filter((x) => x.media_type !== 'tv'), [trending])

  if (loading) {
    return (
      <div className="board">
        <SkeletonHero />
        <div className="board-content">
          <div className="provider-section">
            <div className="section-label">Browse by Provider</div>
            <div className="provider-row">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: 72, height: 72, borderRadius: 16 }} />
              ))}
            </div>
          </div>
          <div className="media-row">
            <div className="media-row-header"><div className="skeleton skeleton-text w-40" /></div>
            <div className="scroll-row"><SkeletonPoster count={8} /></div>
          </div>
          <div className="media-row">
            <div className="media-row-header"><div className="skeleton skeleton-text w-40" /></div>
            <div className="scroll-row"><SkeletonPoster count={8} /></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="board bg-black/30 min-h-screen">
      <main className="p-4 flex-1">
        {hero ? (
          <section className="hero">
            <div className="hero-backdrop fade-in" style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined }} />
            <div className="hero-wall" aria-hidden>
              {trending.filter((t: any) => t.poster_path).slice(0, 18).map((t: any) => (
                <img key={t.id} src={`${POSTER_URL}${t.poster_path}`} alt="" referrerPolicy="no-referrer" />
              ))}
            </div>
            <div className="hero-overlay" />
            <div className="hero-content">
              <div className="hero-copy">
                <div className="hero-kicker">{hero.media_type === 'movie' ? 'MOVIE' : 'SERIES'}</div>
                <h1 className="hero-title text-3xl font-bold">{hero.title || hero.name}</h1>
                <div className="hero-meta">
                  <span className="hero-year">{((hero.release_date || hero.first_air_date || '').slice(0, 4) || '2026')}</span>
                  {hero.genres?.length ? (
                    <span>{hero.genres.slice(0, 3).map((g: { name: string }) => g.name).join(' · ')}</span>
                  ) : null}
                  {hero.vote_average > 0 && <span className="hero-rating">★ {hero.vote_average.toFixed(1)}</span>}
                </div>
                <p className="hero-overview text-white/70">{hero.overview || 'Discover something new to watch tonight.'}</p>
                <div className="hero-actions pt-4">
                  <button className="btn btn-primary hero-play" onClick={() => goDetail(hero.id, hero.media_type || 'movie')}>
                    <Play fill="currentColor" size={16} /> Play
                  </button>
                  <button className="btn btn-secondary hero-secondary" onClick={() => toggleList(hero)}>
                    {(hero && (hero.media_type === 'movie' ? isInWatchlist(hero.id, 'movie') : isInWatchlist(hero.id, 'tv'))) ? (
                      <>
                        <Check size={16} /> In My List
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Add to List
                      </>
                    )}
                  </button>
                  <button className="btn btn-outline hero-info" onClick={() => goDetail(hero.id, hero.media_type || 'movie')} aria-label="More information">
                    <Info size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="section section-padded">
            <div className="text-center py-12">
              <div className="mx-auto mb-4 w-16 h-16 grid place-items-center rounded-2xl bg-white/5 border border-white/10 text-white/30">
                <Tv className="w-7 h-7" />
              </div>
              <p className="text-base text-white/40">Load the catalog to see what's trending</p>
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TOP 10 */}
          {(movies.length > 0 || shows.length > 0) && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Top 10 on MFY</h2>
                <div className="section-tabs">
                  <button type="button" className={cn('section-tab', homeTab === 'movie' && 'active')} onClick={() => setHomeTab('movie')}>Movies</button>
                  <button type="button" className={cn('section-tab', homeTab === 'tv' && 'active')} onClick={() => setHomeTab('tv')}>Series</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {(homeTab === 'movie' ? movies : shows).slice(0, 12).map((item, idx) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => goDetail(item.id, homeTab)}
                    onKeyDown={(e) => e.key === 'Enter' && goDetail(item.id, homeTab)}
                    className="poster-card hover-card rounded-lg overflow-hidden transition-transform hover:shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    <img
                      src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : '/placeholder-poster.jpg'}
                      alt={item.title || item.name}
                      loading="lazy"
                      onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                      className="poster-img w-full h-48 object-cover"
                    />
                    <div className="poster-info">
                      <p className="poster-title truncate text-sm">{item.title || item.name}</p>
                      {item.vote_average > 0 && (
                        <span className="poster-rating">★ {Number(item.vote_average).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Trending Today */}
          {movieRow.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Trending Today</h2>
                <button className="btn btn-link section-link" type="button" onClick={() => setCurrentPage(homeTab === 'movie' ? 'movies' : 'tv')}>
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(homeTab === 'movie' ? movieRow : shows).slice(0, 12).map((item) => (
                  <div
                    key={`${homeTab}-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => goDetail(item.id, homeTab)}
                    onKeyDown={(e) => e.key === 'Enter' && goDetail(item.id, homeTab)}
                    className="poster-card hover-card rounded-lg overflow-hidden transition-transform hover:shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    <img
                      src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : '/placeholder-poster.jpg'}
                      alt={item.title || item.name}
                      loading="lazy"
                      onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                      className="poster-img w-full h-48 object-cover"
                    />
                    <div className="poster-info">
                      <p className="poster-title truncate text-sm">{item.title || item.name}</p>
                      {item.vote_average > 0 && (
                        <span className="poster-rating">★ {Number(item.vote_average).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Continue Watching */}
          {watchHistory.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Continue Watching</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {watchHistory.slice(0, 12).map((h) => (
                  <div
                    key={h.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelectedMedia({ id: h.mediaId, type: h.mediaType }); setCurrentPage('detail') }}
                    className="poster-card hover-card rounded-lg overflow-hidden transition-transform hover:shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    {h.posterPath ? (
                      <img
                        src={`${POSTER_URL}${h.posterPath}`} alt={h.title} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                        className="poster-img w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="poster-img rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                        <Tv className="w-5 h-5" />
                      </div>
                    )}
                    <div className="poster-info">
                      <p className="poster-title truncate text-sm">{h.title}</p>
                      <p className="poster-sub text-xs text-white/40">{Math.round((h.progress / h.duration) * 100)}% complete</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended For You */}
          {recommended.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recommended For You</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommended.slice(0, 12).map((item) => (
                  <div
                    key={`${item.media_type}-${item.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => goDetail(item.id, item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie')}
                    className="poster-card hover-card rounded-lg overflow-hidden transition-transform hover:shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    <img
                      src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : '/placeholder-poster.jpg'}
                      alt={item.title || item.name}
                      loading="lazy"
                      onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                      className="poster-img w-full h-48 object-cover"
                    />
                    <div className="poster-info">
                      <p className="poster-title truncate text-sm">{item.title || item.name}</p>
                      {item.vote_average > 0 && (
                        <span className="poster-rating">★ {Number(item.vote_average).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {nowPlaying.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Now Playing</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {nowPlaying.slice(0, 8).map((item) => (
                  <button key={item.id} type="button" className="text-left" onClick={() => goDetail(item.id, 'movie')}>
                    <img src={item.poster_path ? `${POSTER_URL}${item.poster_path}` : ''} alt="" referrerPolicy="no-referrer" className="w-full aspect-[2/3] object-cover rounded-lg" />
                    <p className="text-sm text-white truncate mt-1">{item.title}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {anime.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Upcoming Anime</h2>
                <button className="btn btn-link section-link" type="button" onClick={() => setCurrentPage('anime')}>View All</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {anime.slice(0, 12).map((item: any) => (
                  <button key={item.id} type="button" className="text-left" onClick={() => setCurrentPage('anime')}>
                    <img src={item.coverImage?.large || item.coverImage?.medium} alt="" referrerPolicy="no-referrer" className="w-full aspect-[2/3] object-cover rounded-lg" />
                    <p className="text-sm text-white truncate mt-1">{item.title?.english || item.title?.romaji}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Category / genre shelves */}
          <section className="section pt-6">
            <div className="section-header">
              <h2 className="section-title">Movies by Category</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {MOVIE_GENRES.map((g) => (
                <GenreRow key={`m-${g.id}`} genre={g} items={genreMovie[g.id] || []} onItem={goDetail} />
              ))}
            </div>
          </section>
          <section className="section pt-6">
            <div className="section-header">
              <h2 className="section-title">TV Shows by Category</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {TV_GENRES.map((g) => (
                <GenreRow key={`t-${g.id}`} genre={g} items={genreTv[g.id] || []} onItem={goDetail} />
              ))}
            </div>
          </section>
          <section className="section pt-6">
            <div className="section-header">
              <h2 className="section-title">Anime by Category</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ANIME_GENRES.map((g) => (
                <button key={g} type="button" className="h-8 px-3 rounded-full bg-white/[0.05] text-[11px] text-white/60 hover:bg-[#FF1493]/20 hover:text-white" onClick={() => setCurrentPage('anime')}>{g}</button>
              ))}
            </div>
          </section>
        </div>

        {anime.length > 0 && (
          <section className="section section-padded">
            <div className="section-header">
              <h2 className="section-title">Anime</h2>
              <button className="btn btn-link text-white/40 text-sm float-right" type="button" onClick={() => setCurrentPage('anime')}>View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {anime.slice(0, 16).map((item) => (
                <div
                  key={item.id}
                  className="poster-card hover-card rounded-lg overflow-hidden transition-transform hover:shadow-lg hover:brightness-110"
                >
                  <img
                    src={item.coverImage?.large ? item.coverImage.large : '/placeholder-poster.jpg'}
                    alt={item.title?.romaji || ''}
                    loading="lazy"
                    onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                    className="poster-img w-full h-40 object-cover"
                  />
                  <div className="poster-info">
                    <p className="poster-title truncate text-sm">{item.title?.english || item.title?.romaji}</p>
                    <p className="poster-sub text-xs text-white/40">{item.title?.japanese || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function GenreRow({ genre, items, onItem }: { genre: { id: number; name: string }; items: any[]; onItem: (id: number, type: string) => void }) {
  return (
    <div className="genre-slice">
      <div className="genre-slice-label text-xs font-medium text-white/60">{genre.name} · {items.length}</div>
      <div
        className="scroll-row"
        onClick={() => items[0] && onItem(items[0].id, items[0].media_type === 'tv' || items[0].first_air_date ? 'tv' : 'movie')}
        role="button"
      >
        {items.slice(0, 6).map((item: any) => {
          const type = (item.media_type === 'tv' || item.first_air_date) ? 'tv' as const : 'movie' as const
          return (
            <div
              key={`${type}-${item.id}`}
              className="poster-card"
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onItem(item.id, type) }}
              onKeyDown={(e) => e.key === 'Enter' && onItem(item.id, type)}
            >
              {item.poster_path ? <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} /> : <div className="poster-fallback">{item.title || item.name}</div>}
              <div className="poster-play"><Play size={18} fill="#fff" /></div>
              <div className="poster-overlay">
                <div className="poster-meta-title">{item.title || item.name}</div>
                <div className="poster-meta-sub"><Stars value={item.vote_average} size={12} /></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AnimeSection({ items }: { items: any[] }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  function open(item: any) {
    openAnime(item, (id, type) => {
      setSelectedMedia({ id, type })
      setCurrentPage('detail')
    })
  }
  return (
    <section className="section section-padded">
      <div className="section-header">
        <h2 className="section-title">Anime</h2>
        <button className="btn btn-link text-white/40 text-sm float-right" type="button" onClick={() => setCurrentPage('anime')}>View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button>
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={ref} className="scroll-row">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="poster-card"
              role="button"
              tabIndex={0}
              onClick={() => open(item)}
              onKeyDown={(e) => e.key === 'Enter' && open(item)}
            >
              {item.coverImage?.large ? (
                <img src={item.coverImage.large} alt={item.title?.romaji || ''} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
              ) : (
                <div className="poster-fallback">{item.title?.romaji}</div>
              )}
              <div className="poster-play"><Play size={18} fill="#fff" /></div>
              <div className="poster-overlay">
                <div className="poster-meta-title">{item.title?.english || item.title?.romaji}</div>
                <div className="poster-meta-sub"><Stars value={item.averageScore ? item.averageScore / 10 : 0} size={12} /></div>
              </div>
            </div>
          ))}
        </div>
        <button className="row-next" onClick={() => ref.current?.scrollBy({ left: 560, behavior: 'smooth' })} aria-label="More anime" type="button"><ChevronRight /></button>
      </div>
    </section>
  )
}

function Poster({
  item,
  type,
  inList,
  onClick,
  onToggleList,
}: {
  item: any
  type: 'movie' | 'tv'
  inList: boolean
  onClick: () => void
  onToggleList: () => void
}) {
  const title = item.title || item.name
  return (
    <div
      className="poster-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {item.poster_path ? (
        <img src={`${POSTER_URL}${item.poster_path}`} alt={title || ''} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
      ) : (
        <div className="poster-fallback">{title}</div>
      )}
      {item.vote_average > 0 && (
        <div className="imdb-badge" title="Rating">
          <Stars value={item.vote_average} size={12} />
        </div>
      )}
      <div className="poster-play"><Play size={18} fill="#fff" /></div>
      <div className="poster-overlay">
        <div className="poster-meta-title">{title}</div>
      </div>
      <button
        type="button"
        className="poster-list-btn"
        aria-label={inList ? 'Remove from list' : 'Add to list'}
        onClick={(e) => {
          e.stopPropagation()
          onToggleList()
        }}
      >
        {inList ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </div>
  )
}