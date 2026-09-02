import { useEffect, useState } from 'react'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import { OFFLINE_MANGA } from '../data/offlineCatalog'

async function openLib(q: string) {
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24`)
    const d = await r.json()
    return (d.docs || []).map((m: any) => ({
      id: m.key,
      title: m.title,
      image: m.cover_i ? `https://covers.openlibrary.org/b/id/${m.cover_i}-L.jpg` : '',
    }))
  } catch {
    return []
  }
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' }) {
  const { setCurrentPage } = useStore()
  const genres = kind === 'comics'
    ? ['Marvel', 'DC', 'Image', 'Star Wars', 'Superhero', 'Horror', 'Sci-Fi', 'Indie']
    : ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life']
  const [popular, setPopular] = useState<any[]>(OFFLINE_MANGA)
  const [rows, setRows] = useState<Record<string, any[]>>({})

  useEffect(() => {
    ;(async () => {
      const local = await fetch('./data/manga.json').then((r) => r.json()).catch(() => ({ manga: [] }))
      if (local.manga?.length) setPopular(local.manga)
      try {
        if (kind === 'comics') {
          const [al, ol] = await Promise.all([
            anilist.search('Marvel', 'MANGA', 1, 24).then((r) => r.media).catch(() => []),
            openLib('marvel dc comics'),
          ])
          const merged = [...(al || []), ...ol]
          if (merged.length) setPopular(merged)
        } else {
          const p = await anilist.getPopular('MANGA', 1, 40)
          if (p?.media?.length) setPopular(p.media)
        }
      } catch {}
      const extra: Record<string, any[]> = {}
      for (const g of genres) {
        try {
          extra[g] = kind === 'comics'
            ? await openLib(`${g} comic`)
            : (await anilist.search(g, 'MANGA', 1, 16)).media || []
        } catch {
          extra[g] = []
        }
      }
      setRows(extra)
    })()
  }, [kind])

  const title = kind === 'comics' ? 'Comics' : 'Manga'

  return (
    <div className="board page-fade-enter">
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
        <p className="text-xs text-[#FF1493] mb-5">Same rows as Home</p>
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={() => setCurrentPage(kind)} />
        {genres.map((g) => (
          <MediaShelf key={g} title={g} items={rows[g] || []} onOpen={() => setCurrentPage(kind)} />
        ))}
      </div>
    </div>
  )
}
