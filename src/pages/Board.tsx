import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Plus, Info, ChevronRight, ArrowRight, Check } from 'lucide-react'
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

// A curated, well-known subset of TMDB genres so browsing loads fast & predictably.
const MOVIE_GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 14, name: 'Fantasy' },
  { id: 878, name: 'Sci-Fi' },
]
const TV_GENRES = [
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10759, name: 'Action' },
  { id: 10762, name: 'Kids' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 9648, name: 'Mystery' },
]

export default function Board() {
  const { tmdbApiKey, setCurrentPage, setSelectedMedia, addToWatchlist, isInWatchlist, removeFromWatchlist, watchHistory } = useStore()
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

  useEffect(() => {
    load()
  }, [tmdbApiKey])

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
      // Lightweight "collection-like" row from top rated
      const top = await tmdb.getTopRated('movie')
      setCollection(top?.results?.slice(0, 12) || [])
      // Extra shelves: in-theaters, airing now, top rated series
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
      // Pre-fetch a few genre rows so they render instantly as the user scrolls.
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
    } catch (e) {
      setError('Could not load catalog. Check your TMDB API key in Settings.')
    }
    setLoading(false)
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
    <div className="board page-fade-enter">
      {error && <div className="error-banner mx-5 mt-4">{error}</div>}

      {hero ? (
        <section className="hero">
          <div
            key={heroIdx}
            className="hero-backdrop fade-in"
            style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined }}
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-copy fade-in">
              <div className="hero-kicker">{hero.media_type === 'movie' ? 'MOVIE' : 'SERIES'}</div>
              <h1>{hero.title || hero.name}</h1>
              <div className="hero-meta">
                <span>{(hero.release_date || hero.first_air_date || '').slice(0, 4) || '2026'}</span>
                {(hero.genre_ids?.length || hero.genres?.length) ? (
                  <span>{(hero.genre_ids?.length ? hero.genre_ids.slice(0, 2) : []).map((g: number) => ({ 28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 18: 'Drama', 14: 'Fantasy', 27: 'Horror', 10749: 'Romance', 878: 'Sci-Fi', 53: 'Thriller', 37: 'Western', 10765: 'Sci-Fi & Fantasy' } as Record<number, string>)[g] || g).filter(Boolean).join(' · ')}</span>
                ) : null}
                {hero.vote_average > 0 && <span>★ {hero.vote_average.toFixed(1)}</span>}
              </div>
              <p>{hero.overview || 'Discover something new to watch tonight.'}</p>
              <div className="hero-actions">
                <button className="hero-play" onClick={() => goDetail(hero.id, hero.media_type || 'movie')}>
                  <Play fill="currentColor" size={16} /> Play
                </button>
                <button className="hero-secondary" onClick={() => toggleList(hero)}>
                  {isInWatchlist(hero.id, hero.media_type === 'tv' ? 'tv' : 'movie') ? (
                    <><Check size={16} /> In My List</>
                  ) : (
                    <><Plus size={16} /> Add to List</>
                  )}
                </button>
                <button className="hero-info" onClick={() => goDetail(hero.id, hero.media_type || 'movie')} aria-label="More information">
                  <Info size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="hero-dots">
            {trending.slice(0, 5).map((_, i) => (
              <button
                key={i}
                className={cn('hero-dot', i === heroIdx % 5 && 'active')}
                onClick={() => setHeroIdx(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="hero hero-placeholder" />
      )}

      <div className="board-content">
        <ProviderGrid />

        <FranchiseGrid />

        {/* TOP 10 */}
        {(movies.length > 0 || shows.length > 0) && (
          <section className="media-row">
            <div className="media-row-header">
              <h2 className="media-row-title">TOP 10 on MFY</h2>
              <div className="home-tabs">
                <button type="button" className={cn('home-tab', homeTab === 'movie' && 'active')} onClick={() => setHomeTab('movie')}>Movies</button>
                <button type="button" className={cn('home-tab', homeTab === 'tv' && 'active')} onClick={() => setHomeTab('tv')}>Series</button>
              </div>
            </div>
            <div className="top10-row">
              {(homeTab === 'movie' ? movies : shows).slice(0, 10).map((item, idx) => (
                <div
                  key={item.id}
                  className="top10-card poster-card"
                  style={{ width: 150 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => goDetail(item.id, homeTab)}
                >
                  <span className="top10-rank">{idx + 1}</span>
                  {item.poster_path ? (
                    <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
                  ) : (
                    <div className="poster-fallback">{item.title || item.name}</div>
                  )}
                  {item.vote_average > 0 && (
                    <div className="imdb-badge">
                      <span className="imdb-badge-label">IMDb</span>
                      <span className="imdb-badge-score">{Number(item.vote_average).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trending Today */}
        {movieRow.length > 0 && (
          <section className="media-row">
            <div className="media-row-header">
              <h2 className="media-row-title">Trending Today</h2>
              <button className="media-row-action" type="button" onClick={() => setCurrentPage(homeTab === 'movie' ? 'movies' : 'tv')}>
                View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
            <div className="scroll-row">
              {(homeTab === 'movie' ? movieRow : shows).slice(0, 20).map((item) => (
                <Poster
                  key={`${homeTab}-${item.id}`}
                  item={item}
                  type={homeTab}
                  inList={isInWatchlist(item.id, homeTab)}
                  onClick={() => goDetail(item.id, homeTab)}
                  onToggleList={() => toggleList(item)}
                />
              ))}
            </div>
          </section>
        )}

        {watchHistory.length > 0 && (
          <section className="media-row">
            <div className="media-row-header">
              <h2 className="media-row-title">Continue Watching</h2>
            </div>
            <div className="scroll-row">
              {watchHistory.slice(0, 12).map((h) => (
                <div
                  key={h.id}
                  className="poster-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedMedia({ id: h.mediaId, type: h.mediaType, season: h.season, episode: h.episode })
                    setCurrentPage('detail')
                  }}
                >
                  {h.posterPath ? (
                    <img src={`${POSTER_URL}${h.posterPath}`} alt={h.title} loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
                  ) : (
                    <div className="poster-fallback">{h.title}</div>
                  )}
                  <div className="poster-overlay">
                    <div className="poster-meta-title">{h.title}</div>
                    <div className="poster-meta-sub">
                      {h.duration > 0 ? `${Math.round((h.progress / h.duration) * 100)}%` : 'Resume'}
                    </div>
                  </div>
                  {h.duration > 0 && (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (h.progress / h.duration) * 100)}%`, background: 'var(--mfy-pink)' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <Row title="Coming Soon" items={upcoming} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('movies')} />
        <Row title="Critically Acclaimed" items={collection} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('movies')} />

        {/* Extra shelves every streaming app has */}
        {nowPlaying.length > 0 && (
          <Row title="Now Playing · In Theaters" items={nowPlaying} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('movies')} />
        )}
        {onTheAir.length > 0 && (
          <Row title="Airing Now · TV" items={onTheAir} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('tv')} />
        )}
        {topRatedTv.length > 0 && (
          <Row title="Top Rated Series" items={topRatedTv} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('tv')} />
        )}

        {/* Category / genre shelves */}
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Movies by Category</h2></div>
          <div className="genre-chips">
            {MOVIE_GENRES.map((g) => (
              <GenreRow key={`m-${g.id}`} genre={g} items={genreMovie[g.id] || []} onItem={goDetail} />
            ))}
          </div>
        </section>
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">TV Shows by Category</h2></div>
          <div className="genre-chips">
            {TV_GENRES.map((g) => (
              <GenreRow key={`t-${g.id}`} genre={g} items={genreTv[g.id] || []} onItem={goDetail} />
            ))}
          </div>
        </section>

        {anime.length > 0 && <AnimeSection items={anime} />}
      </div>
    </div>
  )
}

function ProviderGrid() {
  const { setSelectedProviderId, setCurrentPage } = useStore()
  return (
    <section className="apps-section">
      <div className="apps-section-label">Apps</div>
      <div className="apps-row">
        {streamingServices.map((service) => (
          <button
            key={service.id}
            className="app-tile"
            type="button"
            title={service.name}
            onClick={() => {
              setSelectedProviderId(service.id)
              setCurrentPage('provider')
            }}
          >
            <span className="app-tile-inner">
              <img src={service.logo} alt={service.name} draggable={false} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function FranchiseGrid() {
  const { setSelectedFranchiseId, setCurrentPage } = useStore()
  return (
    <section className="apps-section">
      <div className="apps-section-label">Franchises</div>
      <div className="apps-row">
        {franchises.map((f) => (
          <button
            key={f.id}
            className="app-tile app-tile-franchise"
            type="button"
            title={f.name}
            onClick={() => {
              setSelectedFranchiseId(f.id)
              setCurrentPage('franchise')
            }}
          >
            <span className="app-tile-inner" style={{ background: f.color }}>
              <img src={f.logo} alt={f.name} draggable={false} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function Row({
  title,
  items,
  onItem,
  onToggleList,
  isInList,
  viewAll,
}: {
  title: string
  items: any[]
  onItem: (id: number, type: string) => void
  onToggleList: (item: any) => void
  isInList: (id: number, type: 'movie' | 'tv') => boolean
  viewAll?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        {viewAll && (
          <button className="media-row-action" type="button" onClick={viewAll}>
            View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={ref} className="scroll-row">
          {items.filter(Boolean).map((item: any) => {
            const type = (item.media_type === 'tv' || item.first_air_date) ? 'tv' as const : 'movie' as const
            return (
              <Poster
                key={`${type}-${item.id}`}
                item={item}
                type={type}
                inList={isInList(item.id, type)}
                onClick={() => onItem(item.id, type)}
                onToggleList={() => onToggleList(item)}
              />
            )
          })}
        </div>
        <button
          className="row-next"
          onClick={() => ref.current?.scrollBy({ left: 560, behavior: 'smooth' })}
          aria-label={`More ${title}`}
          type="button"
        >
          <ChevronRight />
        </button>
      </div>
    </section>
  )
}

function GenreRow({ genre, items, onItem }: { genre: { id: number; name: string }; items: any[]; onItem: (id: number, type: string) => void }) {
  return (
    <div className="genre-slice">
      <div className="genre-slice-label">{genre.name} · {items.length}</div>
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
    <section className="media-row">
      <div className="media-row-header"><h2 className="media-row-title">Anime</h2><button className="media-row-action" type="button" onClick={() => setCurrentPage('anime')}>View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></button></div>
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
