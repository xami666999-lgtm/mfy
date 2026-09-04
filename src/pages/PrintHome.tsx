import { useEffect, useState } from 'react'
import { jikan } from '../api/jikan'
import { anilist } from '../api/anilist'
import { fireflyManga } from '../api/fireflyManga'
import { OFFLINE_MANGA, OFFLINE_COMICS, OFFLINE_BOOKS } from '../data/offlineCatalog'
import { useStore } from '../store'

function offlineCards() {
  return (OFFLINE_MANGA || []).map((m: any) => ({
    ...m,
    image: m.coverImage || m.image,
    poster_path: m.coverImage || m.image,
    media_type: 'manga',
  }))
}

function offlineComics() {
  return (OFFLINE_COMICS || []).map((m: any) => ({
    ...m,
    image: m.image,
    poster_path: m.poster_path || m.image,
    media_type: 'comics',
  }))
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
import { MediaShelf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function aniCard(m: any) {
  return {
    id: m.id,
    title: m.title?.english || m.title?.romaji || m.title,
    name: m.title?.english || m.title?.romaji,
    coverImage: m.coverImage,
    image: m.coverImage?.large || m.coverImage?.medium,
    poster_path: m.coverImage?.large || m.coverImage?.medium,
    overview: m.description,
    averageScore: m.averageScore,
    score: m.averageScore ? m.averageScore/10 : 0,
    media_type: 'manga',
  }
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' | 'novels' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(kind === 'comics' ? offlineComics() : offlineCards())
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const title = kind === 'comics' ? 'Comics' : kind === 'novels' ? 'Novels' : 'Manga'

  function open(item: any) {
    const name = item.title?.english || item.title?.romaji || item.title || item.name || String(item.id)
    setSelectedMedia({
      id: item.id || item.mal_id || name,
      type: kind === 'comics' ? 'comics' : kind === 'novels' ? 'novel' : 'manga',
      title: name,
      poster_path: item.poster_path || item.image || (typeof item.coverImage === 'string' ? item.coverImage : item.coverImage?.large),
      overview: item.overview || item.description,
    } as any)
    setCurrentPage('manga-detail')
  }

  useEffect(() => {
    let live = true
    ;(async () => {
      if (kind === 'novels') {
        const seed = (OFFLINE_BOOKS || []).map((b: any) => ({ ...b, poster_path: b.image, media_type: 'novel' }))
        setPopular(seed)
        const [novels, light] = await Promise.all([
          jikan.topByType('novel', 1).catch(() => []),
          jikan.topByType('lightnovel', 1).catch(() => []),
        ])
        if (!live) return
        const extra: Record<string, any[]> = { Novels: novels.length ? novels : seed, 'Light novels': light }
        const names = ['Overlord', 'Re:Zero', 'Mushoku Tensei', 'Classroom of the Elite', 'Spice and Wolf', 'Monogatari']
        for (const q of names) {
          extra[q] = await jikan.searchManga(q, 1).catch(() => [])
          await sleep(350)
          if (!live) return
          setRows({ ...extra })
        }
        setPopular((novels.length ? novels : light).filter((x: any) => x.image || x.coverImage))
        setRows(extra)
        return
      }
      if (kind === 'comics') {
        setPopular(offlineComics())
        const names = ['Marvel comics', 'DC comics', 'Spider-Man comic', 'Batman comic', 'X-Men comic', 'Watchmen']
        const extra: Record<string, any[]> = { 'MFY comics': offlineComics() }
        const bags = await Promise.all(names.map((q) => openLibrary(q).catch(() => [])))
        names.forEach((q, i) => { extra[q] = bags[i] })
        const flat = bags.flat()
        if (!live) return
        setRows(extra)
        setPopular(flat.length ? flat.slice(0, 24) : offlineComics())
        return
      }
      const [top, ani, novels, light, ff] = await Promise.all([
        jikan.topManga(1).catch(() => []),
        anilist.getPopular('MANGA', 1, 40).then((p) => (p?.media || []).map(aniCard)).catch(() => []),
        jikan.topByType('novel', 1).catch(() => []),
        jikan.topByType('lightnovel', 1).catch(() => []),
        fireflyManga.latest().catch(() => []),
      ])
      if (!live) return
      const extra: Record<string, any[]> = {
        'Top manga': top.length ? top : offlineCards(),
        'AniList manga': ani,
        Novels: novels.length ? novels : (OFFLINE_BOOKS || []).map((b: any) => ({ ...b, poster_path: b.image, media_type: 'novel' })),
        'Light novels': light,
        'FireFly latest': ff,
      }
      const livePop = (top.length ? top : ani).filter((x: any) => x.image || x.coverImage || x.poster_path)
      setPopular(livePop.length ? livePop : offlineCards())
      setRows({ ...extra })
      const titles = ['One Piece', 'Naruto', 'Berserk', 'Vagabond', 'Chainsaw Man', 'Jujutsu Kaisen']
      for (const q of titles) {
        extra[q] = await jikan.searchManga(q, 1).catch(() => [])
        await sleep(350)
        if (!live) return
        setRows({ ...extra })
      }
      setRows(extra)
    })()
    return () => { live = false }
  }, [kind])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0]} kicker={title.toUpperCase()} onPlay={() => popular[0] && open(popular[0])} />
      <div className="board-content px-6 pt-6">
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={open} />
        {Object.entries(rows).map(([g, list]) => (
          <MediaShelf key={g} title={g} items={list} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
