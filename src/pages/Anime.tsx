import { useEffect, useState } from 'react'
import { tmdb, BACKDROP_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { jikan } from '../api/jikan'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { TrailerRail } from '../components/TrailerRail'
import TitleSheet from '../components/TitleSheet'
import TitleLogo from '../components/TitleLogo'
import { getPlayerUrl } from '../api/vidy'
import { OFFLINE_ANIME } from '../data/offlineCatalog'
import { openAnime } from '../api/animeOpen'
import { addonCatalog } from '../api/stremioAddons'

const FRANCHISES = [
  { id: 37854, name: 'One Piece', tint: '#e11d2e' },
  { id: 46260, name: 'Naruto', tint: '#f59e0b' },
  { id: 85937, name: 'Demon Slayer', tint: '#16a34a' },
  { id: 95479, name: 'Jujutsu Kaisen', tint: '#7c3aed' },
  { id: 1429, name: 'Attack on Titan', tint: '#b45309' },
  { id: 60572, name: 'Pokémon', tint: '#eab308' },
  { id: 12609, name: 'Dragon Ball', tint: '#f97316' },
  { id: 30984, name: 'Bleach', tint: '#111827' },
  { id: 73223, name: 'Black Clover', tint: '#14532d' },
]

export default function Anime() {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_ANIME || [])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const [audio, setAudio] = useState<'all' | 'sub' | 'dub'>('all')
  const [calendar, setCalendar] = useState<any[]>([])
  const [sheet, setSheet] = useState<any>(null)
  const [frArt, setFrArt] = useState<Record<number, string>>({})

  function open(item: any) {
    const title = typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji || item.name)
    const tmdbPoster = String(item.poster_path || '').startsWith('/')
    if (tmdbPoster) {
      setSheet({ ...item, title, name: title, media_type: item.media_type === 'movie' ? 'movie' : 'tv', isAnime: true })
      return
    }
    openAnime({ ...item, title: { english: title } }, (id, type) => {
      setSelectedMedia({ id, type, isAnime: true, title } as any)
      setCurrentPage('detail')
    })
  }

  function play(item: any) {
    if (!String(item?.poster_path || '').startsWith('/')) {
      open(item)
      return
    }
    const title = typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji || item.name)
    const type = item.media_type === 'movie' ? 'movie' : 'tv'
    setSelectedMedia({ id: item.id, type, isAnime: true, title } as any)
    setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'vidy', type, item.id, 1, 1, true))
    setCurrentPage('player')
  }

  useEffect(() => {
    const jp = { with_origin_country: 'JP', with_genres: '16', sort_by: 'popularity.desc', page: '1' }
    tmdb.discoverTV(jp).then((d) => { if (d?.results?.length) setPopular(d.results) }).catch(() => {})
    tmdb.discoverMovies({ with_origin_country: 'JP', with_genres: '16', sort_by: 'popularity.desc', page: '1' }).then((d) => {
      if (d?.results?.length) setRows((prev) => ({ ...prev, 'Anime movies': d.results.map((x: any) => ({ ...x, media_type: 'movie' })) }))
    }).catch(() => {})
    tmdb.discoverTV({
      ...jp,
      sort_by: 'first_air_date.asc',
      'first_air_date.gte': new Date().toISOString().slice(0, 10),
    }).then((d) => setUpcoming((d?.results || []).filter((x: any) => x.poster_path))).catch(() => {})
    const cats: Record<string, string> = {
      Action: '16,10759', Comedy: '16,35', Drama: '16,18', Romance: '16,10749',
      Crime: '16,80', Mystery: '16,9648', Family: '16,10751', SciFi: '16,10765',
    }
    Promise.all(Object.entries(cats).map(async ([name, g]) => {
      const d = await tmdb.discoverTV({ with_origin_country: 'JP', with_genres: g, sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] }))
      return [name, d?.results || []] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
    anilist.getPopular('ANIME', 1, 40).then((p) => {
      const mapped = (p?.media || []).map((m: any) => ({
        id: m.id,
        title: m.title?.english || m.title?.romaji,
        name: m.title?.english || m.title?.romaji,
        poster_path: m.coverImage?.large || m.coverImage?.medium,
        backdrop_path: m.bannerImage,
        overview: m.description,
        averageScore: m.averageScore,
        media_type: m.format === 'MOVIE' ? 'movie' : 'tv',
        isAnime: true,
      }))
      if (mapped.length) setPopular((prev) => prev.length > 12 ? prev : mapped)
    }).catch(() => {})
    jikan.topAnime(1).then((list) => { if (list.length) setPopular((prev) => prev.length >= 20 ? prev : list) }).catch(() => {})
    jikan.seasonUpcoming().then((list) => {
      if (list.length) setUpcoming((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)))
        return [...prev, ...list.filter((x) => x.image && !seen.has(String(x.id)))]
      })
    }).catch(() => {})
    tmdb.getOnTheAir().then((d) => setCalendar((d?.results || []).filter((x: any) => (x.origin_country || []).includes('JP') || (x.genre_ids || []).includes(16)))).catch(() => {})
    addonCatalog('animestream').then((list) => { if (list.length) setRows((r) => ({ ...r, Animestream: list })) }).catch(() => {})
    addonCatalog('animeworld').then((list) => { if (list.length) setRows((r) => ({ ...r, AnimeWorld: list })) }).catch(() => {})
    addonCatalog('animecatalogs').then((list) => { if (list.length) setRows((r) => ({ ...r, 'Anime catalogs': list })) }).catch(() => {})
    addonCatalog('onepace').then((list) => { if (list.length) setRows((r) => ({ ...r, 'One Pace': list })) }).catch(() => {})
    FRANCHISES.forEach((f) => {
      tmdb.getTVDetail(f.id).then((d) => {
        const path = d?.backdrop_path || d?.poster_path
        if (path) setFrArt((prev) => ({ ...prev, [f.id]: path }))
      }).catch(() => {})
    })
  }, [])

  return (
    <div className="board anime-page page-fade-enter">
      <PageHero item={popular[0]} kicker="ANIME" onPlay={() => popular[0] && play(popular[0])} />
      <div className="board-content px-6 pt-6">
        <div className="flex gap-2 mb-4">
          {(['all', 'sub', 'dub'] as const).map((a) => (
            <button key={a} type="button" className={`h-8 px-3 rounded-full text-xs font-semibold ${audio === a ? 'bg-[#e50914] text-white' : 'bg-white/10 text-white/80'}`} onClick={() => setAudio(a)}>{a.toUpperCase()}</button>
          ))}
        </div>
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Anime franchises</h2></div>
          <div className="fr-row">
            {FRANCHISES.map((f) => (
              <button key={f.id} type="button" className="banner short fr" style={{ background: f.tint }} onClick={() => setSheet({ id: f.id, name: f.name, first_air_date: '2000-01-01', media_type: 'tv', isAnime: true, backdrop_path: frArt[f.id] })}>
                {frArt[f.id] && <img src={`${BACKDROP_URL}${frArt[f.id]}`} alt="" />}
                <TitleLogo id={f.id} type="tv" title={f.name} className="fr-logo" />
              </button>
            ))}
          </div>
        </section>
        <TrailerRail
          title="Trailers"
          items={popular.filter((x) => String(x.poster_path || '').startsWith('/')).slice(0, 8).map((x) => ({
            id: Number(x.id),
            type: x.media_type === 'movie' ? 'movie' as const : 'tv' as const,
            title: (typeof x.title === 'string' ? x.title : x.name) || 'Anime',
            backdrop: String(x.backdrop_path || '').startsWith('/') ? x.backdrop_path : null,
          }))}
        />
        <MediaShelf title="Airing calendar" items={calendar} onOpen={open} />
        <MediaShelf title="Popular Anime" items={(() => {
          const list = audio === 'dub'
            ? popular.filter((x) => (x.original_language || '') === 'en')
            : audio === 'sub'
              ? popular.filter((x) => (x.original_language || 'ja') !== 'en')
              : popular
          return list.length ? list : popular
        })()} onOpen={open} />
        <MediaShelf title="Upcoming Anime" items={upcoming} onOpen={open} />
        {Object.entries(rows).map(([name, list]) => (
          <MediaShelf key={name} title={name} items={list} onOpen={open} />
        ))}
      </div>
      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
