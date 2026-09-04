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

const NOVEL_SHELVES = ['Overlord', 'Re:Zero', 'Mushoku Tensei', 'Spice and Wolf', 'Classroom of the Elite', 'Monogatari', 'Ascendance of a Bookworm', 'The Apothecary Diaries']

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' | 'novels' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [tab, setTab] = useState<'manga' | 'novel'>(kind === 'novels' ? 'novel' : 'manga')
  const [popular, setPopular] = useState<any[]>([])
  const [publishing, setPublishing] = useState<any[]>([])
  const [ranks, setRanks] = useState<Record<string, any[]>>({})
  const [genres, setGenres] = useState<Record<number, any[]>>({})

  function open(item: any) {
    const name = item.title || item.name || String(item.id)
    const isNovel = tab === 'novel' || item.media_type === 'novel' || /novel/i.test(String(item.mal_type || ''))
    setSelectedMedia({
      id: item.id || item.mal_id || name,
      type: kind === 'comics' ? 'comics' : isNovel ? 'novel' : 'manga',
      title: name,
      poster_path: item.poster_path || item.image,
      overview: item.overview,
    } as any)
    setCurrentPage('manga-detail')
  }

  useEffect(() => {
    if (kind === 'novels') setTab('novel')
    if (kind === 'manga') setTab('manga')
  }, [kind])

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

      if (tab === 'novel') {
        const [novels, light] = await Promise.all([
          mal.ranking('novels', 100).catch(() => []),
          mal.byFormat('lightnovel').catch(() => []),
        ])
        if (!live) return
        const clean = (list: any[]) => list.filter((x) => x.poster_path || x.image)
        setPopular(clean(novels.length ? novels : light))
        setRanks({
          Novels: clean(novels),
          'Light novels': clean(light),
        })
        for (const q of NOVEL_SHELVES) {
          const list = clean(await mal.search(q).catch(() => []))
          if (!live) return
          setRanks((prev) => ({ ...prev, [q]: list }))
          await sleep(220)
        }
        for (const g of MAL_GENRES) {
          const list = clean(await mal.genreFormat(g.id, 'novel').catch(() => []))
          if (!live) return
          setGenres((prev) => ({ ...prev, [g.id]: list }))
          await sleep(350)
        }
        return
      }

      const [all, publishingNow, series] = await Promise.all([
        mal.ranking('all', 100).catch(() => []),
        mal.publishing().catch(() => []),
        mal.ranking('manga', 100).catch(() => []),
      ])
      if (!live) return
      const clean = (list: any[]) => list.filter((x) => x.poster_path || x.image)
      setPopular(clean(all.length ? all : series))
      setPublishing(clean(publishingNow))
      setRanks({ 'Manga series': clean(series) })

      for (const rank of MAL_RANKS.filter((r) => !['all', 'novels'].includes(r.id))) {
        const list = clean(await mal.ranking(rank.id, 50).catch(() => []))
        if (!live) return
        setRanks((prev) => ({ ...prev, [rank.name]: list }))
        await sleep(180)
      }

      for (const g of MAL_GENRES) {
        const list = clean(await mal.genre(g.id).catch(() => []))
        if (!live) return
        setGenres((prev) => ({ ...prev, [g.id]: list }))
        await sleep(320)
      }
    })()

    return () => { live = false }
  }, [kind, tab])

  const kicker = kind === 'comics' ? 'COMICS' : tab === 'novel' ? 'NOVELS' : 'MANGA'
  const hero = popular[0] || publishing[0]

  return (
    <div className="board page-fade-enter">
      <PageHero item={hero} kicker={kicker} onPlay={() => hero && open(hero)} />
      <div className="board-content px-6 pt-6">
        {kind !== 'comics' && (
          <div className="flex items-center gap-2 mb-6">
            {(['manga', 'novel'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`h-9 px-5 rounded-full text-xs font-bold tracking-wide ${tab === t ? 'bg-[#FF1493] text-white' : 'bg-white/10 text-white/60'}`}
              >
                {t === 'manga' ? 'Manga' : 'Novels'}
              </button>
            ))}
          </div>
        )}
        <MediaShelf title={tab === 'novel' ? 'Popular novels' : kind === 'comics' ? 'Popular comics' : 'Popular manga'} items={popular} onOpen={open} />
        {tab === 'manga' && kind !== 'comics' && <MediaShelf title="Publishing now" items={publishing} onOpen={open} />}
        {Object.entries(ranks).map(([name, list]) => (
          <MediaShelf key={name} title={name} items={list} onOpen={open} />
        ))}
        {kind !== 'comics' && MAL_GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={genres[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
