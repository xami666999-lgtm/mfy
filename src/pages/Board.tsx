import { useEffect, useState } from 'react'
import { Play, Plus, Info, Check } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { SkeletonPoster, SkeletonHero } from '../components/Skeleton'
import { streamingServices } from '../api/streaming'

const MOVIE_GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' }, { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' }, { id: 37, name: 'Western' },
]
const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' }, { id: 37, name: 'Western' },
]
const ANIME_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']

function imgSrc(item: any) {
  if (item.poster_path) return `${POSTER_URL}${item.poster_path}`
  return item.coverImage?.large || item.coverImage?.medium || item.coverImage || item.image || ''
}
function titleOf(item: any) {
  return item.title?.english || item.title?.romaji || item.title || item.name || ''
}

function Shelf({ title, items, onOpen, viewAll }: { title: string; items: any[]; onOpen: (item: any) => void; viewAll?: () => void }) {
  if (!items?.length) return null
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        {viewAll && <button type="button" className="media-row-action" onClick={viewAll}>View All</button>}
      </div>
      <div className="scroll-row">
        {items.filter(Boolean).map((item: any) => (
          <button
            key={`${title}-${item.id || titleOf(item)}`}
            type="button"
            className="poster-card"
            onClick={() => onOpen(item)}
          >
            {imgSrc(item)
              ? <img src={imgSrc(item)} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
              : <div className="poster-fallback">{titleOf(item)}</div>}
            <div className="poster-overlay">
              <div className="poster-meta-title">{titleOf(item)}</div>
              {(item.season || item.episode || item.progressLabel) && (
                <div className="text-[10px] text-[#FF1493]">{item.progressLabel || `S${item.season || 1} E${item.episode || 1}`}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Board() {
  const { tmdbApiKey, setCurrentPage, setSelectedMedia, setSelectedProviderId, addToWatchlist, isInWatchlist, removeFromWatchlist, watchHistory, favorites } = useStore()
  const [hideWatched, setHideWatched] = useState(false)
  const [mcu, setMcu] = useState<any[]>([])
  const [ghibli, setGhibli] = useState<any[]>([])
  const [shorties, setShorties] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [movies, setMovies] = useState<any[]>([])
  const [shows, setShows] = useState<any[]>([])
  const [anime, setAnime] = useState<any[]>([])
  const [manga, setManga] = useState<any[]>([])
  const [comics, setComics] = useState<any[]>([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nowPlaying, setNowPlaying] = useState<any[]>([])
  const [onTheAir, setOnTheAir] = useState<any[]>([])
  const [recommended, setRecommended] = useState<any[]>([])
  const [genreMovie, setGenreMovie] = useState<Record<number, any[]>>({})
  const [genreTv, setGenreTv] = useState<Record<number, any[]>>({})
  const [genreAnime, setGenreAnime] = useState<Record<string, any[]>>({})

  useEffect(() => { load() }, [tmdbApiKey])

  useEffect(() => {
    if (trending.length < 2) return
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 8)), 7000)
    return () => clearInterval(id)
  }, [trending.length])

  useEffect(() => {
    const seeds = [...favorites, ...watchHistory].slice(0, 3)
    if (!seeds.length) return
    Promise.all(seeds.map((s: any) => (s.mediaType === 'movie' ? tmdb.getMovieDetail(s.mediaId) : tmdb.getTVDetail(s.mediaId))))
      .then((details) => {
        const recs = details.flatMap((d: any) => d?.recommendations?.results || []).slice(0, 16)
        setRecommended(recs)
      })
      .catch(() => setRecommended([]))
  }, [favorites, watchHistory])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [t, m, s, np, ota] = await Promise.all([
        tmdb.getTrending('all', 'week'),
        tmdb.getPopular('movie'),
        tmdb.getPopular('tv'),
        tmdb.getNowPlaying(),
        tmdb.getOnTheAir(),
      ])
      setTrending(t?.results?.slice(0, 12) || [])
      setMovies(m?.results || [])
      setShows(s?.results || [])
      setNowPlaying(np?.results?.slice(0, 16) || [])
      setOnTheAir(ota?.results?.slice(0, 16) || [])
      tmdb.discoverMovies({ with_companies: '420', sort_by: 'popularity.desc', page: '1' }).then((d) => setMcu(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ with_companies: '10342', sort_by: 'popularity.desc', page: '1' }).then((d) => setGhibli(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ 'with_runtime.lte': '100', sort_by: 'popularity.desc', page: '1' }).then((d) => setShorties(d?.results || [])).catch(() => {})
    } catch {
      setError('Could not load catalog. Add a TMDB key in Settings.')
    }
    try {
      const a = await anilist.getTrending(1, 24)
      setAnime(a?.media || [])
    } catch {
      const local = await fetch('./data/anime.json').then((r) => r.json()).catch(() => ({ anime: [] }))
      setAnime(local.anime || [])
    }
    try {
      const mg = await anilist.getPopular('MANGA', 1, 24)
      setManga(mg?.media || [])
    } catch {
      const local = await fetch('./data/manga.json').then((r) => r.json()).catch(() => ({ manga: [] }))
      setManga(local.manga || [])
    }
    try {
      const c = await anilist.search('Marvel', 'MANGA', 1, 20)
      setComics(c.media || [])
    } catch { setComics([]) }
    setLoading(false)
    loadGenres().catch(() => {})
  }

  async function loadGenres() {
    const gm: Record<number, any[]> = {}
    const gt: Record<number, any[]> = {}
    const ga: Record<string, any[]> = {}
    await Promise.all([
      ...MOVIE_GENRES.map(async (g) => {
        try { gm[g.id] = (await tmdb.discoverMovies({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' }))?.results || [] }
        catch { gm[g.id] = [] }
      }),
      ...TV_GENRES.map(async (g) => {
        try { gt[g.id] = (await tmdb.discoverTV({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' }))?.results || [] }
        catch { gt[g.id] = [] }
      }),
    ])
    for (const name of ANIME_GENRES.slice(0, 8)) {
      try { ga[name] = ((await anilist.getByGenre(name, 'ANIME', 1, 12))?.media) || [] }
      catch { ga[name] = [] }
    }
    setGenreMovie(gm)
    setGenreTv(gt)
    setGenreAnime(ga)
  }

  function goDetail(item: any, type?: string) {
    const t = type || ((item.media_type === 'tv' || item.first_air_date) ? 'tv' : 'movie')
    setSelectedMedia({ id: item.id, type: t })
    setCurrentPage('detail')
  }

  function toggleList(item: any) {
    const type = (item.media_type === 'tv' || item.first_air_date) ? 'tv' as const : 'movie' as const
    if (isInWatchlist(item.id, type)) removeFromWatchlist(item.id, type)
    else addToWatchlist({ mediaId: item.id, mediaType: type, title: titleOf(item), posterPath: item.poster_path || null, addedAt: new Date().toISOString() })
  }

  const hero = trending[heroIdx]

  if (loading) {
    return (
      <div className="board">
        <SkeletonHero />
        <div className="board-content">
          <div className="media-row">
            <div className="scroll-row"><SkeletonPoster count={8} /></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="board page-fade-enter">
      {error && <div className="error-banner mx-5 mt-4">{error}</div>}

      {hero && (
        <section className="hero">
          <div className="hero-backdrop fade-in" style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined }} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-copy fade-in">
              <div className="hero-kicker">{hero.media_type === 'tv' ? 'SERIES' : 'MOVIE'}</div>
              <h1>{titleOf(hero)}</h1>
              <p>{hero.overview || 'Watch something tonight.'}</p>
              <div className="hero-actions">
                <button className="hero-play" type="button" onClick={() => goDetail(hero)}><Play fill="currentColor" size={16} /> Play</button>
                <button className="hero-secondary" type="button" onClick={() => toggleList(hero)}>
                  {isInWatchlist(hero.id, hero.media_type === 'tv' ? 'tv' : 'movie') ? <><Check size={16} /> In My List</> : <><Plus size={16} /> Add to List</>}
                </button>
                <button className="hero-info" type="button" onClick={() => goDetail(hero)} aria-label="Info"><Info size={16} /></button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="board-content px-5 pt-6">
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Browse by provider</h2></div>
          <div className="scroll-row" style={{alignItems:'center'}}>
            {streamingServices.map((s) => (
              <button key={s.id} type="button" className="flex-shrink-0 w-28 h-16 rounded-xl bg-white/5 border border-white/10 grid place-items-center p-2" onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }} title={s.name}>
                <img src={s.logo} alt={s.name} className="max-h-10 max-w-full object-contain" />
              </button>
            ))}
          </div>
        </section>
        <div className="flex gap-2 px-6 mb-2">
          <button type="button" className={`h-8 px-3 rounded-full text-xs ${hideWatched ? 'bg-[#FF1493]' : 'bg-white/10'}`} onClick={() => setHideWatched((v) => !v)}>Hide watched</button>
          <button type="button" className="h-8 px-3 rounded-full text-xs bg-white/10" onClick={() => {
            const pool = [...movies, ...shows, ...trending].filter(Boolean)
            const pick = pool[Math.floor(Math.random() * pool.length)]
            if (pick) { setSelectedMedia({ id: pick.id, type: pick.media_type === 'tv' || pick.name ? 'tv' : 'movie' }); setCurrentPage('detail') }
          }}>Surprise Me</button>
        </div>
        {watchHistory.length > 0 && (
          <Shelf
            title="Continue Watching"
            items={watchHistory.slice(0, 16).map((h: any) => ({ id: h.mediaId, title: h.title, poster_path: h.posterPath, media_type: h.mediaType, season: h.season, episode: h.episode, progressLabel: h.season ? `S${h.season} E${h.episode || 1}` : 'Resume' }))}
            onOpen={(h) => { setSelectedMedia({ id: h.id, type: h.media_type, season: h.season, episode: h.episode }); setCurrentPage('detail') }}
          />
        )}
        <Shelf title="MCU" items={mcu} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Studio Ghibli" items={ghibli} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="One sitting" items={shorties} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Top 10 on MFY" items={movies.slice(0, 10)} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Trending Today" items={trending} onOpen={goDetail} />
        <Shelf title="Now Playing" items={nowPlaying} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Airing Now" items={onTheAir} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        {recommended.length > 0 && <Shelf title="Recommended For You" items={recommended} onOpen={goDetail} />}
        <Shelf title="Popular Movies" items={movies} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Popular TV" items={shows} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />

        {MOVIE_GENRES.map((g) => (
          <Shelf key={`m-${g.id}`} title={`Movies · ${g.name}`} items={genreMovie[g.id] || []} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        ))}
        {TV_GENRES.map((g) => (
          <Shelf key={`t-${g.id}`} title={`Series · ${g.name}`} items={genreTv[g.id] || []} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        ))}
      </div>
    </div>
  )
}
