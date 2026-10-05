import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { tmdb, BACKDROP_URL, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import TitleLogo from '../components/TitleLogo'
import TitleSheet from '../components/TitleSheet'
import { PosterTile, PosterStatus } from '../components/PosterTile'
import { getPlayerUrl } from '../api/vidy'
import '../nuvio-home.css'

const GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 9648: 'Mystery', 10765: 'Sci-Fi & Fantasy', 10768: 'War & Politics',
}

const NETWORKS = [
  { id: 49, name: 'HBO' },
  { id: 213, name: 'Netflix' },
  { id: 2739, name: 'Disney+' },
  { id: 2552, name: 'Apple TV+' },
  { id: 1024, name: 'Prime Video' },
  { id: 4330, name: 'Paramount+' },
  { id: 453, name: 'Hulu' },
  { id: 88, name: 'FX' },
]

function titleOf(item: any) {
  return item?.title || item?.name || 'Show'
}
function yearOf(item: any) {
  return String(item?.first_air_date || item?.release_date || '').slice(0, 4)
}

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl, watchHistory } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [airing, setAiring] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const [idx, setIdx] = useState(0)
  const [sheet, setSheet] = useState<any>(null)

  function play(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv', title: titleOf(item), poster_path: item.poster_path || null } as any)
    setCurrentStreamUrl(getPlayerUrl('playtorrio', 'tv', item.id, 1, 1))
    setCurrentPage('player')
  }

  function openShelf(name: string, params: Record<string, string>) {
    try { sessionStorage.setItem('mfy-shelf', JSON.stringify({ title: name, media: 'tv', params, mode: 'discover' })) } catch {}
    setCurrentPage('shelf')
  }

  useEffect(() => {
    Promise.all([1, 2, 3].map((n) => tmdb.discoverTV({ page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })))).then((all) => {
      const list = all.flatMap((d: any) => d?.results || [])
      const seen = new Set<number>()
      setPopular(list.filter((x: any) => x?.poster_path && !seen.has(x.id) && seen.add(x.id)))
    })
    tmdb.getOnTheAir().then((d) => setAiring((d?.results || []).filter((x: any) => x?.poster_path))).catch(() => setAiring([]))
    const shelves: [string, Record<string, string>][] = [
      ['Action & Adventure', { with_genres: '10759', sort_by: 'popularity.desc' }],
      ['Comedy', { with_genres: '35', sort_by: 'popularity.desc' }],
      ['Drama', { with_genres: '18', sort_by: 'popularity.desc' }],
      ['Crime', { with_genres: '80', sort_by: 'popularity.desc' }],
      ['Sci-Fi & Fantasy', { with_genres: '10765', sort_by: 'popularity.desc' }],
      ['Mystery', { with_genres: '9648', sort_by: 'popularity.desc' }],
    ]
    Promise.all(shelves.map(async ([name, params]) => {
      const d = await tmdb.discoverTV({ ...params, page: '1' }).catch(() => ({ results: [] }))
      return [name, (d?.results || []).filter((x: any) => x?.poster_path)] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  const heroPool = popular.slice(0, 8)
  const hero = heroPool[idx] || heroPool[0]
  useEffect(() => {
    if (heroPool.length < 2) return
    const id = setInterval(() => setIdx((n) => (n + 1) % heroPool.length), 8000)
    return () => clearInterval(id)
  }, [heroPool.length, heroPool[0]?.id])

  function pctOf(id: number | string) {
    const rowsFor = (watchHistory || []).filter((h: any) => String(h.mediaId) === String(id))
    return rowsFor.reduce((n: number, h: any) => Math.max(n, Number(h.progress) && Number(h.duration) ? Math.round((h.progress / h.duration) * 100) : 0), 0)
  }

  function Row({ title, items }: { title: string; items: any[] }) {
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
              genre={GENRES[m.genre_ids?.[0]]}
              score={m.vote_average}
              year={yearOf(m)}
              mediaId={m.id}
              item={{ ...m, media_type: 'tv' }}
              pct={pctOf(m.id)}
              onClick={() => setSheet({ ...m, media_type: 'tv' })}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="nv-page">
      {hero && (
        <section className="nv-hero" key={hero.id}>
          <div className="nv-hero-bg" style={{ backgroundImage: `url(${BACKDROP_URL}${hero.backdrop_path})` }} />
          <div className="nv-hero-fade" />
          <div className="nv-hero-copy">
            <TitleLogo id={hero.id} type="tv" title={titleOf(hero)} />
            <div className="nv-hero-actions">
              <button type="button" className="nv-play" onClick={() => play(hero)}><Play size={18} fill="currentColor" /> Play</button>
              <button type="button" className="nv-more" onClick={() => setSheet({ ...hero, media_type: 'tv' })}>More Info</button>
            </div>
            <p className="nv-meta">
              {hero.vote_average > 0 && <b>{Math.round(hero.vote_average * 10)}% Match</b>}
              {yearOf(hero) && <span>{yearOf(hero)}</span>}
              {(hero.genre_ids || []).slice(0, 3).map((id: number) => GENRES[id]).filter(Boolean).map((name: string) => <span key={name}>{name}</span>)}
            </p>
            {hero.overview && <p className="nv-quote">{hero.overview}</p>}
          </div>
          <div className="nv-dots">
            {heroPool.map((_, i) => (
              <button key={i} type="button" className={`nv-dot${i === idx ? ' on' : ''}`} onClick={() => setIdx(i)} aria-label={`Featured ${i + 1}`} />
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="nv-row">
          <h2 className="nv-h">Top 10 Today</h2>
          <div className="nv-top10">
            {popular.slice(0, 10).map((item, i) => (
              <button key={item.id} type="button" className={`nf-rank${i === 9 ? ' ten' : ''}`} onClick={() => setSheet({ ...item, media_type: 'tv' })}>
                <b>{i + 1}</b>
                <span className="nf-shot">
                  <img src={`${POSTER_URL}${item.poster_path}`} alt={titleOf(item)} />
                  <PosterStatus genre={GENRES[item.genre_ids?.[0]]} score={item.vote_average} state="fresh" pct={0} label="" />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="nv-row">
        <h2 className="nv-kicker">Networks</h2>
        <div className="svc-row">
          {NETWORKS.map((n) => (
            <button key={n.id} type="button" className="svc" onClick={() => openShelf(n.name, { with_networks: String(n.id), sort_by: 'popularity.desc' })}>
              <b>{n.name}</b>
            </button>
          ))}
        </div>
      </section>

      <Row title="Popular Series" items={popular} />
      <Row title="Airing Now" items={airing} />
      {Object.entries(rows).map(([name, list]) => <Row key={name} title={name} items={list} />)}
      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
