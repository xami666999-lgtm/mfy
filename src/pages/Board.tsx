import { useEffect, useState } from 'react'
import { Play, Plus, Info, Check } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { SkeletonPoster, SkeletonHero } from '../components/Skeleton'
import { streamingServices } from '../api/streaming'
import { addonCatalog } from '../api/stremioAddons'
import { getTaste } from '../lib/taste'
import { PosterMarks } from '../components/PosterMarks'
import { getPlayerUrl } from '../api/vidy'
import { isFinished, watchPercent } from '../lib/watchProgress'

function readHomeCache() {
  try {
    const d = JSON.parse(sessionStorage.getItem('mfy-home-cache') || 'null')
    if (!d?.trending?.length) return null
    if (Date.now() - (d.at || 0) > 20 * 60 * 1000) return null
    return d
  } catch { return null }
}

const HOME_CACHE = readHomeCache()

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
  const path = item.poster_path
  if (path && String(path).startsWith('http')) return `https://wsrv.nl/?url=${encodeURIComponent(String(path).replace(/^https?:\/\//, ''))}&w=400`
  if (path) return `${POSTER_URL}${path}`
  const raw = item.coverImage?.large || item.coverImage?.medium || (typeof item.coverImage === 'string' ? item.coverImage : '') || item.image || ''
  if (!raw) return ''
  if (String(raw).includes('image.tmdb.org')) return String(raw)
  return `https://wsrv.nl/?url=${encodeURIComponent(String(raw).replace(/^https?:\/\//, ''))}&w=400`
}
function titleOf(item: any) {
  return item.title?.english || item.title?.romaji || item.title || item.name || ''
}

function Shelf({ title, items, onOpen, viewAll, onRemove }: { title: string; items: any[]; onOpen: (item: any) => void; viewAll?: () => void; onRemove?: (item: any) => void }) {
  if (!items?.length) return null
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        {viewAll && <button type="button" className="media-row-action" onClick={viewAll}>{title === 'Continue Watching' ? 'Clear all' : 'View All'}</button>}
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
            <PosterMarks item={item} />
            {onRemove && (
              <span
                role="button"
                className="absolute top-1 right-1 z-20 h-6 w-6 rounded-full bg-black/75 text-white text-xs grid place-items-center"
                onClick={(e) => { e.stopPropagation(); onRemove(item) }}
              >✕</span>
            )}
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
  const { tmdbApiKey, setCurrentPage, setSelectedMedia, setSelectedProviderId, setCurrentStreamUrl, addToWatchlist, isInWatchlist, removeFromWatchlist, watchHistory, favorites, removeHistory, clearHistory } = useStore()
  const [hideWatched, setHideWatched] = useState(false)
  const [railOpen, setRailOpen] = useState(true)
  const [railQ, setRailQ] = useState('')
  const [mcu, setMcu] = useState<any[]>([])
  const [ghibli, setGhibli] = useState<any[]>([])
  const [shorties, setShorties] = useState<any[]>([])
  const [a24, setA24] = useState<any[]>([])
  const [pixar, setPixar] = useState<any[]>([])
  const [kids, setKids] = useState<any[]>([])
  const [marvelCat, setMarvelCat] = useState<any[]>([])
  const [dcCat, setDcCat] = useState<any[]>([])
  const [swCat, setSwCat] = useState<any[]>([])
  const [hpCat, setHpCat] = useState<any[]>([])
  const [nfsCat, setNfsCat] = useState<any[]>([])
  const [nickCat, setNickCat] = useState<any[]>([])
  const [tasteRecs, setTasteRecs] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>(HOME_CACHE?.trending || [])
  const [movies, setMovies] = useState<any[]>(HOME_CACHE?.movies || [])
  const [shows, setShows] = useState<any[]>(HOME_CACHE?.shows || [])
  const [anime, setAnime] = useState<any[]>(HOME_CACHE?.anime || [])
  const [manga, setManga] = useState<any[]>(HOME_CACHE?.manga || [])
  const [comics, setComics] = useState<any[]>(HOME_CACHE?.comics || [])
  const [heroIdx, setHeroIdx] = useState(0)
  const [loading, setLoading] = useState(!(HOME_CACHE?.trending?.length))
  const [error, setError] = useState('')
  const [nowPlaying, setNowPlaying] = useState<any[]>(HOME_CACHE?.nowPlaying || [])
  const [onTheAir, setOnTheAir] = useState<any[]>(HOME_CACHE?.onTheAir || [])
  const [recommended, setRecommended] = useState<any[]>([])
  const [genreMovie, setGenreMovie] = useState<Record<number, any[]>>({})
  const [genreTv, setGenreTv] = useState<Record<number, any[]>>({})
  const [genreAnime, setGenreAnime] = useState<Record<string, any[]>>({})
  const [cwExtra, setCwExtra] = useState<Record<string, { poster?: string; title?: string }>>({})

  useEffect(() => { load() }, [tmdbApiKey])

  useEffect(() => {
    const need = watchHistory.filter((h: any) => h.mediaId && (!h.posterPath || !h.title || /^\d+$/.test(String(h.title))))
    if (!need.length) return
    Promise.all(need.slice(0, 16).map(async (h: any) => {
      try {
        const d = h.mediaType === 'movie' ? await tmdb.getMovieDetail(h.mediaId) : await tmdb.getTVDetail(h.mediaId)
        return [String(h.mediaId), { poster: d?.poster_path, title: d?.title || d?.name }] as const
      } catch { return null }
    })).then((rows) => {
      const next: Record<string, { poster?: string; title?: string }> = {}
      rows.forEach((row) => { if (row) next[row[0]] = row[1] })
      setCwExtra((prev) => ({ ...prev, ...next }))
    })
  }, [watchHistory])

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
    if (!HOME_CACHE?.trending?.length) setLoading(true)
    setError('')
    try {
      const [t, m, s, np, ota] = await Promise.all([
        tmdb.getTrending('all', 'week'),
        tmdb.getPopular('movie'),
        tmdb.getPopular('tv'),
        tmdb.getNowPlaying(),
        tmdb.getOnTheAir(),
      ])
      const next = {
        at: Date.now(),
        trending: t?.results?.slice(0, 12) || [],
        movies: m?.results || [],
        shows: s?.results || [],
        nowPlaying: np?.results?.slice(0, 16) || [],
        onTheAir: ota?.results?.slice(0, 16) || [],
      }
      setTrending(next.trending)
      setMovies(next.movies)
      setShows(next.shows)
      setNowPlaying(next.nowPlaying)
      setOnTheAir(next.onTheAir)
      setLoading(false)
      try { sessionStorage.setItem('mfy-home-cache', JSON.stringify({ ...HOME_CACHE, ...next })) } catch {}
      tmdb.discoverMovies({ with_companies: '420', sort_by: 'popularity.desc', page: '1' }).then((d) => setMcu(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ with_companies: '10342', sort_by: 'popularity.desc', page: '1' }).then((d) => setGhibli(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ 'with_runtime.lte': '100', sort_by: 'popularity.desc', page: '1' }).then((d) => setShorties(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ with_companies: '41077', sort_by: 'popularity.desc', page: '1' }).then((d) => setA24(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ with_companies: '3', sort_by: 'popularity.desc', page: '1' }).then((d) => setPixar(d?.results || [])).catch(() => {})
      tmdb.discoverMovies({ with_genres: '10751', sort_by: 'popularity.desc', page: '1' }).then((d) => setKids(d?.results || [])).catch(() => {})
    } catch {
      setError('Could not load catalog. Add a TMDB key in Settings.')
      setLoading(false)
    }
    Promise.all([
      anilist.getTrending(1, 24).then((a) => setAnime(a?.media || [])).catch(async () => {
        const local = await fetch('./data/anime.json').then((r) => r.json()).catch(() => ({ anime: [] }))
        setAnime(local.anime || [])
      }),
      anilist.getPopular('MANGA', 1, 24).then((mg) => setManga(mg?.media || [])).catch(async () => {
        const local = await fetch('./data/manga.json').then((r) => r.json()).catch(() => ({ manga: [] }))
        setManga(local.manga || [])
      }),
      anilist.search('Marvel', 'MANGA', 1, 20).then((c) => setComics(c.media || [])).catch(() => setComics([])),
    ]).catch(() => {})
    loadGenres().catch(() => {})
    addonCatalog('marvel').then(setMarvelCat).catch(() => {})
    addonCatalog('dc').then(setDcCat).catch(() => {})
    addonCatalog('starwars').then(setSwCat).catch(() => {})
    tmdb.searchMovies('Harry Potter').then((d) => setHpCat(d?.results || [])).catch(() => {})
    tmdb.searchMovies('Need for Speed').then((d) => setNfsCat(d?.results || [])).catch(() => {})
    addonCatalog('nick').then(setNickCat).catch(() => {})
    const likes = getTaste().likes || []
    if (likes.length) {
      Promise.all(likes.slice(0, 4).map((s: any) => (s.type === 'tv' ? tmdb.getTVDetail(s.id) : tmdb.getMovieDetail(s.id))))
        .then((details) => setTasteRecs(details.flatMap((d: any) => d?.recommendations?.results || []).slice(0, 16)))
        .catch(() => {})
    }
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
    setSelectedMedia({ id: item.id, type: t, title: item.title || item.name } as any)
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
    <div className="board page-fade-enter flex min-h-full">
      
      <div className="flex-1 min-w-0">
      {error && <div className="error-banner mx-5 mt-4">{error}</div>}

      {hero && (
        <section className="hero" style={{ minHeight: '78vh', paddingBottom: 140 }}>
          <div className="hero-backdrop fade-in" style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined }} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-copy fade-in" style={{ paddingBottom: 8 }}>
              <div className="hero-kicker">{hero.media_type === 'tv' ? 'SERIES' : 'MOVIE'}</div>
              <h1>{titleOf(hero)}</h1>
              <p>{hero.overview || 'Watch something tonight.'}</p>
              <div className="hero-actions">
                <button className="hero-play" type="button" onClick={() => {
                  const t = hero.media_type === 'tv' || hero.first_air_date ? 'tv' : 'movie'
                  setSelectedMedia({ id: hero.id, type: t })
                  setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'vidy', t, hero.id, 1, 1))
                  setCurrentPage('player')
                }}><Play fill="currentColor" size={16} /> Play</button>
                <button className="hero-secondary" type="button" onClick={() => toggleList(hero)}>
                  {isInWatchlist(hero.id, hero.media_type === 'tv' ? 'tv' : 'movie') ? <><Check size={16} /> In Library</> : <><Plus size={16} /> Add to Library</>}
                </button>
                <button className="hero-info" type="button" onClick={() => goDetail(hero)} aria-label="Info"><Info size={16} /></button>
              </div>
            </div>
          </div>
          <div className="absolute left-6 right-6 flex gap-3 overflow-x-auto z-10" style={{ bottom: 20 }}>
            {trending.slice(0, 10).map((item: any, i: number) => (
              <button key={item.id} type="button" onClick={() => setHeroIdx(i)} className={`shrink-0 w-44 h-24 rounded-xl overflow-hidden border ${i === heroIdx ? 'border-white' : 'border-white/20'}`}>
                {item.backdrop_path ? <img src={`${BACKDROP_URL}${item.backdrop_path}`} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">{titleOf(item)}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="board-content px-5 pt-6">
        <div className="flex gap-2 px-6 mb-2">
          <button type="button" className={`h-8 px-3 rounded-full text-xs ${hideWatched ? 'bg-[#FF1493]' : 'bg-white/10'}`} onClick={() => setHideWatched((v) => !v)}>Hide watched</button>
          <button type="button" className="h-8 px-3 rounded-full text-xs bg-white/10" onClick={() => {
            const pool = [...movies, ...shows, ...trending].filter(Boolean)
            const pick = pool[Math.floor(Math.random() * pool.length)]
            if (pick) { setSelectedMedia({ id: pick.id, type: pick.media_type === 'tv' || pick.name ? 'tv' : 'movie' }); setCurrentPage('detail') }
          }}>Surprise Me</button>
        </div>
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Providers</h2></div>
          <div className="scroll-row">
            {streamingServices.map((s, i) => (
              <button key={s.id} type="button" className="mfy-brand-tile shrink-0 h-20 w-40 rounded-2xl border flex flex-col items-center justify-center gap-1 px-3" style={{ borderColor: s.color + '66', animationDelay: `${i * 0.18}s`, background: `${s.color}14` }} onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
                <img src={s.logo} alt="" className="h-8 w-auto max-w-[110px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                <span className="text-[11px] text-white/80">{s.name}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Franchises</h2></div>
          <div className="scroll-row">
            {[
              { id: 'marvel', name: 'Marvel', logo: './logos/marvel.svg', color: '#ED1D24' },
              { id: 'dc', name: 'DC', logo: './logos/dc-white.svg', color: '#0476F2' },
              { id: 'starwars', name: 'Star Wars', logo: './logos/star-wars.svg', color: '#FFE81F' },
              { id: 'hp', name: 'Harry Potter', logo: './logos/harry-potter.svg', color: '#D3A625' },
              { id: 'nfs', name: 'Need for Speed', logo: './logos/fast-furious.png', color: '#FF3B00' },
              { id: 'nick', name: 'Nickelodeon', logo: '', color: '#EA5B0C' },
            ].map((f, i) => (
              <button key={f.id} type="button" className="mfy-brand-tile shrink-0 h-20 w-40 rounded-2xl border flex flex-col items-center justify-center gap-1 px-3" style={{ borderColor: f.color + '88', animationDelay: `${i * 0.18}s`, background: `${f.color}18` }} onClick={() => {
                if (f.id === 'marvel' || f.id === 'dc' || f.id === 'starwars' || f.id === 'nick') {
                  addonCatalog(f.id as any).then((list) => {
                    const hit = list[0]
                    if (hit) { setSelectedMedia({ id: hit.id, type: hit.media_type === 'tv' ? 'tv' : 'movie', title: hit.title } as any); setCurrentPage('detail') }
                  })
                  return
                }
                tmdb.searchMovies(f.id === 'hp' ? 'Harry Potter' : 'Need for Speed').then((d) => {
                  const hit = d?.results?.[0]
                  if (hit) goDetail(hit, 'movie')
                })
              }}>
                {f.logo ? <img src={f.logo} alt="" className="h-8 w-auto max-w-[110px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : null}
                <span className="text-[11px] text-white/85">{f.name}</span>
              </button>
            ))}
          </div>
        </section>
        {watchHistory.length > 0 && (
          <Shelf
            title="Continue Watching"
            items={watchHistory.filter((h: any) => !isFinished(h)).slice(0, 16).map((h: any) => {
              const pct = watchPercent(h)
              const extra = cwExtra[String(h.mediaId)] || {}
              return { id: h.mediaId, title: extra.title || h.title, poster_path: h.posterPath || extra.poster, media_type: h.mediaType, season: h.season, episode: h.episode, progressLabel: `${h.season ? `S${h.season}E${h.episode || 1} · ` : ''}${pct > 0 ? `${pct}%` : 'Resume'}`, progress: h.progress, duration: h.duration, progressPct: pct, vote_average: 0 }
            })}
            onOpen={(h) => { setSelectedMedia({ id: h.id, type: h.media_type, season: h.season, episode: h.episode }); setCurrentPage('detail') }}
            onRemove={(h) => removeHistory(h.id, h.media_type)}
            viewAll={() => clearHistory()}
          />
        )}
        <Shelf title="Top 10 Popular Movies" items={(nowPlaying.length ? nowPlaying : movies).slice(0, 10)} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Top 10 Popular TV Shows" items={(shows.length ? shows : onTheAir).slice(0, 10)} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        <Shelf title="Trending Today" items={trending} onOpen={goDetail} />
        <Shelf title="Now Playing" items={nowPlaying} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Airing Now" items={onTheAir} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        {recommended.length > 0 && <Shelf title="Recommended For You" items={recommended} onOpen={goDetail} />}
        <Shelf title="Because you liked" items={tasteRecs} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Popular Movies" items={movies} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Popular TV" items={shows} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        <Shelf title="Marvel" items={marvelCat.length ? marvelCat : mcu} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="DC" items={dcCat} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Star Wars" items={swCat} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Harry Potter" items={hpCat} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Need for Speed" items={nfsCat} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Nickelodeon" items={nickCat} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="MCU" items={mcu} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Studio Ghibli" items={ghibli} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="One sitting" items={shorties} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="A24" items={a24} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Pixar" items={pixar} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Kids" items={kids} onOpen={(i) => goDetail(i, 'movie')} />

        {MOVIE_GENRES.map((g) => (
          <Shelf key={`m-${g.id}`} title={`Movies · ${g.name}`} items={genreMovie[g.id] || []} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        ))}
        {TV_GENRES.map((g) => (
          <Shelf key={`t-${g.id}`} title={`Series · ${g.name}`} items={genreTv[g.id] || []} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        ))}
      </div>
      </div>
    </div>
  )
}
