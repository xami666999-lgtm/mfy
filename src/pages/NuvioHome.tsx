import { useEffect, useState } from 'react'
import { tmdb, BACKDROP_URL, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import TitleLogo from '../components/TitleLogo'
import HomeCatalogs from '../components/HomeCatalogs'
import { getPlayerUrl } from '../api/vidy'
import '../nuvio-home.css'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 16, name: 'Animation' }, { id: 16, name: 'Anime', extra: '16' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' }, { id: 27, name: 'Horror' }, { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' }, { id: 10767, name: 'Talk' },
]

const THEMES = [
  { q: 'time travel', name: 'Time Travel' }, { q: 'revenge', name: 'Revenge' }, { q: 'spy', name: 'Spy' },
  { q: 'magic', name: 'Magic' }, { q: 'korean drama', name: 'K-Drama' }, { q: 'treasure', name: 'Treasure Hunt' },
  { q: 'romantic comedy', name: 'Romantic Comedy' }, { q: 'coming of age', name: 'Coming of Age' },
  { q: 'superhero', name: 'Superhero' }, { q: 'space', name: 'Space' }, { q: 'martial arts', name: 'Martial Arts' },
  { q: 'vampire', name: 'Vampire' }, { q: 'satire', name: 'Satire' },
]

const STUDIOS = [
  { id: '2', name: 'Disney' }, { id: '3', name: 'Pixar' }, { id: '420', name: 'Marvel' },
  { id: '9993', name: 'DC' }, { id: '10342', name: 'Ghibli' }, { id: '521', name: 'DreamWorks' },
  { id: '1', name: 'Lucasfilm' }, { id: '41077', name: 'A24' }, { id: '5', name: 'Columbia' },
]

const WORLD = [
  { c: 'BR', name: 'Brazilian', flag: '🇧🇷' },
  { c: 'CN', name: 'Chinese', flag: '🇨🇳' },
  { c: 'FR', name: 'French', flag: '🇫🇷' },
  { c: 'DE', name: 'German', flag: '🇩🇪' },
  { c: 'IN', name: 'Indian', flag: '🇮🇳' },
  { c: 'IT', name: 'Italian', flag: '🇮🇹' },
  { c: 'JP', name: 'Japanese', flag: '🇯🇵' },
  { c: 'KR', name: 'Korean', flag: '🇰🇷' },
  { c: 'MX', name: 'Latin American', flag: '🇲🇽' },
]

const DECADES = ['2020', '2010', '2000', '1990', '1980', '1970', '1960', '1950']

function kindOf(item: any) {
  return item?.media_type === 'tv' || item?.first_air_date ? 'tv' : 'movie'
}
function titleOf(item: any) {
  return item?.title || item?.name || ''
}

export default function NuvioHome() {
  const { setSelectedMedia, setCurrentPage, setSelectedProviderId, watchHistory, setCurrentStreamUrl } = useStore() as any
  const [heroPool, setHeroPool] = useState<any[]>([])
  const [idx, setIdx] = useState(0)
  const [cast, setCast] = useState<any[]>([])
  const [genres, setGenres] = useState<Record<string, any>>({})
  const [themes, setThemes] = useState<Record<string, any>>({})
  const [studios, setStudios] = useState<Record<string, any>>({})
  const [world, setWorld] = useState<Record<string, any>>({})
  const [popularM, setPopularM] = useState<any[]>([])
  const [popularT, setPopularT] = useState<any[]>([])
  const [newM, setNewM] = useState<any[]>([])
  const [newT, setNewT] = useState<any[]>([])

  const hero = heroPool[idx]

  useEffect(() => {
    tmdb.getTrending('all', 'week').then((d) => setHeroPool((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 8)))
    tmdb.getPopular('movie').then((d) => setPopularM(d?.results || []))
    tmdb.getPopular('tv').then((d) => setPopularT(d?.results || []))
    tmdb.getNowPlaying().then((d) => setNewM(d?.results || []))
    tmdb.getOnTheAir().then((d) => setNewT(d?.results || []))
    GENRES.forEach(async (g) => {
      const d = await tmdb.discoverMovies({ with_genres: String(g.id), sort_by: 'popularity.desc', page: '1' }).catch(() => null)
      const hit = d?.results?.[0]
      if (hit) setGenres((p) => ({ ...p, [g.name]: hit }))
    })
    THEMES.forEach(async (t) => {
      const d = await tmdb.searchMovies(t.q).catch(() => null)
      const hit = d?.results?.[0]
      if (hit) setThemes((p) => ({ ...p, [t.name]: hit }))
    })
    STUDIOS.forEach(async (s) => {
      const d = await tmdb.discoverMovies({ with_companies: s.id, sort_by: 'popularity.desc' }).catch(() => null)
      const hit = d?.results?.[0]
      if (hit) setStudios((p) => ({ ...p, [s.name]: hit }))
    })
    WORLD.forEach(async (w) => {
      const d = await tmdb.discoverMovies({ with_origin_country: w.c, sort_by: 'popularity.desc' }).catch(() => null)
      const hit = d?.results?.[0]
      if (hit) setWorld((p) => ({ ...p, [w.c]: hit }))
    })
  }, [])

  useEffect(() => {
    if (heroPool.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % heroPool.length), 8000)
    return () => clearInterval(t)
  }, [heroPool.length])

  useEffect(() => {
    if (!hero?.id) return
    const fn = kindOf(hero) === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(hero.id).then((d) => setCast((d?.credits?.cast || []).slice(0, 3))).catch(() => setCast([]))
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

  const cw = (watchHistory || []).slice(0, 12)

  return (
    <div className="nv-page">
      {hero && (
        <section className="nv-hero">
          <div className="nv-hero-bg" style={{ backgroundImage: `url(${BACKDROP_URL}${hero.backdrop_path})` }} />
          <div className="nv-hero-fade" />
          <div className="nv-hero-copy">
            <TitleLogo id={hero.id} type={kindOf(hero)} title={titleOf(hero)} />
            {cast.length > 0 && (
              <div className="nv-cast">
                {cast.map((c) => (
                  <span key={c.id} className="nv-chip">
                    <span className="nv-av">{String(c.name || '').split(' ').map((p: string) => p[0]).slice(0, 2).join('')}</span>
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            <p className="nv-genre">{kindOf(hero) === 'tv' ? 'Series' : 'Movie'}</p>
            <p className="nv-syn">{hero.overview}</p>
            <div className="nv-dots">
              {heroPool.map((_, i) => (
                <button key={i} type="button" className={`nv-dot${i === idx ? ' on' : ''}`} onClick={() => setIdx(i)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {cw.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Continue Watching</h2>
          <div className="nv-sc">
            {cw.map((h: any) => {
              const left = h.runtime && h.progress ? Math.max(1, Math.round(((h.runtime * 60) - (h.progress || 0)) / 60)) : null
              const pct = Math.min(100, Math.round((h.percent || ((h.progress || 0) / ((h.runtime || 90) * 60)) * 100) || 8))
              return (
                <button key={`${h.mediaId}-${h.season}-${h.episode}`} type="button" className="nv-cw" onClick={() => {
                  setSelectedMedia({ id: h.mediaId, type: h.mediaType || 'movie', title: h.title })
                  setCurrentPage('detail')
                }}>
                  <div style={{ position: 'relative' }}>
                    {h.backdropPath || h.posterPath
                      ? <img src={`${h.backdropPath ? BACKDROP_URL : POSTER_URL}${h.backdropPath || h.posterPath}`} alt="" />
                      : <div className="ph" />}
                    {left ? <span className="nv-left">{left}m left</span> : null}
                    <div className="nv-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                  <p>{h.title || 'Title'}</p>
                  {(h.season || h.episode) ? <small>S{h.season || 1} E{h.episode || 1}</small> : null}
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-h">Streaming</h2>
        <div className="nv-sc">
          {streamingServices.map((s) => (
            <button key={s.id} type="button" className="nv-tile" style={{ background: s.color === '#FFFFFF' ? '#111' : s.color }} onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
              <img src={s.logo} alt={s.name} />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Everyone's Watching</h2>
        <div className="nv-sc">
          {[
            { label: 'Trending Anime', page: 'anime', items: popularT.slice(0, 4) },
            { label: 'Trending Movies', page: 'movies', items: popularM.slice(0, 4) },
            { label: 'Trending Shows', page: 'tv', items: popularT.slice(4, 8) },
            { label: 'Latest Anime', page: 'anime', items: newT.slice(0, 4) },
            { label: 'Latest Movies', page: 'movies', items: newM.slice(0, 4) },
            { label: 'Latest Shows', page: 'tv', items: newT.slice(4, 8) },
          ].map((pack) => (
            <button key={pack.label} type="button" className="nv-pack" onClick={() => setCurrentPage(pack.page)}>
              <div className="mos">
                {pack.items.map((it: any) => it?.poster_path ? <img key={it.id} src={`${POSTER_URL}${it.poster_path}`} alt="" /> : <div key={Math.random()} />)}
              </div>
              <b>{pack.label}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Discover</h2>
        <div className="nv-sc">
          {[
            { label: 'Recommended', fn: () => setCurrentPage('movies') },
            { label: 'Popular', fn: () => setCurrentPage('movies') },
            { label: 'Trending', fn: () => setCurrentPage('discover') },
            { label: 'Top Rated', fn: () => setCurrentPage('movies') },
          ].map((d, i) => (
            <button key={d.label} type="button" className="nv-wide" onClick={d.fn}>
              <img src={popularM[i]?.backdrop_path ? `${BACKDROP_URL}${popularM[i].backdrop_path}` : ''} alt="" />
              <b>{d.label}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Genres</h2>
        <div className="nv-sc">
          {GENRES.map((g) => (
            <button key={g.name} type="button" className="nv-art" onClick={() => genres[g.name] && open(genres[g.name], 'movie')}>
              {genres[g.name]?.poster_path ? <img src={`${POSTER_URL}${genres[g.name].poster_path}`} alt="" /> : <div style={{ width: 118, height: 168, background: '#161616', borderRadius: 10 }} />}
              <p>{g.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Themes</h2>
        <div className="nv-sc">
          {THEMES.map((t) => (
            <button key={t.name} type="button" className="nv-art" onClick={() => themes[t.name] && open(themes[t.name], 'movie')}>
              {themes[t.name]?.poster_path ? <img src={`${POSTER_URL}${themes[t.name].poster_path}`} alt="" /> : <div style={{ width: 118, height: 168, background: '#161616', borderRadius: 10 }} />}
              <p>{t.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Studios</h2>
        <div className="nv-sc">
          {STUDIOS.map((s) => (
            <button key={s.name} type="button" className="nv-wide" onClick={() => studios[s.name] && open(studios[s.name], 'movie')}>
              {studios[s.name]?.backdrop_path ? <img src={`${BACKDROP_URL}${studios[s.name].backdrop_path}`} alt="" /> : null}
              <b>{s.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Decades</h2>
        <div className="nv-sc">
          {DECADES.map((y) => (
            <button key={y} type="button" className="nv-wide" onClick={() => {
              tmdb.discoverMovies({ 'primary_release_date.gte': `${y}-01-01`, 'primary_release_date.lte': `${Number(y) + 9}-12-31`, sort_by: 'popularity.desc' }).then((d) => {
                const hit = d?.results?.[0]
                if (hit) open(hit, 'movie')
              })
            }}>
              <img src={popularM[Number(y) % 8]?.backdrop_path ? `${BACKDROP_URL}${popularM[Number(y) % 8].backdrop_path}` : ''} alt="" />
              <b>{y}s</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">World</h2>
        <div className="nv-sc">
          {WORLD.map((w) => (
            <button key={w.c} type="button" className="nv-flag" onClick={() => world[w.c] && open(world[w.c], 'movie')}>
              {world[w.c]?.backdrop_path ? <img src={`${BACKDROP_URL}${world[w.c].backdrop_path}`} alt="" /> : <div style={{ width: '100%', height: '100%', background: '#222' }} />}
              <b>{w.flag} {w.name}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Popular — Movies</h2>
        <div className="nv-sc">
          {popularM.map((m) => (
            <button key={m.id} type="button" className="nv-poster" onClick={() => open(m, 'movie')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : null}
              <p>{m.title}</p>
              <small>{String(m.release_date || '').slice(0, 4)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">Popular — Series</h2>
        <div className="nv-sc">
          {popularT.map((m) => (
            <button key={m.id} type="button" className="nv-poster" onClick={() => open(m, 'tv')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : null}
              <p>{m.name}</p>
              <small>{String(m.first_air_date || '').slice(0, 4)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">New — Movies</h2>
        <div className="nv-sc">
          {newM.map((m) => (
            <button key={m.id} type="button" className="nv-poster" onClick={() => open(m, 'movie')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : null}
              <p>{m.title}</p>
              <small>{String(m.release_date || '').slice(0, 4)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="nv-row">
        <h2 className="nv-h">New — Series</h2>
        <div className="nv-sc">
          {newT.map((m) => (
            <button key={m.id} type="button" className="nv-poster" onClick={() => open(m, 'tv')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : null}
              <p>{m.name}</p>
              <small>{String(m.first_air_date || '').slice(0, 4)}</small>
            </button>
          ))}
        </div>
      </section>

      <div style={{ padding: '8px 0 40px' }}>
        <HomeCatalogs />
      </div>
    </div>
  )
}
