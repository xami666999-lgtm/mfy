import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { jikan } from '../api/jikan'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { titleLogoFromDetail } from '../api/blackhole'
import { BACKDROP_URL } from '../api/tmdb'

type Tab = 'movies' | 'tv' | 'anime'

export default function Upcoming() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [tab, setTab] = useState<Tab>('movies')
  const [movies, setMovies] = useState<any[]>([])
  const [tv, setTv] = useState<any[]>([])
  const [anime, setAnime] = useState<any[]>([])
  const [heroLogo, setHeroLogo] = useState('')

  function open(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type, title: item.title || item.name, isAnime: tab === 'anime' } as any)
    setCurrentPage('detail')
  }

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    tmdb.getUpcoming().then((d) => setMovies((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    tmdb.discoverTV({ sort_by: 'first_air_date.asc', 'first_air_date.gte': today, page: '1' }).then((d) => setTv((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    tmdb.discoverTV({ with_genres: '16', with_origin_country: 'JP', sort_by: 'first_air_date.asc', 'first_air_date.gte': today }).then((d) => {
      setAnime((d?.results || []).filter((x: any) => x.poster_path).map((x: any) => ({ ...x, media_type: 'tv', isAnime: true })))
    }).catch(() => {})
    jikan.seasonUpcoming().then((list) => {
      if (!list?.length) return
      setAnime((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)))
        return [...prev, ...list.filter((x: any) => x.image && !seen.has(String(x.id))).map((x: any) => ({
          id: x.id, title: x.title, name: x.title, poster_path: x.image, media_type: 'tv', isAnime: true,
        }))]
      })
    }).catch(() => {})
  }, [])

  const list = tab === 'movies' ? movies : tab === 'tv' ? tv : anime
  const hero = list[0]
  useEffect(() => {
    if (!hero?.id) { setHeroLogo(''); return }
    const kind = hero.media_type === 'tv' || hero.first_air_date ? 'tv' : 'movie'
    const fn = kind === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(hero.id).then((d: any) => setHeroLogo(titleLogoFromDetail(d))).catch(() => setHeroLogo(''))
  }, [hero?.id, tab])

  const months: Record<string, any[]> = {}
  for (const item of list) {
    const raw = String(item.release_date || item.first_air_date || '')
    const key = raw.slice(0, 7) || 'TBA'
    ;(months[key] ||= []).push(item)
  }

  return (
    <div className="board page-fade-enter">
      {hero && (
        <section className="hero" style={{ minHeight: '72vh' }}>
          <div className="hero-backdrop" style={{ backgroundImage: hero.backdrop_path ? `url(${BACKDROP_URL}${hero.backdrop_path})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-kicker">UPCOMING · {tab.toUpperCase()}</div>
              {heroLogo
                ? <img src={heroLogo} alt={hero.title || hero.name} style={{ maxHeight: 96, maxWidth: 420, objectFit: 'contain', margin: '8px 0 16px', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.6))' }} />
                : <h1>{hero.title || hero.name}</h1>}
              <p>{String(hero.overview || '').slice(0, 220)}</p>
              <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>{hero.release_date || hero.first_air_date || ''}</p>
              <div className="hero-actions">
                <button className="hero-play" type="button" onClick={() => open(hero)}>Details</button>
              </div>
            </div>
          </div>
        </section>
      )}
      {!hero && <PageHero item={undefined} kicker="UPCOMING" onPlay={() => {}} />}
      <div className="board-content px-6 pt-6">
        <div className="flex gap-2 mb-5">
          {(['movies', 'tv', 'anime'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`h-9 px-4 rounded-full text-xs font-semibold capitalize ${tab === t ? 'bg-[#FF1493] text-white' : 'bg-white/10 text-white/70'}`}>{t}</button>
          ))}
        </div>
        {Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([month, items]) => (
          <MediaShelf key={month} title={month === 'TBA' ? 'Date TBA' : new Date(month + '-02').toLocaleString(undefined, { month: 'long', year: 'numeric' })} items={items} onOpen={open} />
        ))}
        {!list.length && <p className="text-white/40 text-sm">Loading upcoming titles…</p>}
      </div>
    </div>
  )
}
