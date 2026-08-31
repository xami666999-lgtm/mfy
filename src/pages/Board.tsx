import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Plus, Info, ChevronRight, ArrowRight, Check, Tv, Search, Calendar, BookOpen, Film, Sparkles, Clock, Sparkle, Heart, Zap, Shield, Award, Star } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { openAnime } from '../api/animeOpen'
import { streamingServices } from '../api/streaming'
import { franchises } from '../api/franchises'
import { mangahookApi, AiringAnime, AiringTVShow } from '../api/mangahook'
import { mcpAnimeApi, Manga } from '../api/mcpAnime'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { SkeletonPoster, SkeletonHero } from '../components/Skeleton'

const STAR_COLOR = '#FFD24C'
const GAP = 16
const POSTER_W = 140
const POSTER_H = 210

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
  const [providers, setProviders] = useState<any[]>([])
  const [franchisesData, setFranchisesData] = useState<any[]>([])
  const [manga, setManga] = useState<Manga[]>([])
  const [airingAnime, setAiringAnime] = useState<AiringAnime[]>([])
  const [airingTVShows, setAiringTVShows] = useState<AiringTVShow[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [loadingFranchises, setLoadingFranchises] = useState(false)
  const [loadingManga, setLoadingManga] = useState(false)
  const [loadingAiring, setLoadingAiring] = useState(false)

  const providerRef = useRef<HTMLDivElement>(null)
  const franchiseRef = useRef<HTMLDivElement>(null)
  const mangaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load()
  }, [tmdbApiKey])

  // Refresh the "Recommended for You" row when what you've watched/liked changes.
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
    } catch (e) {
      setError('Could not load catalog. Check your TMDB API key in Settings.')
    }
    setLoading(false)
    // Pre-fetch genre rows in the background so they fill in as the user scrolls
    // (does not block initial render).
    loadGenres().catch(() => {})
    loadProviders().catch(() => {})
    loadFranchises().catch(() => {})
    loadManga().catch(() => {})
    loadAiringSchedule().catch(() => {})
  }

  async function loadProviders() {
    setLoadingProviders(true)
    try {
      const majorProviders = [
        { id: 8, name: 'Netflix', logo: 'https://image.tmdb.org/t/p/w500/9rLOqbpO2VQrT7H6JZqQyZ3XqLg.png' },
        { id: 9, name: 'Amazon Prime Video', logo: 'https://image.tmdb.org/t/p/w500/4Hqw9q1Z9g5N1c8q8Q8Q8Q8Q8Q8.png' },
        { id: 337, name: 'Disney+', logo: 'https://image.tmdb.org/t/p/w500/r5pQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
        { id: 350, name: 'Apple TV+', logo: 'https://image.tmdb.org/t/p/w500/8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
        { id: 384, name: 'HBO Max', logo: 'https://image.tmdb.org/t/p/w500/r5pQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
        { id: 386, name: 'Hulu', logo: 'https://image.tmdb.org/t/p/w500/8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
        { id: 12, name: 'Paramount+', logo: 'https://image.tmdb.org/t/p/w500/8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
        { id: 15, name: 'Peacock', logo: 'https://image.tmdb.org/t/p/w500/8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8.png' },
      ]
      const providerData = await Promise.all(
        majorProviders.map(async (p) => {
          try {
            const [movies, tv] = await Promise.all([
              tmdb.discoverByProvider('movie', p.id, 1),
              tmdb.discoverByProvider('tv', p.id, 1),
            ])
            return {
              ...p,
              movies: movies?.results?.slice(0, 8) || [],
              tv: tv?.results?.slice(0, 8) || [],
            }
          } catch {
            return { ...p, movies: [], tv: [] }
          }
        })
      )
      setProviders(providerData.filter(p => p.movies.length > 0 || p.tv.length > 0))
    } catch (e) {
      console.error('Failed to load providers:', e)
    }
    setLoadingProviders(false)
  }

  async function loadFranchises() {
    setLoadingFranchises(true)
    try {
      // Major franchise/collection IDs from TMDB
      const franchiseIds = [
        10194,  // Marvel Cinematic Universe
        265993, // DC Extended Universe
        2344,   // Harry Potter
        645,    // Star Wars
        1241,   // Lord of the Rings
        86311,  // Fast & Furious
        12747,  // James Bond
        646,    // Mission: Impossible
        2604,   // Jurassic Park
        528,    // Batman
        863,    // Spider-Man
        550,    // Fight Club (single movie, but franchise)
      ]
      const franchiseData = await Promise.all(
        franchiseIds.map(async (id) => {
          try {
            return await tmdb.getCollectionDetail(id)
          } catch {
            return null
          }
        })
      )
      setFranchisesData(franchiseData.filter(Boolean))
    } catch (e) {
      console.error('Failed to load franchises:', e)
    }
    setLoadingFranchises(false)
  }

  async function loadManga() {
    setLoadingManga(true)
    try {
      // Get popular manga for the manga section
      const mangaData = await mcpAnimeApi.getPopularManga(30)
      setManga(mangaData)
    } catch (e) {
      console.error('Failed to load manga:', e)
    }
    setLoadingManga(false)
  }

  async function loadAiringSchedule() {
    setLoadingAiring(true)
    try {
      const [anime, tvShows] = await Promise.all([
        mangahookApi.getAiringAnime(),
        mangahookApi.getAiringTVShows(),
      ])
      setAiringAnime(anime.slice(0, 20))
      setAiringTVShows(tvShows.slice(0, 20))
    } catch (e) {
      console.error('Failed to load airing schedule:', e)
    }
    setLoadingAiring(false)
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

  // Airing schedule content - computed outside JSX to avoid ternary parsing issues
  const airingContent = (() => {
    if (loadingAiring) {
      return (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 16 }}>
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ flexShrink: 0, width: 140 }}>
                  <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                  <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                  <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ flexShrink: 0, width: 140 }}>
                  <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                  <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                  <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (airingAnime.length === 0 && airingTVShows.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
          No airing schedule data available
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 16 }}>
        {airingAnime.length > 0 && (
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-[#FF1493]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Airing Anime</p>
                <p className="text-[11px] text-white/35">{airingAnime.length} airing now</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
              {airingAnime.slice(0, 8).map((anime) => (
                <div key={anime.id} style={{ flexShrink: 0, width: 140 }} className="text-left">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                    {anime.coverImage ? (
                      <img src={anime.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={24} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-xs truncate">{anime.titleEnglish || anime.titleRomaji || anime.title}</p>
                    <p className="text-white/40 text-[10px]">
                      Ep {anime.nextAiringEpisode || '?'} � {anime.timeUntilAiring ? `${Math.round(anime.timeUntilAiring / 60)}m` : 'Soon'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {airingTVShows.length > 0 && (
          <div style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                <Tv className="w-6 h-6 text-[#FF1493]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Airing TV Shows</p>
                <p className="text-[11px] text-white/35">{airingTVShows.length} airing now</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
              {airingTVShows.slice(0, 4).map((show) => (
                <div key={show.id} style={{ flexShrink: 0, width: 140 }} className="text-left">
                  <div style={{ position: 'relative', width: '100%', paddingTop: '150%' }}>
                    {show.posterPath ? (
                      <img src={`${POSTER_URL}${show.posterPath}`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tv size={24} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-white text-xs truncate">{show.name}</p>
                    <p className="text-white/40 text-[10px]">
                      Ep {show.nextEpisodeToAir?.episodeNumber || '?'} � {show.nextEpisodeToAir?.airDate ? new Date(show.nextEpisodeToAir.airDate).toLocaleDateString() : 'Soon'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  })()

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

        {recommended.length > 0 && (
          <Row title="Recommended For You" items={recommended} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} />
        )}

        <Row title="Upcoming Releases" items={upcoming} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('movies')} />
        <Row title="Season Highlights" items={topRatedTv.length ? [...onTheAir, ...topRatedTv].slice(0, 16) : collection} onItem={goDetail} onToggleList={toggleList} isInList={isInWatchlist} viewAll={() => setCurrentPage('tv')} />

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

        {/* Providers Section */}
        {(providers.length > 0 || loadingProviders) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Streaming Providers
              </h2>
              {providers.length > 0 && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('providers')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            <div
              ref={providerRef}
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 16
              }}
            >
              {loadingProviders
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                          <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} style={{ flexShrink: 0, width: 120 }}>
                            <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                            <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                            <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                : providers.length > 0
                ? providers.slice(0, 8).map((provider) => (
                    <div key={provider.id} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                          <Film className="w-6 h-6 text-[#FF1493]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{provider.name}</p>
                          <p className="text-[11px] text-white/35">{(provider.movies?.length || 0) + (provider.tv?.length || 0)} titles</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
                        {(provider.movies?.slice(0, 4) || []).map((item: any) => (
                          <button key={item.id} onClick={() => goDetail(item.id, 'movie')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                            <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                            <p className="text-[11px] font-medium text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-white/30">{item.release_date?.slice(0,4) || ''}</p>
                          </button>
                        ))}
                        {(provider.tv?.slice(0, 4) || []).map((item: any) => (
                          <button key={item.id} onClick={() => goDetail(item.id, 'tv')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                            <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                            <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
                            <p className="text-[10px] text-white/30">{item.first_air_date?.slice(0,4) || ''}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                : tmdbApiKey
                ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      No provider data available
                    </div>
                  )
                : (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      Add TMDB API key in Settings to load provider data
                    </div>
                  )}
            </div>
          </section>
        )}


        {/* Franchises Section */}
        {(franchisesData.length > 0 || loadingFranchises) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Franchises & Collections
              </h2>
              {franchisesData.length > 0 && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('franchises')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            <div
              ref={franchiseRef}
              style={{
                display: 'flex',
                gap: 16,
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 16
              }}
            >
              {loadingFranchises
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.05] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-white/[0.05] animate-pulse rounded" />
                          <div className="h-3 w-1/2 bg-white/[0.03] animate-pulse rounded" />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, paddingBottom: 8 }}>
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} style={{ flexShrink: 0, width: 120 }}>
                            <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                            <div className="h-3 w-full bg-white/[0.05] animate-pulse rounded" />
                            <div className="h-2 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                : franchisesData.length > 0
                ? franchisesData.slice(0, 8).map((franchise) => (
                    <div key={franchise.id} style={{ flexShrink: 0, width: 320, minWidth: 280 }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" style={{ cursor: 'pointer' }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-6 h-6 text-[#FF1493]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{franchise.name}</p>
                          <p className="text-[11px] text-white/35">{franchise.parts?.length || 0} titles</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollBehavior: 'smooth', paddingBottom: 8 }}>
                        {(franchise.parts || []).slice(0, 4).map((item: any) => (
                          <button key={item.id} onClick={() => goDetail(item.id, item.media_type === 'tv' ? 'tv' : 'movie')} style={{ flexShrink: 0, width: 120 }} className="text-left">
                            <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-full aspect-[2/3] rounded-lg object-cover mb-2" loading="lazy" />
                            <p className="text-[11px] font-medium text-white truncate">{item.title || item.name}</p>
                            <p className="text-[10px] text-white/30">{item.release_date?.slice(0,4) || item.first_air_date?.slice(0,4) || ''}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                : tmdbApiKey
                ? (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      No franchise data available
                    </div>
                  )
                : (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      Add TMDB API key in Settings to load franchise data
                    </div>
                  )}
            </div>
          </section>
        )}


        {/* Manga Section */}
        {(manga.length > 0 || loadingManga) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Manga
              </h2>
              {manga.length > 0 && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('manga')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            <div
              ref={mangaRef}
              style={{
                display: 'flex',
                gap: GAP,
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 16
              }}
            >
              {loadingManga
                ? Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} style={{ flexShrink: 0, width: POSTER_W }}>
                      <div className="aspect-[2/3] bg-white/[0.05] animate-pulse rounded-lg mb-2" />
                      <div className="h-4 w-full bg-white/[0.05] animate-pulse rounded" />
                      <div className="h-3 w-3/4 bg-white/[0.03] animate-pulse rounded mt-1" />
                    </div>
                  ))
                : manga.length > 0
                ? manga.slice(0, 16).map((item) => (
                    <div
                      key={item.id}
                      className="poster-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        // Open manga detail page
                        setCurrentPage('manga-detail')
                      }}
                      style={{ flexShrink: 0, width: POSTER_W }}
                    >
                      {item.coverImage ? (
                        <img 
                          src={item.coverImage} 
                          alt={item.title} 
                          loading="lazy" 
                          style={{ width: '100%', height: POSTER_H, objectFit: 'cover' }}
                          onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }}
                        />
                      ) : (
                        <div className="poster-fallback">{item.title}</div>
                      )}
                      <div className="poster-play"><Play size={18} fill="#fff" /></div>
                      <div className="poster-overlay">
                        <div className="poster-meta-title">{item.title}</div>
                        <div className="poster-meta-sub">
                          <Stars value={item.averageScore ? item.averageScore / 10 : 0} size={12} />
                          <span className="ml-1 text-[10px] text-white/60">{item.status}</span>
                        </div>
                      </div>
                    </div>
                  ))
                : (
                    <div style={{ textAlign: 'center', padding: 16, color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', width: '100%' }}>
                      No manga data available
                    </div>
                  )}
            </div>
          </section>
        )}


        {/* Airing Schedule Section */}
        {(airingAnime.length > 0 || airingTVShows.length > 0 || loadingAiring) && (
          <section style={{ marginTop: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16 
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Airing Schedule
              </h2>
              {(airingAnime.length > 0 || airingTVShows.length > 0) && (
                <button 
                  style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    background: 'none', 
                    border: 'none', 
                    fontSize: '0.875rem', 
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  onClick={() => setCurrentPage('airing')}
                >
                  View All
                  <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </button>
              )}
            </div>
            {airingContent}
          </section>
        )}

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
