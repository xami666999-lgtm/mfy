import { useEffect, useState } from 'react'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { CategoryChips, HeroBanner, PosterShelf, type ShelfItem } from '../components/ShelfHome'

function cards(media: any[]): ShelfItem[] {
  return (media || []).map((m) => ({
    id: m.id || m.key,
    title: m.title?.english || m.title?.romaji || m.title || 'Title',
    image: m.coverImage?.large || m.coverImage || m.image || (m.cover_i ? `https://covers.openlibrary.org/b/id/${m.cover_i}-L.jpg` : ''),
    sub: (m.genres || m.author_name || []).slice?.(0, 2)?.join?.(' · ') || m.format,
  }))
}

async function openLib(q: string): Promise<ShelfItem[]> {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24`)
  const d = await r.json()
  return cards(d.docs || [])
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' }) {
  const { setCurrentPage } = useStore()
  const genres = kind === 'comics'
    ? ['Popular', 'Marvel', 'DC', 'Image', 'Star Wars', 'Superhero', 'Horror', 'Sci-Fi', 'Indie']
    : ['Popular', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
  const [chip, setChip] = useState('Popular')
  const [popular, setPopular] = useState<ShelfItem[]>([])
  const [rows, setRows] = useState<Record<string, ShelfItem[]>>({})

  useEffect(() => {
    ;(async () => {
      try {
        if (kind === 'comics') {
          const [al, ol] = await Promise.all([
            anilist.search('Marvel', 'MANGA', 1, 24).then((r) => cards(r.media)).catch(() => []),
            openLib('marvel comics').catch(() => []),
          ])
          setPopular([...al, ...ol].slice(0, 40))
        } else {
          const p = await anilist.getPopular('MANGA', 1, 40)
          setPopular(cards(p.media))
        }
      } catch {
        const local = await fetch('./data/manga.json').then((r) => r.json()).catch(() => ({ manga: [] }))
        setPopular(cards(local.manga || []))
      }
      const extra: Record<string, ShelfItem[]> = {}
      for (const g of genres.filter((x) => x !== 'Popular').slice(0, 8)) {
        try {
          extra[g] = kind === 'comics'
            ? await openLib(`${g} comic`)
            : cards((await anilist.search(g, 'MANGA', 1, 16)).media)
        } catch {
          extra[g] = []
        }
      }
      setRows(extra)
    })()
  }, [kind])

  const shown = chip === 'Popular' ? popular : (rows[chip] || popular)
  const title = kind === 'comics' ? 'Comics' : 'Manga'

  return (
    <div className="page-fade-enter pb-10">
      <HeroBanner item={shown[0]} kicker={title.toUpperCase()} onPlay={() => setCurrentPage(kind)} />
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-xs text-white/35 mb-3">Same layout as Home</p>
      </div>
      <CategoryChips labels={genres} active={chip} onPick={setChip} />
      <PosterShelf title={chip} items={shown} onOpen={() => setCurrentPage(kind)} />
      {chip === 'Popular' && Object.entries(rows).map(([name, items]) => (
        <PosterShelf key={name} title={name} items={items} onOpen={() => setCurrentPage(kind)} />
      ))}
    </div>
  )
}
