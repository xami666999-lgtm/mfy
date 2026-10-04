import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { TrailerRail } from '../components/TrailerRail'
import TitleSheet from '../components/TitleSheet'
import { getPlayerUrl } from '../api/vidy'

const GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
]

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [airing, setAiring] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})
  const [sheet, setSheet] = useState<any>(null)

  function preview(item: any) {
    setSheet({ ...item, media_type: 'tv' })
  }

  function play(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv', title: item.name || item.title })
    setCurrentStreamUrl(getPlayerUrl('playtorrio', 'tv', item.id, 1, 1))
    setCurrentPage('player')
  }

  useEffect(() => {
    Promise.all([1,2,3].map((n) => tmdb.discoverTV({ page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })))).then((all) => {
      const list = all.flatMap((d: any) => d?.results || [])
      const seen = new Set()
      setPopular(list.filter((x: any) => x && !seen.has(x.id) && seen.add(x.id)))
    })
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
      <PageHero items={(popular.length ? popular : airing).slice(0, 8)} kicker="SERIES" onPlay={(item) => item && play(item)} />
      <div className="board-content px-6 pt-6">
        <TrailerRail title="Trailers" items={popular.slice(0, 8).map((x) => ({ id: x.id, type: 'tv' as const, title: x.name || x.title || 'Show', backdrop: x.backdrop_path }))} />
        <MediaShelf title="Popular Series" items={popular} onOpen={preview} />
        <MediaShelf title="Airing Now" items={airing} onOpen={preview} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={preview} />
        ))}
      </div>
      {sheet && <TitleSheet item={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}
