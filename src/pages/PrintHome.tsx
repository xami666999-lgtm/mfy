import { useEffect, useState } from 'react'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import { OFFLINE_MANGA } from '../data/offlineCatalog'

async function openLib(q: string) {
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=30`)
    const d = await r.json()
    return (d.docs || []).filter((m: any) => m.cover_i).map((m: any) => ({
      id: m.key,
      title: m.title,
      image: `https://covers.openlibrary.org/b/id/${m.cover_i}-L.jpg`,
    }))
  } catch {
    return []
  }
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' }) {
  const { setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_MANGA || [])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const genres = kind === 'comics'
    ? ['Marvel', 'DC', 'Image', 'Star Wars']
    : ['Action', 'Fantasy', 'Romance', 'Horror']

  useEffect(() => {
    ;(async () => {
      try {
        if (kind === 'comics') {
          const ol = await openLib('marvel dc comic')
          if (ol.length) setPopular(ol)
        } else {
          const p = await anilist.getPopular('MANGA', 1, 40)
          if (p?.media?.length) setPopular(p.media)
        }
      } catch {}
      const extra: Record<string, any[]> = {}
      for (const g of genres) {
        extra[g] = kind === 'comics' ? await openLib(`${g} comic`) : ((await anilist.search(g, 'MANGA', 1, 16).catch(() => ({ media: [] }))).media || [])
      }
      setRows(extra)
    })()
  }, [kind])

  const title = kind === 'comics' ? 'Comics' : 'Manga'
  return (
    <div className="board page-fade-enter">
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
        <p className="text-xs text-[#FF1493] mb-5">{popular.length} titles</p>
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={() => setCurrentPage(kind)} />
        {genres.map((g) => (
          <MediaShelf key={g} title={g} items={rows[g] || []} onOpen={() => setCurrentPage(kind)} />
        ))}
      </div>
    </div>
  )
}
