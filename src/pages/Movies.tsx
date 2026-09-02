import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'

const GENRES = [
  { id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' }, { id: 80, name: 'Crime' }, { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' }, { id: 27, name: 'Horror' }, { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' }, { id: 53, name: 'Thriller' },
]

export default function Movies() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [now, setNow] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'movie' })
    setCurrentPage('detail')
  }

  useEffect(() => {
    tmdb.getPopular('movie').then((d) => setPopular(d?.results || [])).catch(() => setPopular([]))
    tmdb.getNowPlaying().then((d) => setNow(d?.results || [])).catch(() => setNow([]))
    Promise.all(
      GENRES.map(async (g) => {
        try {
          const d = await tmdb.discoverMovies({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' })
          return [g.id, d?.results || []] as const
        } catch {
          return [g.id, []] as const
        }
      })
    ).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  return (
    <div className="board page-fade-enter">
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-1">Movies</h1>
        <p className="text-xs text-[#FF1493] mb-5">Same rows as Home</p>
        <MediaShelf title="Popular Movies" items={popular} onOpen={open} />
        <MediaShelf title="Now Playing" items={now} onOpen={open} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
