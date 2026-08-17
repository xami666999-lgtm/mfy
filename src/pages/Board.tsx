import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Plus, Info, ChevronRight, ArrowRight, Check } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { SkeletonPoster, SkeletonHero } from '../components/Skeleton'

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
  const [collection, setCollection] = useState<any[]>([])

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
              <div className="hero-kicker">{hero.media_type === 'movie' ? 'TRENDING MOVIE' : 'TRENDING SERIES'}</div>
              <h1>{hero.title || hero.name}</h1>
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
        <Row title="Trending Now" items={movieRow} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
        <Row title="Popular Movies" items={movies} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
        <Row title="Popular TV Shows" items={shows} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
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
                    <img src={`${POSTER_URL}${h.posterPath}`} alt={h.title} loading="lazy" />
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
        <Row title="Coming Soon" items={upcoming} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
        <Row title="Critically Acclaimed" items={collection} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
        {anime.length > 0 && <AnimeRow items={anime} onItem={goDetail} />}
      </div>
    </div>
  )
}

function ProviderGrid() {
  const { setSelectedProviderId, setCurrentPage } = useStore()
  return (
    <section className="provider-section">
      <div className="section-label">Browse by Provider</div>
      <div className="provider-row">
        {streamingServices.map((service) => (
          <button
            key={service.id}
            className="provider-item"
            type="button"
            title={service.name}
            onClick={() => {
              setSelectedProviderId(service.id)
              setCurrentPage('provider')
            }}
          >
            <div className="provider-logo-wrap">
              <img src={service.logo} alt={service.name} />
            </div>
            <span className="provider-name">{service.name}</span>
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
}: {
  title: string
  items: any[]
  onItem: (id: number, type: string) => void
  onToggleList: (item: any) => void
  isInList: (id: number, type: 'movie' | 'tv') => boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        <button className="media-row-action" type="button">
          View All <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </button>
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

function AnimeRow({ items, onItem }: { items: any[]; onItem: (id: number, type: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">Trending Anime</h2>
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={ref} className="scroll-row">
          {items.map((item: any) => (
            <div
              key={item.id}
              className="poster-card"
              role="button"
              tabIndex={0}
              onClick={() => onItem(item.id, 'tv')}
              onKeyDown={(e) => e.key === 'Enter' && onItem(item.id, 'tv')}
            >
              {item.coverImage?.large ? (
                <img src={item.coverImage.large} alt={item.title?.romaji || ''} loading="lazy" />
              ) : (
                <div className="poster-fallback">{item.title?.romaji}</div>
              )}
              <div className="poster-play"><Play size={18} fill="#fff" /></div>
              <div className="poster-overlay">
                <div className="poster-meta-title">{item.title?.english || item.title?.romaji}</div>
                {item.averageScore ? (
                  <div className="poster-meta-sub">★ {(item.averageScore / 10).toFixed(1)}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <button
          className="row-next"
          onClick={() => ref.current?.scrollBy({ left: 560, behavior: 'smooth' })}
          aria-label="More anime"
          type="button"
        >
          <ChevronRight />
        </button>
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
        <img src={`${POSTER_URL}${item.poster_path}`} alt={title || ''} loading="lazy" />
      ) : (
        <div className="poster-fallback">{title}</div>
      )}
      <div className="poster-play"><Play size={18} fill="#fff" /></div>
      <div className="poster-overlay">
        <div className="poster-meta-title">{title}</div>
        <div className="poster-meta-sub">
          {item.vote_average > 0 ? `★ ${item.vote_average.toFixed(1)}` : ''}
        </div>
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
