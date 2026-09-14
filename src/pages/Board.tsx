import { useEffect, useState } from 'react'
import { Play, Plus, Info, Check, EyeOff } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL, STILL_URL, PROFILE_URL } from '../api/tmdb'
import { titleLogoFromDetail } from '../api/blackhole'
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
            key={`${title}-${item.id}-${item.season || 0}-${item.episode || 0}-${item.media_type || ''}`}
            type="button"
            className="poster-card"
            onClick={() => onOpen(item)}
          >
            {imgSrc(item)
              ? <img src={imgSrc(item)} alt="" referrerPolicy="no-referrer" loading="lazy" onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.classList.add('has-fallback') }} />
              : <div className="poster-fallback">{titleOf(item)}</div>}
            <PosterMarks item={item} />
            {(item.season || item.episode) && (
              <span className="cw-badge">S{item.season || 1} E{item.episode || 1}</span>
            )}
            {onRemove && (
              <span
                role="button"
                className="absolute top-1 left-1 z-20 h-6 w-6 rounded-full bg-black/75 text-white text-xs grid place-items-center"
                onClick={(e) => { e.stopPropagation(); onRemove(item) }}
              >✕</span>
            )}
            <div className="poster-overlay">
              <div className="poster-meta-title">{titleOf(item)}</div>
              {String(item.release_date || item.first_air_date || '').slice(0, 4) && (
                <div className="text-[10px] text-white/55">{String(item.release_date || item.first_air_date || '').slice(0, 4)}</div>
              )}
              {item.progressLabel && !item.season && !item.episode && (
                <div className="text-[10px] text-[#FF1493]">{item.progressLabel}</div>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Board() {
  const { tmdbApiKey, setCurrentPage, setSelectedMedia, setSelectedProviderId, setCurrentStreamUrl, addToWatchlist, isInWatchlist, removeFromWatchlist, watchHistory, favorites, removeHistory, clearHistory, setSelectedFranchiseId } = useStore()
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
  const [cwExtra, setCwExtra] = useState<Record<string, { poster?: string; title?: string; still?: string; runtime?: number; epName?: string; epLeft?: number }>>({})
  const [tasteRows, setTasteRows] = useState<{ name: string; items: any[] }[]>([])
  const [rowNew, setRowNew] = useState<any[]>([])
  const [rowStreaming, setRowStreaming] = useState<any[]>([])
  const [rowNewEp, setRowNewEp] = useState<any[]>([])
  const [rowNewSeason, setRowNewSeason] = useState<any[]>([])
  const [rowComing, setRowComing] = useState<any[]>([])
  const [rowTrend, setRowTrend] = useState<any[]>([])
  const [heroDetail, setHeroDetail] = useState<any>(null)
  const [directors, setDirectors] = useState<any[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-hidden-home') || '[]') } catch { return [] }
  })

  useEffect(() => { load() }, [tmdbApiKey])

  useEffect(() => {
    const need = watchHistory.filter((h: any) => h.mediaId && (!h.posterPath || !h.title || /^\d+$/.test(String(h.title))))
    if (!need.length) return
    Promise.all(need.slice(0, 16).map(async (h: any) => {
      try {
        const d = h.mediaType === 'movie' ? await tmdb.getMovieDetail(h.mediaId) : await tmdb.getTVDetail(h.mediaId)
        let still = ''
        let epName = ''
        let epLeft = 0
        if (h.mediaType !== 'movie') {
          const s = await tmdb.getSeasonDetail(h.mediaId, Number(h.season) || 1).catch(() => null)
          const eps = s?.episodes || []
          const ep = eps.find((e: any) => e.episode_number === Number(h.episode || 1))
          still = ep?.still_path || ''
          epName = ep?.name || ''
          epLeft = Math.max(0, eps.length - Number(h.episode || 1))
        }
        return [String(h.mediaId), { poster: d?.poster_path, title: d?.title || d?.name, still, runtime: d?.runtime || d?.episode_run_time?.[0] || 0, epName, epLeft }] as const
      } catch { return null }
    })).then((rows) => {
      const next: Record<string, { poster?: string; title?: string; still?: string; runtime?: number }> = {}
      rows.forEach((row) => { if (row) next[row[0]] = row[1] })
      setCwExtra((prev) => ({ ...prev, ...next }))
    })
  }, [watchHistory])

  useEffect(() => {
    if (trending.length < 2) return
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % Math.min(trending.length, 8)), 9000)
    return () => clearInterval(id)
  }, [trending.length])

  useEffect(() => {
    const h = trending[heroIdx]
    if (!h?.id) { setHeroDetail(null); return }
    const kind = h.media_type === 'tv' || h.first_air_date ? 'tv' : 'movie'
    const run = kind === 'tv' ? tmdb.getTVDetail(h.id) : tmdb.getMovieDetail(h.id)
    run.then(setHeroDetail).catch(() => setHeroDetail(null))
  }, [heroIdx, trending])

  useEffect(() => {
    const seeds = watchHistory.slice(0, 3)
    if (!seeds.length) return
    Promise.all(seeds.map((h: any) => (h.mediaType === 'movie' ? tmdb.getMovieDetail(h.mediaId) : tmdb.getTVDetail(h.mediaId))))
      .then(async (details) => {
        const kws = details.flatMap((d: any) => d?.keywords?.keywords || d?.keywords?.results || []).filter((k: any) => k?.id)
        const uniq: any[] = []
        for (const k of kws) if (!uniq.some((x) => x.id === k.id)) uniq.push(k)
        const rows: { name: string; items: any[] }[] = []
        for (const k of uniq.slice(0, 4)) {
          const r = await tmdb.discoverMovies({ with_keywords: String(k.id), sort_by: 'popularity.desc' }).catch(() => null)
          if (r?.results?.length) rows.push({ name: k.name, items: r.results })
        }
        setTasteRows(rows)
      })
      .catch(() => {})
  }, [watchHistory])

  useEffect(() => {
    tmdb.getPopularPeople(1).then((d) => {
      const list = (d?.results || []).filter((p: any) => p.profile_path).slice(0, 16)
      setDirectors(list)
    }).catch(() => {})
  }, [])

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
      const today = new Date()
      const iso = (d: Date) => d.toISOString().slice(0, 10)
      const d21 = new Date(today); d21.setDate(d21.getDate() - 21)
      const d7 = new Date(today); d7.setDate(d7.getDate() - 7)
      const f21 = new Date(today); f21.setDate(f21.getDate() + 21)
      tmdb.discoverMovies({ sort_by: 'primary_release_date.desc', 'primary_release_date.gte': iso(d21), 'primary_release_date.lte': iso(today) }).then((d) => {
        setRowNew((d?.results || []).map((x: any) => ({ ...x, media_type: 'movie', _badge: '+ New' })))
      }).catch(() => {})
      tmdb.discoverTV({ sort_by: 'first_air_date.desc', 'first_air_date.gte': iso(d21), 'first_air_date.lte': iso(today) }).then((d) => {
        setRowNew((prev) => [...prev, ...(d?.results || []).map((x: any) => ({ ...x, media_type: 'tv', _badge: '+ New' }))].slice(0, 24))
      }).catch(() => {})
      tmdb.discoverMovies({ with_release_type: '4|5', sort_by: 'primary_release_date.desc', 'primary_release_date.lte': iso(d21) }).then((d) => {
        setRowStreaming((d?.results || []).slice(0, 20).map((x: any) => ({ ...x, media_type: 'movie', _badge: 'Now Streaming' })))
      }).catch(() => {})
      tmdb.discoverTV({ sort_by: 'popularity.desc', 'air_date.gte': iso(d7), 'air_date.lte': iso(today) }).then((d) => {
        setRowNewEp((d?.results || []).map((x: any) => ({ ...x, media_type: 'tv', _badge: 'New Episode' })))
      }).catch(() => {})
      tmdb.discoverTV({ sort_by: 'first_air_date.desc', 'first_air_date.gte': iso(d21), 'first_air_date.lte': iso(today) }).then((d) => {
        setRowNewSeason((d?.results || []).map((x: any) => ({ ...x, media_type: 'tv', _badge: 'New Season' })))
      }).catch(() => {})
      tmdb.discoverTV({ sort_by: 'first_air_date.asc', 'first_air_date.gte': iso(today), 'first_air_date.lte': iso(f21) }).then((d) => {
        setRowComing((d?.results || []).map((x: any) => ({ ...x, media_type: 'tv', _badge: 'Season Coming' })))
      }).catch(() => {})
      tmdb.getTrending('all', 'day').then((d) => {
        const list = (d?.results || []).slice(10, 28).map((x: any) => ({ ...x, _badge: 'Trending' }))
        setRowTrend(list)
      }).catch(() => {})
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
    tmdb.searchMovies('Fast and Furious').then((d) => setNfsCat(d?.results || [])).catch(() => {})
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

      {hero && !hiddenIds.includes(String(hero.id)) && (
        <section className="hero cine-hero" style={{ minHeight: '82vh', paddingBottom: 88 }}>
          <div className="hero-backdrop fade-in" style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined }} />
          <div className="hero-overlay" />
          <div className="hero-content" style={{ maxWidth: '52%' }}>
            <div className="hero-copy fade-in" style={{ paddingBottom: 8 }}>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="h-6 px-2 rounded-md bg-black/55 text-[10px] font-bold tracking-widest uppercase">{hero.media_type === 'tv' ? 'Series' : 'Movie'}</span>
                {heroIdx === 0 && <span className="h-6 px-2 rounded-md bg-[#FF1493] text-[10px] font-bold">#1 Trending</span>}
                {rowNewEp.some((x) => String(x.id) === String(hero.id)) && <span className="h-6 px-2 rounded-md bg-black/55 text-[10px] font-bold">New episodes</span>}
              </div>
              {titleLogoFromDetail(heroDetail) ? (
                <img src={titleLogoFromDetail(heroDetail)} alt={titleOf(hero)} className="mb-4 max-h-28 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,.7)]" />
              ) : (
                <h1 className="cine-title">{titleOf(hero)}</h1>
              )}
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/70 mb-3">
                {hero.media_type === 'tv' && <span>S{watchHistory.find((h) => String(h.mediaId) === String(hero.id))?.season || 1} E{watchHistory.find((h) => String(h.mediaId) === String(hero.id))?.episode || heroDetail?.next_episode_to_air?.episode_number || 1}</span>}
                {hero.media_type === 'tv' && heroDetail?.next_episode_to_air?.air_date && <><span className="text-white/25">·</span><span>{heroDetail.next_episode_to_air.air_date}</span></>}
                {(heroDetail?.genres?.[0]?.name || '') && <><span className="text-white/25">·</span><span>{heroDetail.genres[0].name}</span></>}
                {(heroDetail?.release_dates || heroDetail?.content_ratings) && (
                  <span className="h-5 px-1.5 rounded bg-white/15 text-[10px] font-bold">{
                    (heroDetail.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US')?.rating)
                    || (heroDetail.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')?.release_dates?.find((x: any) => x.certification)?.certification)
                    || ''
                  }</span>
                )}
                {heroDetail?.vote_average > 0 && <><span className="text-white/25">·</span><span>★ {Number(heroDetail.vote_average).toFixed(1)}</span></>}
              </div>
              <p className="text-[10px] text-white/30 mb-2">Fonte: TMDB</p>
              <p>{hero.overview || heroDetail?.overview || 'Watch something tonight.'}</p>
              {heroDetail?.credits?.cast?.length > 0 && (
                <p className="text-[12px] text-white/45 mb-4">With {heroDetail.credits.cast.slice(0, 3).map((c: any) => c.name).join(', ')}</p>
              )}
              <div className="hero-actions">
                <button className="hero-play" type="button" onClick={() => {
                  const t = hero.media_type === 'tv' || hero.first_air_date ? 'tv' : 'movie'
                  const hist = watchHistory.find((h) => String(h.mediaId) === String(hero.id))
                  setSelectedMedia({ id: hero.id, type: t, season: hist?.season || 1, episode: hist?.episode || 1 } as any)
                  setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'playtorrio', t, hero.id, hist?.season || 1, hist?.episode || 1))
                  setCurrentPage('player')
                }}><Play fill="currentColor" size={16} /> {watchHistory.some((h) => String(h.mediaId) === String(hero.id)) ? 'Resume' : 'Play'}</button>
                <button className="hero-secondary" type="button" onClick={() => toggleList(hero)}>
                  {isInWatchlist(hero.id, hero.media_type === 'tv' ? 'tv' : 'movie') ? <><Check size={16} /> In Library</> : <><Plus size={16} /> Add to Library</>}
                </button>
                <button className="hero-info" type="button" onClick={() => goDetail(hero)} aria-label="Info"><Info size={16} /></button>
                <button className="hero-info" type="button" aria-label="Hide" onClick={() => {
                  const next = [...hiddenIds, String(hero.id)]
                  setHiddenIds(next)
                  try { localStorage.setItem('mfy-hidden-home', JSON.stringify(next)) } catch {}
                  setHeroIdx((i) => (i + 1) % Math.max(1, Math.min(trending.length, 8)))
                }}><EyeOff size={16} /></button>
              </div>
            </div>
          </div>
          <div className="absolute left-8 z-10 flex gap-1.5" style={{ bottom: 28 }}>
            {trending.slice(0, 8).map((item: any, i: number) => (
              <button key={item.id} type="button" onClick={() => setHeroIdx(i)} className={`h-1.5 rounded-full ${i === heroIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/35'}`} aria-label={titleOf(item)} />
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
              <button key={s.id} type="button" className="mfy-brand-tile shrink-0 h-28 w-48 rounded-2xl border flex items-center justify-center px-4" style={{ borderColor: s.color + '55', animationDelay: `${i * 0.2}s` }} onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
                <img src={s.logo} alt={s.name} className="h-10 w-auto max-w-[140px] object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              </button>
            ))}
          </div>
        </section>
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Franchises</h2></div>
          <div className="scroll-row">
            {[
              { id: 'marvel', name: 'Marvel', logo: '/logos/marvel.svg', color: '#ED1D24' },
              { id: 'dc', name: 'DC', logo: '/logos/dc-white.svg', color: '#0476F2' },
              { id: 'star-wars', name: 'Star Wars', logo: '/logos/star-wars.svg', color: '#FFE81F' },
              { id: 'harry-potter', name: 'Harry Potter', logo: '/logos/harry-potter.svg', color: '#D3A625' },
              { id: 'fast-furious', name: 'Fast & Furious', logo: '/logos/fast-furious.png', color: '#FF3B00' },
              { id: 'nickelodeon', name: 'Nickelodeon', logo: '/logos/nickelodeon.svg', color: '#EA5B0C' },
            ].map((f, i) => (
              <button key={f.id} type="button" className="mfy-brand-tile shrink-0 h-28 w-52 rounded-2xl border flex items-center justify-center px-4" style={{ borderColor: f.color + '77', animationDelay: `${i * 0.2}s` }} onClick={() => {
                setSelectedFranchiseId(f.id)
                setCurrentPage('franchise')
              }}>
                <img src={f.logo} alt={f.name} className="h-12 w-auto max-w-[160px] object-contain" onError={(e) => { const el = e.currentTarget; if (!el.src.includes('./logos')) { el.src = '.' + f.logo } }} />
              </button>
            ))}
          </div>
        </section>
        {watchHistory.length > 0 && (
          <section className="media-row">
            <div className="media-row-header">
              <h2 className="media-row-title">Continue Watching</h2>
              <button type="button" className="media-row-action" onClick={() => clearHistory()}>Clear all</button>
            </div>
            <div className="scroll-row">
              {(() => {
                const seen = new Map<string, any>()
                for (const h of watchHistory) {
                  if (isFinished(h) || (h as any).seriesCompleted) continue
                  const key = `${h.mediaType}-${h.mediaId}`
                  const prev = seen.get(key)
                  if (!prev || new Date(h.watchedAt || 0).getTime() > new Date(prev.watchedAt || 0).getTime()) seen.set(key, h)
                }
                return [...seen.values()].slice(0, 16)
              })().map((h: any) => {
                const extra = cwExtra[String(h.mediaId)] || {}
                const pct = watchPercent(h)
                const left = Math.max(0, Math.round(((h.duration || extra.runtime * 60 || 0) - (h.progress || 0)) / 60))
                const still = extra.still ? `${STILL_URL}${extra.still}` : (h.posterPath || extra.poster ? imgSrc({ poster_path: h.posterPath || extra.poster }) : '')
                const isTv = h.mediaType !== 'movie'
                return (
                  <button key={`${h.mediaType}-${h.mediaId}-${h.season}-${h.episode}`} type="button" className="cine-cw" onClick={() => {
                    setSelectedMedia({ id: h.mediaId, type: h.mediaType, season: h.season, episode: h.episode, title: extra.title || h.title, poster_path: h.posterPath || extra.poster, resumeAt: h.progress } as any)
                    setCurrentPage('player')
                  }}>
                    {still ? <img src={still} alt="" /> : <div className="poster-fallback">{extra.title || h.title}</div>}
                    <span className="cine-cw-chip">{pct >= 85 ? 'Next' : isTv ? `S${h.season || 1} E${h.episode || 1}` : 'Resume'}</span>
                    <div className="cine-cw-meta">
                      <div className="truncate">{isTv ? `S${h.season || 1} E${h.episode || 1} · ${extra.epName || extra.title || h.title}` : (extra.title || h.title)}</div>
                      <div className="text-white/55 text-[11px]">
                        {isTv && extra.epLeft ? `${extra.epLeft} left this season · ` : ''}
                        {left > 0 ? `Stopped at ${left} min left` : pct > 0 ? `Stopped at ${pct}%` : 'Next'}
                      </div>
                    </div>
                    <div className="cine-cw-bar"><i style={{ width: `${Math.min(100, pct)}%` }} /></div>
                  </button>
                )
              })}
            </div>
          </section>
        )}
        {directors.length > 0 && (
          <section className="media-row">
            <div className="media-row-header"><h2 className="media-row-title">Directors & stars</h2></div>
            <div className="scroll-row">
              {directors.map((p: any) => (
                <button key={p.id} type="button" className="cine-person" onClick={() => {
                  try { sessionStorage.setItem('mfy-person', JSON.stringify({ source: 'tmdb', id: p.id, name: p.name })) } catch {}
                  setCurrentPage('people')
                }}>
                  <img src={`${PROFILE_URL}${p.profile_path}`} alt="" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        <Shelf title="Top 10 Popular Movies" items={(nowPlaying.length ? nowPlaying : movies).slice(0, 10)} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Top 10 Popular TV Shows" items={(shows.length ? shows : onTheAir).slice(0, 10)} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        <Shelf title="New" items={rowNew} onOpen={goDetail} />
        <Shelf title="Now Streaming" items={rowStreaming} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="New Episode" items={rowNewEp} onOpen={(i) => goDetail(i, 'tv')} />
        <Shelf title="New Season" items={rowNewSeason} onOpen={(i) => goDetail(i, 'tv')} />
        <Shelf title="Season Coming" items={rowComing} onOpen={(i) => goDetail(i, 'tv')} />
        <Shelf title="Trending" items={rowTrend} onOpen={goDetail} />
        <Shelf title="Trending Today" items={trending} onOpen={goDetail} />
        <Shelf title="Now Playing" items={nowPlaying} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Airing Now" items={onTheAir} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        {recommended.length > 0 && <Shelf title="Recommended For You" items={recommended} onOpen={goDetail} />}
        {tasteRows.map((row) => (
          <Shelf key={row.name} title={row.name} items={row.items} onOpen={(i) => goDetail(i, 'movie')} />
        ))}
        <Shelf title="Because you liked" items={tasteRecs} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Popular Movies" items={movies} onOpen={(i) => goDetail(i, 'movie')} viewAll={() => setCurrentPage('movies')} />
        <Shelf title="Popular TV" items={shows} onOpen={(i) => goDetail(i, 'tv')} viewAll={() => setCurrentPage('tv')} />
        <Shelf title="Marvel" items={marvelCat.length ? marvelCat : mcu} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="DC" items={dcCat} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Star Wars" items={swCat} onOpen={(i) => goDetail(i, i.media_type === 'tv' ? 'tv' : 'movie')} />
        <Shelf title="Harry Potter" items={hpCat} onOpen={(i) => goDetail(i, 'movie')} />
        <Shelf title="Fast & Furious" items={nfsCat} onOpen={(i) => goDetail(i, 'movie')} />
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
