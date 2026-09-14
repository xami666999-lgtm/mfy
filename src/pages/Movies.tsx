import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import CineHero from '../components/CineHero'
import { streamingServices } from '../api/streaming'
import { isFinished } from '../lib/watchProgress'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' }, { id: 10751, name: 'Family' }, { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' }, { id: 9648, name: 'Mystery' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' }, { id: 10752, name: 'War' },
]

export default function Movies() {
  const { setSelectedMedia, setCurrentPage, setSelectedProviderId, watchHistory } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [now, setNow] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'movie' })
    setCurrentPage('detail')
  }

  useEffect(() => {
    Promise.all([1, 2, 3].map((n) => tmdb.discoverMovies({ page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })))).then((all) => {
      const list = all.flatMap((d: any) => d?.results || [])
      const seen = new Set()
      setPopular(list.filter((x: any) => x && !seen.has(x.id) && seen.add(x.id)))
    })
    tmdb.getNowPlaying().then((d) => setNow(d?.results || [])).catch(() => setNow([]))
    tmdb.getTopRated('movie').then((d) => setTop(d?.results || [])).catch(() => setTop([]))
    tmdb.getUpcoming().then((d) => setUpcoming(d?.results || [])).catch(() => setUpcoming([]))
    Promise.all(GENRES.map(async (g) => {
      const pages = await Promise.all([1, 2].map((n) => tmdb.discoverMovies({ with_genres: String(g.id), page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] }))))
      return [g.id, pages.flatMap((d: any) => d?.results || [])] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  const continueMovies = watchHistory.filter((h) => h.mediaType === 'movie' && !isFinished(h)).slice(0, 16).map((h) => ({
    id: h.mediaId, title: h.title, poster_path: h.posterPath, media_type: 'movie', season: h.season, episode: h.episode,
  }))

  return (
    <div className="board page-fade-enter">
      <CineHero items={now.length ? now : popular} kicker="MOVIE" mediaType="movie" />
      <div className="board-content px-6 pt-6">
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Providers</h2></div>
          <div className="scroll-row">
            {streamingServices.slice(0, 14).map((s) => (
              <button key={s.id} type="button" className="mfy-brand-tile shrink-0 h-16 w-28 rounded-xl border border-white/10 bg-white/5 grid place-items-center px-2" onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
                <img src={s.logo} alt={s.name} className="max-h-8 object-contain" />
              </button>
            ))}
          </div>
        </section>
        {continueMovies.length > 0 && <MediaShelf title="Continue Watching" items={continueMovies} onOpen={open} />}
        <MediaShelf title="Top 10 Movies" items={(now.length ? now : popular).slice(0, 10)} onOpen={open} />
        <MediaShelf title="Now Playing" items={now} onOpen={open} />
        <MediaShelf title="Popular" items={popular} onOpen={open} />
        <MediaShelf title="Top Rated" items={top} onOpen={open} />
        <MediaShelf title="Coming Soon" items={upcoming} onOpen={open} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
