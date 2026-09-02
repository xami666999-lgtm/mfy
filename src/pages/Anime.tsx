import { useEffect, useState } from 'react'
import { anilist } from '../api/anilist'
import { openAnime } from '../api/animeOpen'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'

const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})

  function open(item: any) {
    openAnime(item, (id, type) => {
      setSelectedMedia({ id, type })
      setCurrentPage('detail')
    })
  }

  useEffect(() => {
    ;(async () => {
      const local = await fetch('./data/anime.json').then((r) => r.json()).catch(() => ({ anime: [] }))
      if (local.anime?.length) setPopular(local.anime)
      try {
        const p = await anilist.getPopular('ANIME', 1, 40)
        if (p?.media?.length) setPopular(p.media)
      } catch {}
      const extra: Record<string, any[]> = {}
      for (const g of GENRES) {
        try {
          extra[g] = (await anilist.getByGenre(g, 'ANIME', 1, 18)).media || []
        } catch {
          extra[g] = []
        }
      }
      setRows(extra)
    })()
  }, [])

  return (
    <div className="board page-fade-enter">
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-1">Anime</h1>
        <p className="text-xs text-[#FF1493] mb-5">Same rows as Home</p>
        <MediaShelf title="Popular Anime" items={popular} onOpen={open} />
        {GENRES.map((g) => (
          <MediaShelf key={g} title={g} items={rows[g] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
