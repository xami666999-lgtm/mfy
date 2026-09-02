import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import { OFFLINE_ANIME } from '../data/offlineCatalog'

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_ANIME || [])
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [action, setAction] = useState<any[]>([])
  const [fantasy, setFantasy] = useState<any[]>([])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: item.media_type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
  }

  useEffect(() => {
    const jp = { with_origin_country: 'JP', with_genres: '16', sort_by: 'popularity.desc', page: '1' }
    tmdb.discoverTV(jp).then((d) => { if (d?.results?.length) setPopular(d.results) }).catch(() => {})
    tmdb.discoverTV({ ...jp, sort_by: 'first_air_date.desc' }).then((d) => setUpcoming(d?.results || [])).catch(() => {})
    tmdb.discoverTV({ with_origin_country: 'JP', with_genres: '16,10759', sort_by: 'popularity.desc', page: '1' }).then((d) => setAction(d?.results || [])).catch(() => {})
    tmdb.discoverTV({ with_origin_country: 'JP', with_genres: '16,10765', sort_by: 'popularity.desc', page: '1' }).then((d) => setFantasy(d?.results || [])).catch(() => {})
    anilist.getPopular('ANIME', 1, 30).then((p) => {
      if (!popular.length && p?.media?.length) setPopular(p.media)
    }).catch(() => {})
  }, [])

  return (
    <div className="board page-fade-enter">
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-1">Anime</h1>
        <p className="text-xs text-[#FF1493] mb-5">Same rows as Home</p>
        <MediaShelf title="Popular Anime" items={popular} onOpen={open} />
        <MediaShelf title="Upcoming Anime" items={upcoming} onOpen={open} />
        <MediaShelf title="Action" items={action} onOpen={open} />
        <MediaShelf title="Sci-Fi & Fantasy" items={fantasy} onOpen={open} />
      </div>
    </div>
  )
}
