import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { TrailerRail } from '../components/TrailerRail'
import TitleSheet from '../components/TitleSheet'
import { getPlayerUrl } from '../api/vidy'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' },
]

export default function Movies() {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [now, setNow] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})
  const [sheet, setSheet] = useState<any>(null)

  function preview(item: any) {
    setSheet({ ...item, media_type: 'movie' })
  }

  function play(item: any) {
    setSelectedMedia({ id: item.id, type: 'movie', title: item.title || item.name })
    setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'vidy', 'movie', item.id, 1, 1))
    setCurrentPage('player')
  }

  useEffect(() => {
    Promise.all([1, 2, 3].map((n) => tmdb.discoverMovies({ page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })))).then((all) => {
      const list = all.flatMap((d: any) => d?.results || [])
      const seen = new Set()
      setPopular(list.filter((x: any) => x && !seen.has(x.id) && seen.add(x.id)))
    })
    tmdb.getNowPlaying().then((d) => setNow(d?.results || [])).catch(() => setNow([]))
    Promise.all(
      GENRES.map(async (g) => {
        const pages = await Promise.all([1, 2].map((n) => tmdb.discoverMovies({ with_genres: String(g.id), page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] }))))
        return [g.id, pages.flatMap((d: any) => d?.results || [])] as const
      })
    ).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0] || now[0]} kicker="MOVIE" onPlay={() => (popular[0] || now[0]) && play(popular[0] || now[0])} />
      <div className="board-content px-6 pt-6">
        <TrailerRail title="Trailers" items={popular.slice(0, 8).map((x) => ({ id: x.id, type: 'movie' as const, title: x.title || x.name || 'Movie', backdrop: x.backdrop_path }))} />
        <MediaShelf title="Popular Movies" items={popular} onOpen={preview} />
        <MediaShelf title="Now Playing" items={now} onOpen={preview} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={preview} />
        ))}
      </div>
      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
