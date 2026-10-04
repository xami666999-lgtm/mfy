import { useEffect, useState } from 'react'
import { Play, Info } from 'lucide-react'
import { tmdb, BACKDROP_URL, POSTER_URL } from '../api/tmdb'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import TitleLogo from '../components/TitleLogo'
import TitleSheet from '../components/TitleSheet'
import { PosterTile } from '../components/PosterTile'
import { sourceBadge, BadgeImg } from '../components/QualityBadges'
import { getPlayerUrl } from '../api/vidy'
import { watchPercent } from '../lib/watchProgress'
import '../nuvio-home.css'

function kindOf(item: any) {
  return item?.media_type === 'tv' || item?.first_air_date ? 'tv' : 'movie'
}
function titleOf(item: any) {
  return item?.title || item?.name || ''
}
function yearOf(item: any) {
  return String(item?.release_date || item?.first_air_date || '').slice(0, 4)
}
function cleanParams(p: object): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(p as Record<string, unknown>)) {
    if (v == null || v === '') continue
    out[k] = String(v)
  }
  return out
}
function leftLabel(progress: number, duration: number) {
  const left = Math.max(0, (duration || 0) - (progress || 0))
  if (left < 60) return ''
  const m = Math.round(left / 60)
  if (m < 60) return `${m}m left`
  return `${Math.floor(m / 60)}h ${m % 60}m left`
}

const STUDIOS = [
  { id: 'marvel', name: 'MARVEL', color: '#c8102e', accent: '#fff', logo: './logos/marvel-word.svg', franchise: 'marvel' },
  { id: 'dc', name: 'DC', color: '#0476c0', accent: '#fff', logo: './logos/dc-white.svg', franchise: 'dc' },
  { id: 'a24', name: 'A24', color: '#111111', accent: '#fff', logo: './logos/a24.svg', company: '41077' },
  { id: 'pixar', name: 'PIXAR', color: '#222222', accent: '#f5c518', logo: './logos/pixar.svg', company: '3' },
  { id: 'disney', name: 'DISNEY', color: '#0b1f4d', accent: '#7eb6ff', logo: './logos/disney.svg', company: '2' },
  { id: 'ghibli', name: 'GHIBLI', color: '#16352a', accent: '#b7e4c7', logo: './logos/ghibli.svg', company: '10342' },
  { id: 'universal', name: 'UNIVERSAL', color: '#141414', accent: '#f5c518', logo: './logos/universal.svg', company: '33' },
  { id: 'wb', name: 'WB', color: '#041e42', accent: '#d6e4ff', logo: './logos/wb.svg', company: '174' },
  { id: 'blum', name: 'BLUMHOUSE', color: '#2a0a10', accent: '#e50914', logo: './logos/blumhouse.svg', company: '3172' },
]

const NETWORKS = [
  { id: '6', name: 'NBC' },
  { id: '16', name: 'CBS' },
  { id: '2', name: 'ABC' },
  { id: '19', name: 'FOX' },
  { id: '71', name: 'CW' },
  { id: '14', name: 'PBS' },
]

const GENRES = [
  { id: '28', name: 'Action' },
  { id: '35', name: 'Comedy' },
  { id: '18', name: 'Drama' },
  { id: '878', name: 'Sci-Fi' },
  { id: '27', name: 'Horror' },
  { id: '80', name: 'Crime' },
  { id: '14', name: 'Fantasy' },
  { id: '9648', name: 'Mystery' },
  { id: '10749', name: 'Romance' },
]

const THEMES = [
  { id: '362567', name: 'Mindfuck' },
  { id: '275311', name: 'Crazy Plot Twists' },
  { id: '10051', name: 'Heist' },
  { id: '9715', name: 'Superhero' },
  { id: '12377', name: 'Zombie' },
]

const FILMS = [
  { id: 'marvel', name: 'Marvel', franchise: 'marvel', logo: './logos/marvel-word.svg', collection: 86311 },
  { id: 'harry-potter', name: 'Harry Potter', franchise: 'harry-potter', logo: './logos/harry-potter.svg', collection: 1241 },
  { id: 'lotr', name: 'The Lord of the Rings', franchise: 'lotr', logo: './logos/lotr.png', collection: 119 },
  { id: 'star-wars', name: 'Star Wars', franchise: 'star-wars', logo: './logos/star-wars.svg', collection: 10 },
  { id: 'hobbit', name: 'The Hobbit', franchise: 'hobbit', logo: './logos/lotr.png', collection: 121938 },
  { id: 'bond', name: '007', franchise: 'bond', collection: 645 },
]

const SHOWS = [
  { id: 1399, name: 'Game of Thrones' },
  { id: 1398, name: 'The Sopranos' },
  { id: 56570, name: 'Outlander' },
  { id: 76479, name: 'The Boys' },
  { id: 1396, name: 'Breaking Bad' },
  { id: 73586, name: 'Yellowstone' },
]

const ANIME_CATS = [
  { id: 'top', name: 'Top Rated', tint: '#f5c518', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '300' } },
  { id: 'latest', name: 'Latest Release', tint: '#7eb6ff', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'first_air_date.desc', 'vote_count.gte': '20' } },
  { id: 'trend', name: 'Trending', tint: '#e50914', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' } },
  { id: 'pop', name: 'Most Popular', tint: '#f4a261', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', 'vote_count.gte': '80' } },
  { id: 'soon', name: 'Upcoming', tint: '#c4b5fd', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', 'first_air_date.gte': new Date().toISOString().slice(0, 10) } },
  { id: 'air', name: 'Airing Now', tint: '#86efac', params: { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc', 'air_date.gte': new Date(Date.now() - 86400000 * 21).toISOString().slice(0, 10), 'air_date.lte': new Date().toISOString().slice(0, 10) } },
]

const ANIME_SHOWS = [
  { id: 85937, name: 'Demon Slayer' },
  { id: 37854, name: 'One Piece' },
  { id: 30984, name: 'Bleach' },
  { id: 1429, name: 'Attack on Titan' },
  { id: 60572, name: 'Pokémon' },
  { id: 12609, name: 'Dragon Ball' },
]

const DISCOVER = [
  { id: 'soon', name: 'Anticipated', gradient: 'linear-gradient(160deg,#7f1d1d,#1c1917)', media: 'movie' as const, params: { sort_by: 'popularity.desc', 'primary_release_date.gte': new Date().toISOString().slice(0, 10) } },
  { id: 'latest', name: 'Latest', gradient: 'linear-gradient(160deg,#1e3a5f,#0f172a)', media: 'movie' as const, params: { sort_by: 'primary_release_date.desc', 'vote_count.gte': '30' } },
  { id: 'pop', name: 'Popular', gradient: 'linear-gradient(160deg,#134e4a,#0f172a)', media: 'movie' as const, params: { sort_by: 'popularity.desc' } },
  { id: 'trend', name: 'Trending', gradient: 'linear-gradient(160deg,#9a3412,#1c1917)', media: 'movie' as const, mode: 'trending' as const },
  { id: 'top', name: 'Top Rated', gradient: 'linear-gradient(160deg,#1e3a8a,#0f172a)', media: 'movie' as const, params: { sort_by: 'vote_average.desc', 'vote_count.gte': '800' } },
]

export default function NuvioHome() {
  const { setSelectedMedia, setCurrentPage, watchHistory, setCurrentStreamUrl, setSelectedProviderId, setSelectedFranchiseId } = useStore() as any
  const [heroPool, setHeroPool] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [heroDetail, setHeroDetail] = useState<any>(null)
  const [genreNames, setGenreNames] = useState<Record<number, string>>({})
  const [popularM, setPopularM] = useState<any[]>([])
  const [trendTv, setTrendTv] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [action, setAction] = useState<any[]>([])
  const [comedy, setComedy] = useState<any[]>([])
  const [because, setBecause] = useState<{ title: string; items: any[] } | null>(null)
  const [genreArt, setGenreArt] = useState<Record<string, string>>({})
  const [themeArt, setThemeArt] = useState<Record<string, string>>({})
  const [netArt, setNetArt] = useState<Record<string, string[]>>({})
  const [filmArt, setFilmArt] = useState<Record<string, string>>({})
  const [showArt, setShowArt] = useState<Record<number, string>>({})
  const [animeArt, setAnimeArt] = useState<Record<string, string[]>>({})
  const [franchiseArt, setFranchiseArt] = useState<Record<number, string>>({})
  const [sources, setSources] = useState<Record<string, string>>({})
  const [sheet, setSheet] = useState<any | null>(null)

  const hero = heroPool[idx]

  useEffect(() => {
    tmdb.getTrending('all', 'week').then((d) => setHeroPool((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 8)))
    tmdb.getPopular('movie').then((d) => setPopularM((d?.results || []).filter((x: any) => x.poster_path)))
    tmdb.getTrending('tv', 'week').then((d) => setTrendTv((d?.results || []).filter((x: any) => x.poster_path)))
    tmdb.getTrending('all', 'day').then((d) => setTop((d?.results || []).filter((x: any) => x.poster_path).slice(0, 10)))
    tmdb.getPopular('tv').then((d) => setSpots((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 3)))
    tmdb.discoverMovies({ with_genres: '28', sort_by: 'popularity.desc' }).then((d) => setAction((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    tmdb.discoverMovies({ with_genres: '35', sort_by: 'popularity.desc' }).then((d) => setComedy((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    Promise.all([tmdb.getMovieGenres(), tmdb.getTVGenres()]).then(([m, t]) => {
      const map: Record<number, string> = {}
      for (const g of [...(m?.genres || []), ...(t?.genres || [])]) map[g.id] = g.name
      setGenreNames(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let dead = false
    Promise.all(GENRES.map((g) => tmdb.discoverMovies({ with_genres: g.id, sort_by: 'popularity.desc' }).then((d) => [g.id, d?.results?.find((x: any) => x.backdrop_path)?.backdrop_path || '']).catch(() => [g.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, path] of rows) if (path) map[id as string] = path as string
      setGenreArt(map)
    })
    Promise.all(THEMES.map((g) => tmdb.discoverMovies({ with_keywords: g.id, sort_by: 'popularity.desc', 'vote_count.gte': '80' }).then((d) => [g.id, d?.results?.find((x: any) => x.backdrop_path)?.backdrop_path || '']).catch(() => [g.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, path] of rows) if (path) map[id as string] = path as string
      setThemeArt(map)
    })
    Promise.all(NETWORKS.map((n) => tmdb.discoverTV({ with_networks: n.id, sort_by: 'popularity.desc' }).then((d) => [n.id, (d?.results || []).filter((x: any) => x.poster_path).slice(0, 4).map((x: any) => x.poster_path)]).catch(() => [n.id, []]))).then((rows) => {
      if (dead) return
      const map: Record<string, string[]> = {}
      for (const [id, paths] of rows) map[id as string] = paths as string[]
      setNetArt(map)
    })
    Promise.all(FILMS.map((f) => tmdb.getCollection(f.collection).then((d) => [f.id, d?.backdrop_path || d?.parts?.find((p: any) => p.backdrop_path)?.backdrop_path || '']).catch(() => [f.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, path] of rows) if (path) map[id as string] = path as string
      setFilmArt(map)
    })
    Promise.all(SHOWS.map((s) => tmdb.getTVDetail(s.id).then((d) => [s.id, d?.backdrop_path || '']).catch(() => [s.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<number, string> = {}
      for (const [id, path] of rows) if (path) map[id as number] = path as string
      setShowArt(map)
    })
    Promise.all(ANIME_CATS.map((c) => tmdb.discoverTV(cleanParams(c.params)).then((d) => [c.id, (d?.results || []).filter((x: any) => x.poster_path).slice(0, 4).map((x: any) => x.poster_path)]).catch(() => [c.id, []]))).then((rows) => {
      if (dead) return
      const map: Record<string, string[]> = {}
      for (const [id, paths] of rows) map[id as string] = paths as string[]
      setAnimeArt(map)
    })
    Promise.all(ANIME_SHOWS.map((s) => tmdb.getTVDetail(s.id).then((d) => [s.id, d?.backdrop_path || d?.poster_path || '']).catch(() => [s.id, '']))).then((rows) => {
      if (dead) return
      const map: Record<number, string> = {}
      for (const [id, path] of rows) if (path) map[id as number] = path as string
      setFranchiseArt(map)
    })
    return () => { dead = true }
  }, [])

  useEffect(() => {
    let dead = false
    const last = (watchHistory || []).find((h: any) => h.mediaType === 'tv' || h.mediaType === 'movie')
    const load = (mediaType: string, mediaId: number, label: string) => {
      const fn = mediaType === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
      fn(Number(mediaId)).then((d) => {
        const gid = d?.genres?.[0]?.id
        if (!gid || dead) return
        const disc = mediaType === 'tv'
          ? tmdb.discoverTV({ with_genres: String(gid), sort_by: 'popularity.desc' })
          : tmdb.discoverMovies({ with_genres: String(gid), sort_by: 'popularity.desc' })
        disc.then((row) => {
          if (dead) return
          setBecause({ title: label || titleOf(d), items: (row?.results || []).filter((x: any) => x.poster_path && x.id !== Number(mediaId)).slice(0, 16) })
        }).catch(() => {})
      }).catch(() => {})
    }
    if (last?.mediaId) {
      load(last.mediaType, Number(last.mediaId), last.title || '')
      return () => { dead = true }
    }
    tmdb.getTrending('tv', 'week').then((d) => {
      const item = (d?.results || []).find((x: any) => x.poster_path)
      if (!item || dead) return
      load('tv', item.id, titleOf(item))
    }).catch(() => {})
    return () => { dead = true }
  }, [watchHistory])

  useEffect(() => {
    const pool = [...top.slice(0, 8), ...popularM.slice(0, 6), ...trendTv.slice(0, 6), ...action.slice(0, 6), ...comedy.slice(0, 6), ...(because?.items || []).slice(0, 6)]
    if (!pool.length) return
    let dead = false
    Promise.all(pool.map(async (item) => {
      const type = kindOf(item) === 'tv' ? 'tv' : 'movie'
      try {
        const d = await tmdb.getWatchProviders(type as 'movie' | 'tv', item.id)
        const region = d?.results?.US || d?.results?.GB || Object.values(d?.results || {})[0] as any
        const names = [...(region?.flatrate || []), ...(region?.ads || [])].map((p: any) => p.provider_name).filter(Boolean)
        return [String(item.id), names.join(' ')] as const
      } catch {
        return [String(item.id), ''] as const
      }
    })).then((rows) => {
      if (dead) return
      const map: Record<string, string> = {}
      for (const [id, names] of rows) if (names) map[id] = sourceBadge(names)
      setSources(map)
    })
    return () => { dead = true }
  }, [top, popularM, trendTv, action, comedy, because])

  useEffect(() => {
    if (heroPool.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % heroPool.length), 9000)
    return () => clearInterval(t)
  }, [heroPool.length])

  useEffect(() => {
    if (!hero?.id) return
    const fn = kindOf(hero) === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(hero.id).then(setHeroDetail).catch(() => setHeroDetail(null))
  }, [hero?.id])

  function open(item: any, type?: string) {
    const t = type || kindOf(item)
    setSelectedMedia({ id: item.id, type: t, title: titleOf(item) })
    setCurrentPage('detail')
  }

  function play(item: any) {
    const t = kindOf(item)
    setSelectedMedia({ id: item.id, type: t, title: titleOf(item) })
    setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'vidy', t, item.id, 1, 1))
    setCurrentPage('player')
  }

  function openShelf(title: string, media: 'movie' | 'tv', params?: Record<string, string>, mode?: 'trending') {
    try { sessionStorage.setItem('mfy-shelf', JSON.stringify({ title, media, params, mode: mode || 'discover' })) } catch {}
    setCurrentPage('shelf')
  }

  function pctOf(id: number | string) {
    const rows = (watchHistory || []).filter((h: any) => String(h.mediaId) === String(id))
    if (!rows.length) return 0
    return Math.max(...rows.map((h: any) => watchPercent(h)))
  }

  const cw = (watchHistory || []).slice(0, 12)
  const genreLine = (heroDetail?.genres?.length ? heroDetail.genres.slice(0, 2).map((g: any) => g.name) : (hero?.genre_ids || []).slice(0, 2).map((id: number) => genreNames[id]).filter(Boolean))
  const seasons = heroDetail?.number_of_seasons
  const match = hero?.vote_average ? Math.round(hero.vote_average * 10) : 0
  const fresh = (item: any) => {
    const raw = item?.release_date || item?.first_air_date
    const t = raw ? Date.parse(raw) : NaN
    return Number.isFinite(t) && Date.now() - t < 1000 * 60 * 60 * 24 * 100
  }

  return (
    <div className="nv-page">
      {hero && (
        <section className="nv-hero" key={hero.id}>
          <div className="nv-hero-bg" style={{ backgroundImage: `url(${BACKDROP_URL}${hero.backdrop_path})` }} />
          <div className="nv-hero-fade" />
          <div className="nv-hero-copy">
            <TitleLogo id={hero.id} type={kindOf(hero)} title={titleOf(hero)} />
            <p className="nv-genre">
              {[genreLine[0], yearOf(hero), kindOf(hero) === 'tv' && seasons ? `${seasons} Season${seasons === 1 ? '' : 's'}` : kindOf(hero) === 'movie' ? 'Movie' : 'Series'].filter(Boolean).join('  ·  ')}
            </p>
            <p className="nv-syn">{hero.overview}</p>
            <div className="nf-actions">
              <button type="button" className="nf-play" onClick={() => play(hero)}><Play size={18} fill="currentColor" /> Play</button>
              <button type="button" className="nf-info" onClick={() => open(hero)}><Info size={18} /> More Info</button>
            </div>
          </div>
          {match >= 70 && <div className="nf-hero-badges"><span>{match}% match</span></div>}
          <div className="nv-dots">
            {heroPool.map((_, i) => (
              <button key={i} type="button" className={`nv-dot${i === idx ? ' on' : ''}`} onClick={() => setIdx(i)} aria-label={`Featured ${i + 1}`} />
            ))}
          </div>
        </section>
      )}

      {cw.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Continue Watching</h2>
          <div className="nv-sc">
            {cw.map((h: any) => {
              const pct = Math.min(100, watchPercent(h) || Math.round(h.percent || 8))
              const left = leftLabel(h.progress, h.duration)
              return (
                <button key={`${h.mediaId}-${h.season}-${h.episode}`} type="button" className="nv-cw" onClick={() => open({ id: h.mediaId, title: h.title, media_type: h.mediaType }, h.mediaType || 'movie')}>
                  <div style={{ position: 'relative' }}>
                    {h.backdropPath || h.posterPath
                      ? <img src={`${h.backdropPath ? BACKDROP_URL : POSTER_URL}${h.backdropPath || h.posterPath}`} alt="" />
                      : <div className="ph" />}
                    {left && <span className="nv-left">{left}</span>}
                    <i className="nv-prog" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                  <p>{h.title || 'Title'}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Streaming</h2>
        <div className="svc-row">
          {streamingServices.map((s) => (
            <button key={s.id} type="button" className="svc" style={{ background: s.color }} onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
              {s.logo ? <img src={s.logo} alt={s.name} /> : <b>{s.name}</b>}
            </button>
          ))}
        </div>
      </section>

      {top.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Top 10 Today</h2>
          <div className="nf-top">
            {top.map((item, i) => (
              <button key={`${item.id}-${i}`} type="button" className="nf-rank" onClick={() => setSheet(item)}>
                <b>{i + 1}</b>
                <img src={`${POSTER_URL}${item.poster_path}`} alt={titleOf(item)} />
                {fresh(item) && <em>New</em>}
                {sources[String(item.id)] && <BadgeImg className="nv-badge" src={sources[String(item.id)]} alt="" />}
                {pctOf(item.id) > 2 && <i className="nv-prog" style={{ width: `${pctOf(item.id)}%` }} />}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Studios</h2>
        <div className="studio-row">
          {STUDIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="studio"
              style={{ background: s.color, color: s.accent }}
              onClick={() => {
                if (s.franchise) { setSelectedFranchiseId(s.franchise); setCurrentPage('franchise'); return }
                openShelf(s.name, 'movie', { with_companies: s.company || '', sort_by: 'popularity.desc', 'vote_count.gte': '80' })
              }}
            >
              {s.logo ? <img src={s.logo} alt={s.name} /> : <b>{s.name}</b>}
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Networks</h2>
        <div className="net-row">
          {NETWORKS.map((n) => (
            <button key={n.id} type="button" className="net" onClick={() => openShelf(n.name, 'tv', { with_networks: n.id, sort_by: 'popularity.desc' })}>
              <span className="net-mosaic">
                {(netArt[n.id] || []).map((p) => <img key={p} src={`${POSTER_URL}${p}`} alt="" />)}
              </span>
              <b>{n.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Discover</h2>
        <div className="disc-row">
          {DISCOVER.map((d) => (
            <button key={d.id} type="button" className="disc" style={{ background: d.gradient }} onClick={() => openShelf(d.name, d.media, d.params ? cleanParams(d.params) : undefined, d.mode)}>
              {d.name}
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Genres</h2>
        <div className="tile-row">
          {GENRES.map((g) => (
            <button key={g.id} type="button" className="tile" onClick={() => openShelf(g.name, 'movie', { with_genres: g.id, sort_by: 'popularity.desc' })}>
              {genreArt[g.id] && <img src={`${BACKDROP_URL}${genreArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Themes</h2>
        <div className="tile-row">
          {THEMES.map((g) => (
            <button key={g.id} type="button" className="tile wide" onClick={() => openShelf(g.name, 'movie', { with_keywords: g.id, sort_by: 'popularity.desc', 'vote_count.gte': '50' })}>
              {themeArt[g.id] && <img src={`${BACKDROP_URL}${themeArt[g.id]}`} alt="" />}
              <b>{g.name}</b>
            </button>
          ))}
        </div>
      </section>

      {because && because.items.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-kicker">Because You Watched {because.title}</h2>
          <div className="nv-sc">
            {because.items.map((m) => (
              <PosterTile key={m.id} poster={m.poster_path} title={titleOf(m)} genre={genreNames[m.genre_ids?.[0]]} score={m.vote_average} year={yearOf(m)} pct={pctOf(m.id)} badge={sources[String(m.id)]} onClick={() => setSheet(m)} />
            ))}
          </div>
        </section>
      )}

      {popularM.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">We think you'll love this</h2>
          <div className="nf-love">
            {popularM.filter((m) => m.backdrop_path).slice(0, 8).map((item) => (
              <button key={item.id} type="button" onClick={() => setSheet(item)}>
                <img src={`${BACKDROP_URL}${item.backdrop_path}`} alt={titleOf(item)} />
                {pctOf(item.id) > 2 && <i className="nv-prog" style={{ width: `${pctOf(item.id)}%` }} />}
              </button>
            ))}
          </div>
        </section>
      )}

      {spots.length > 0 && (
        <section className="nv-row">
          <div className="nf-spots">
            {spots.map((item) => (
              <article key={item.id} className="nf-spot" style={{ backgroundImage: `url(${BACKDROP_URL}${item.backdrop_path})` }}>
                <TitleLogo id={item.id} type="tv" title={titleOf(item)} />
                <div>
                  <button type="button" onClick={() => play(item)}><Play size={13} fill="currentColor" /> Play</button>
                  <button type="button" onClick={() => open(item, 'tv')}><Info size={13} /> More Info</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Film Collections</h2>
        <div className="banner-row">
          {FILMS.map((f) => (
            <button key={f.id} type="button" className="banner" onClick={() => { setSelectedFranchiseId(f.franchise); setCurrentPage('franchise') }}>
              {filmArt[f.id] && <img src={`${BACKDROP_URL}${filmArt[f.id]}`} alt="" />}
              {f.logo ? <img className="banner-logo" src={f.logo} alt={f.name} /> : <b>{f.name}</b>}
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">TV Collections</h2>
        <div className="banner-row">
          {SHOWS.map((s) => (
            <button key={s.id} type="button" className="banner short" onClick={() => open({ id: s.id, name: s.name, first_air_date: 'tv' }, 'tv')}>
              {showArt[s.id] && <img src={`${BACKDROP_URL}${showArt[s.id]}`} alt="" />}
              <b>{s.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Anime</h2>
        <div className="mosaic-row">
          {ANIME_CATS.map((c) => (
            <button key={c.id} type="button" className="mosaic" style={{ ['--tint' as any]: c.tint }} onClick={() => openShelf(c.name, 'tv', cleanParams(c.params))}>
              <span>
                {(animeArt[c.id] || []).map((p) => <img key={p} src={`${POSTER_URL}${p}`} alt="" />)}
              </span>
              <b>{c.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-kicker">Anime Franchises</h2>
        <div className="banner-row">
          {ANIME_SHOWS.map((s) => (
            <button key={s.id} type="button" className="banner short fr" onClick={() => setSheet({ id: s.id, name: s.name, first_air_date: '2000-01-01', media_type: 'tv', isAnime: true })}>
              {franchiseArt[s.id] && <img src={`${franchiseArt[s.id]?.startsWith('/') ? BACKDROP_URL : POSTER_URL}${franchiseArt[s.id]}`} alt="" />}
              <TitleLogo id={s.id} type="tv" title={s.name} className="fr-logo" />
            </button>
          ))}
        </div>
      </section>

      <PosterRow title="Trending TV" items={trendTv} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />
      <PosterRow title="Action & Adventure" items={action} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />
      <PosterRow title="Laugh Out Loud" items={comedy} genres={genreNames} pctOf={pctOf} badges={sources} onOpen={setSheet} />

      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

function PosterRow({ title, items, genres, pctOf, badges, onOpen }: { title: string; items: any[]; genres: Record<number, string>; pctOf: (id: any) => number; badges: Record<string, string>; onOpen: (item: any) => void }) {
  if (!items.length) return null
  return (
    <section className="nv-row">
      <h2 className="nv-h">{title}</h2>
      <div className="nv-sc">
        {items.map((m) => (
          <PosterTile
            key={m.id}
            poster={m.poster_path}
            title={titleOf(m)}
            genre={genres[m.genre_ids?.[0]]}
            score={m.vote_average}
            year={yearOf(m)}
            pct={pctOf(m.id)}
            badge={badges[String(m.id)]}
            onClick={() => onOpen(m)}
          />
        ))}
      </div>
    </section>
  )
}
