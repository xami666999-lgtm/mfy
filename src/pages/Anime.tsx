import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { OFFLINE_ANIME } from '../data/offlineCatalog'

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_ANIME || [])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: item.media_type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
  }

  useEffect(() => {
    const jp = { with_origin_country: 'JP', with_genres: '16', sort_by: 'popularity.desc', page: '1' }
    tmdb.discoverTV(jp).then((d) => { if (d?.results?.length) setPopular(d.results) }).catch(() => {})
    tmdb.discoverTV({ ...jp, sort_by: 'first_air_date.desc' }).then((d) => setUpcoming(d?.results || [])).catch(() => {})
    const cats: Record<string, string> = {
      Action: '16,10759', Comedy: '16,35', Drama: '16,18', Romance: '16,10749',
      Crime: '16,80', Mystery: '16,9648', Family: '16,10751', SciFi: '16,10765',
    }
    Promise.all(Object.entries(cats).map(async ([name, g]) => {
      const d = await tmdb.discoverTV({ with_origin_country: 'JP', with_genres: g, sort_by: 'popularity.desc', page: '1' }).catch(() => ({ results: [] }))
      return [name, d?.results || []] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
    anilist.getPopular('ANIME', 1, 40).then((p) => {
      if (p?.media?.length) setPopular((prev) => prev.length > 12 ? prev : p.media)
    }).catch(() => {})
  }, [])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0]} kicker="ANIME" onPlay={() => popular[0] && open(popular[0])} />
      <div className="board-content px-6 pt-6">
        <MediaShelf title="Popular Anime" items={popular} onOpen={open} />
        <MediaShelf title="Upcoming Anime" items={upcoming} onOpen={open} />
        {Object.entries(rows).map(([name, list]) => (
          <MediaShelf key={name} title={name} items={list} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
