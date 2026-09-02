import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { jikan } from '../api/jikan'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const title = kind === 'comics' ? 'Comics' : 'Manga'
  const queries = kind === 'comics'
    ? ['Marvel', 'DC Comics', 'Spider-Man', 'Batman', 'X-Men', 'Avengers']
    : ['One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen', 'Dragon Ball']

  function open(item: any) {
    const name = item.title?.english || item.title?.romaji || item.title || item.name || String(item.id)
    setSelectedMedia({ id: item.id || name, type: kind, title: name } as any)
    setCurrentPage('manga-detail')
  }

  useEffect(() => {
    ;(async () => {
      const bag: any[] = []
      for (const q of queries) {
        const d = await tmdb.searchMulti(q).catch(() => ({ results: [] }))
        bag.push(...(d?.results || []).filter((r: any) => r.poster_path))
      }
      const seen = new Set()
      const uniq = bag.filter((x) => !seen.has(x.id) && seen.add(x.id))
      setPopular(uniq)
      try {
        const j = kind === 'comics' ? await jikan.searchManga('marvel', 1) : await jikan.topManga(1)
        if (j.length) setPopular((prev) => prev.length ? prev : j)
      } catch {}
      const extra: Record<string, any[]> = {}
      for (const q of queries) {
        extra[q] = (await tmdb.searchMulti(q).catch(() => ({ results: [] })))?.results?.filter((r: any) => r.poster_path) || []
      }
      setRows(extra)
    })()
  }, [kind])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0]} kicker={title.toUpperCase()} onPlay={() => popular[0] && open(popular[0])} />
      <div className="board-content px-6 pt-6">
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={open} />
        {queries.map((g) => (
          <MediaShelf key={g} title={g} items={rows[g] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
