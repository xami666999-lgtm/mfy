import { useEffect, useState } from 'react'
import { mal, MAL_RANKS, MAL_GENRES } from '../api/mal'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function openLibrary(q: string) {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24`)
  const d = await r.json()
  return (d.docs || []).filter((b: any) => b.cover_i).map((b: any) => ({
    id: String(b.key),
    title: b.title,
    name: b.title,
    image: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`,
    poster_path: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`,
    media_type: 'comics',
  }))
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' | 'novels' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [publishing, setPublishing] = useState<any[]>([])
  const [ranks, setRanks] = useState<Record<string, any[]>>({})
  const [genres, setGenres] = useState<Record<number, any[]>>({})
  const title = kind === 'comics' ? 'Comics' : kind === 'novels' ? 'Novels' : 'Manga'

  function open(item: any) {
    const name = item.title || item.name || String(item.id)
    setSelectedMedia({
      id: item.id || item.mal_id || name,
      type: kind === 'comics' ? 'comics' : kind === 'novels' ? 'novel' : 'manga',
      title: name,
      poster_path: item.poster_path || item.image,
      overview: item.overview,
    } as any)
    setCurrentPage('manga-detail')
  }

  useEffect(() => {
    let live = true
    setPopular([])
    setPublishing([])
    setRanks({})
    setGenres({})

    ;(async () => {
      if (kind === 'comics') {
        const names = ['Marvel comics', 'DC comics', 'Spider-Man comic', 'Batman comic', 'X-Men comic', 'Watchmen']
        const bags = await Promise.all(names.map((q) => openLibrary(q).catch(() => [])))
        if (!live) return
        const extra: Record<string, any[]> = {}
        names.forEach((q, i) => { extra[q] = bags[i] })
        setRanks(extra)
        setPopular(bags.flat().slice(0, 30))
        return
      }

      if (kind === 'novels') {
        const novels = await mal.ranking('novels', 50).catch(() => [])
        if (!live) return
        setPopular(novels)
        setRanks({ Novels: novels })
        const more = ['Overlord', 'Re:Zero', 'Mushoku Tensei', 'Spice and Wolf']
        for (const q of more) {
          const list = await mal.search(q).catch(() => [])
          if (!live) return
          setRanks((prev) => ({ ...prev, [q]: list }))
          await sleep(250)
        }
        return
      }

      const [all, publishingNow] = await Promise.all([
        mal.ranking('all', 100).catch(() => []),
        mal.publishing().catch(() => []),
      ])
      if (!live) return
      setPopular(all.filter((x) => x.poster_path || x.image))
      setPublishing(publishingNow.filter((x) => x.poster_path || x.image))

      for (const rank of MAL_RANKS.filter((r) => r.id !== 'all')) {
        const list = await mal.ranking(rank.id, 50).catch(() => [])
        if (!live) return
        setRanks((prev) => ({ ...prev, [rank.name]: list.filter((x) => x.poster_path || x.image) }))
        await sleep(200)
      }

      for (const g of MAL_GENRES) {
        const list = await mal.genre(g.id).catch(() => [])
        if (!live) return
        setGenres((prev) => ({ ...prev, [g.id]: list.filter((x) => x.poster_path || x.image) }))
        await sleep(350)
      }
    })()

    return () => { live = false }
  }, [kind])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0] || publishing[0]} kicker={title.toUpperCase()} onPlay={() => (popular[0] || publishing[0]) && open(popular[0] || publishing[0])} />
      <div className="board-content px-6 pt-6">
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={open} />
        {kind === 'manga' && <MediaShelf title="Publishing now" items={publishing} onOpen={open} />}
        {Object.entries(ranks).map(([name, list]) => (
          <MediaShelf key={name} title={name} items={list} onOpen={open} />
        ))}
        {kind === 'manga' && MAL_GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={genres[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
