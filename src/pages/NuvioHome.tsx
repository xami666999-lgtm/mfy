import { useEffect, useState } from 'react'
import { Play, Info } from 'lucide-react'
import { tmdb, BACKDROP_URL, POSTER_URL, STILL_URL } from '../api/tmdb'
import { useStore } from '../store'
import TitleLogo from '../components/TitleLogo'
import { getPlayerUrl } from '../api/vidy'
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

export default function NuvioHome() {
  const { setSelectedMedia, setCurrentPage, watchHistory, setCurrentStreamUrl } = useStore() as any
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
  const [sheet, setSheet] = useState<any | null>(null)
  const [sheetExtra, setSheetExtra] = useState<any>(null)
  const [eps, setEps] = useState<any[]>([])

  const hero = heroPool[idx]

  useEffect(() => {
    tmdb.getTrending('all', 'week').then((d) => setHeroPool((d?.results || []).filter((x: any) => x.backdrop_path).slice(0, 6)))
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
    if (heroPool.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % heroPool.length), 9000)
    return () => clearInterval(t)
  }, [heroPool.length])

  useEffect(() => {
    if (!hero?.id) return
    const fn = kindOf(hero) === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(hero.id).then(setHeroDetail).catch(() => setHeroDetail(null))
  }, [hero?.id])

  useEffect(() => {
    if (!sheet?.id) return
    const kind = kindOf(sheet)
    const fn = kind === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    let dead = false
    setSheetExtra(null)
    setEps([])
    fn(sheet.id).then((d) => {
      if (dead) return
      setSheetExtra(d)
      if (kind !== 'tv') return
      const sn = (d?.seasons || []).find((s: any) => s.season_number > 0)?.season_number || 1
      tmdb.getSeasonDetail(sheet.id, sn).then((s) => { if (!dead) setEps((s?.episodes || []).slice(0, 8)) }).catch(() => {})
    }).catch(() => {})
    return () => { dead = true }
  }, [sheet?.id])

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

      {top.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Top 10 Today</h2>
          <div className="nf-top">
            {top.map((item, i) => (
              <button key={`${item.id}-${i}`} type="button" className="nf-rank" onClick={() => setSheet(item)}>
                <b>{i + 1}</b>
                <img src={`${POSTER_URL}${item.poster_path}`} alt={titleOf(item)} />
                {fresh(item) && <em>New</em>}
              </button>
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

      {cw.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Continue Watching</h2>
          <div className="nv-sc">
            {cw.map((h: any) => {
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
                    <div className="nv-bar"><i style={{ width: `${pct}%` }} /></div>
                  </div>
                  <p>{h.title || 'Title'}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <PosterRow title="Trending TV" items={trendTv} onOpen={setSheet} />
      <PosterRow title="Action & Adventure" items={action} onOpen={setSheet} />
      <PosterRow title="Laugh Out Loud" items={comedy} onOpen={setSheet} />

      {sheet && (
        <div className="nf-modal" onClick={() => setSheet(null)}>
          <div className="nf-sheet" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="nf-x" onClick={() => setSheet(null)} aria-label="Close">×</button>
            <div className="nf-sheet-hero" style={{ backgroundImage: `url(${sheet.backdrop_path ? BACKDROP_URL + sheet.backdrop_path : ''})` }}>
              <div>
                <TitleLogo id={sheet.id} type={kindOf(sheet)} title={titleOf(sheet)} />
                <div className="nf-actions">
                  <button type="button" className="nf-play" onClick={() => play(sheet)}><Play size={16} fill="currentColor" /> Play</button>
                  <button type="button" className="nf-info" onClick={() => open(sheet)}>More Info</button>
                </div>
              </div>
            </div>
            <div className="nf-sheet-body">
              <div className="nf-match">
                {sheet.vote_average > 0 && <b>{Math.round(sheet.vote_average * 10)}% Match</b>}
                <span>{yearOf(sheetExtra || sheet)}</span>
                {sheetExtra?.number_of_seasons ? <span>{sheetExtra.number_of_seasons} Seasons</span> : null}
                {(sheetExtra?.genres || []).slice(0, 3).map((g: any) => <span key={g.id}>{g.name}</span>)}
              </div>
              <p>{sheetExtra?.overview || sheet.overview}</p>
              {eps.length > 0 && (
                <>
                  <h3>Episodes</h3>
                  <div className="nf-eps">
                    {eps.map((ep) => (
                      <button key={ep.id} type="button" onClick={() => play(sheet)}>
                        {ep.still_path ? <img src={`${STILL_URL}${ep.still_path}`} alt="" /> : <div className="ph" />}
                        <strong>{ep.episode_number}. {ep.name}</strong>
                        <small>{ep.overview}</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PosterRow({ title, items, onOpen }: { title: string; items: any[]; onOpen: (item: any) => void }) {
  if (!items.length) return null
  return (
    <section className="nv-row">
      <h2 className="nv-h">{title}</h2>
      <div className="nv-sc">
        {items.map((m) => (
          <button key={m.id} type="button" className="nv-poster" onClick={() => onOpen(m)}>
            <img src={`${POSTER_URL}${m.poster_path}`} alt={titleOf(m)} />
          </button>
        ))}
      </div>
    </section>
  )
}
