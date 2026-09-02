import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'

const GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
]

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [airing, setAiring] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv' })
    setCurrentPage('detail')
  }

  useEffect(() => {
    tmdb.getPopular('tv').then((d) => setPopular(d?.results || [])).catch(() => setPopular([]))
    tmdb.getOnTheAir().then((d) => setAiring(d?.results || [])).catch(() => setAiring([]))
    Promise.all(
      GENRES.map(async (g) => {
        try {
          const d = await tmdb.discoverTV({ with_genres: String(g.id), page: '1', sort_by: 'popularity.desc' })
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
        <h1 className="text-2xl font-bold text-white mb-1">TV Shows</h1>
        <p className="text-xs text-[#FF1493] mb-5">Same rows as Home</p>
        <MediaShelf title="Popular Series" items={popular} onOpen={open} />
        <MediaShelf title="Airing Now" items={airing} onOpen={open} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
