import { useEffect, useState } from 'react'
import { jikan } from '../api/jikan'
import { anilist } from '../api/anilist'
import { fireflyManga } from '../api/fireflyManga'
import { useStore } from '../store'
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
    image: m.coverImage?.large,
    overview: m.description,
    averageScore: m.averageScore,
    score: m.averageScore ? m.averageScore/10 : 0,
    media_type: 'manga',
  }
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' | 'novels' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const title = kind === 'comics' ? 'Comics' : kind === 'novels' ? 'Novels' : 'Manga'

  function open(item: any) {
    const name = item.title?.english || item.title?.romaji || item.title || item.name || String(item.id)
    setSelectedMedia({ id: item.id || name, type: 'manga', title: name } as any)
    setCurrentPage('manga-detail')
  }

  useEffect(() => {
    let live = true
    ;(async () => {
      if (kind === 'novels') {
        const [novels, light] = await Promise.all([
          jikan.topByType('novel', 1).catch(() => []),
          jikan.topByType('lightnovel', 1).catch(() => []),
        ])
        if (!live) return
        const extra: Record<string, any[]> = { Novels: novels, 'Light novels': light }
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
        const names = ['Marvel', 'DC Comics', 'Spider-Man', 'Batman', 'One Punch', 'Berserk']
        const extra: Record<string, any[]> = {}
        for (const q of names) {
          extra[q] = await jikan.searchManga(q, 1).catch(() => [])
          await sleep(400)
        }
        if (!live) return
        setRows(extra)
        setPopular(Object.values(extra).flat().filter((x) => x.image).slice(0, 24))
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
        'Top manga': top,
        'AniList manga': ani,
        Novels: novels,
        'Light novels': light,
        'FireFly latest': ff,
      }
      setPopular((top.length ? top : ani).filter((x: any) => x.image || x.coverImage || x.poster_path))
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
