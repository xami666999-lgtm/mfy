import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { jikan } from '../api/jikan'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { OFFLINE_ANIME } from '../data/offlineCatalog'
import { openAnime } from '../api/animeOpen'
import { addonCatalog } from '../api/stremioAddons'

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_ANIME || [])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const [audio, setAudio] = useState<'all' | 'sub' | 'dub'>('all')
  const [calendar, setCalendar] = useState<any[]>([])

  function open(item: any) {
    const title = typeof item.title === 'string' ? item.title : (item.title?.english || item.title?.romaji || item.name)
    const tmdbPoster = String(item.poster_path || '').startsWith('/')
    if (tmdbPoster) {
      setSelectedMedia({ id: item.id, type: item.media_type === 'movie' ? 'movie' : 'tv', isAnime: true, title } as any)
      setCurrentPage('detail')
      return
    }
    openAnime({ ...item, title: { english: title } }, (id, type) => {
      setSelectedMedia({ id, type, isAnime: true, title } as any)
      setCurrentPage('detail')
    })
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
  }, [])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0]} kicker="ANIME" onPlay={() => popular[0] && open(popular[0])} />
      <div className="board-content px-6 pt-6">
        <div className="flex gap-2 mb-4">
          {(['all', 'sub', 'dub'] as const).map((a) => (
            <button key={a} type="button" className={`h-8 px-3 rounded-full text-xs ${audio === a ? 'bg-[#FF1493]' : 'bg-white/10'}`} onClick={() => setAudio(a)}>{a.toUpperCase()}</button>
          ))}
        </div>
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
    </div>
  )
}
