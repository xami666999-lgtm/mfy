import { useEffect, useState } from 'react'
import { anilist } from '../api/anilist'
import { openAnime } from '../api/animeOpen'
import { useStore } from '../store'
import { CategoryChips, HeroBanner, PosterShelf, type ShelfItem } from '../components/ShelfHome'

const GENRES = ['Popular', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']

function cards(media: any[]): ShelfItem[] {
  return (media || []).map((m) => ({
    id: m.id,
    title: m.title?.english || m.title?.romaji || m.title || 'Anime',
    image: m.coverImage?.large || m.coverImage?.medium || m.image,
    backdrop: m.bannerImage,
    sub: (m.genres || []).slice?.(0, 2)?.join?.(' · '),
    raw: m,
  })) as any
}

export default function Anime() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [chip, setChip] = useState('Popular')
  const [popular, setPopular] = useState<ShelfItem[]>([])
  const [rows, setRows] = useState<Record<string, ShelfItem[]>>({})

  function open(item: ShelfItem) {
    openAnime((item as any).raw || item, (id, type) => {
      setSelectedMedia({ id, type })
      setCurrentPage('detail')
    })
  }

  useEffect(() => {
    ;(async () => {
      const local = await fetch('./data/anime.json').then((r) => r.json()).catch(() => ({ anime: [] }))
      if (local.anime?.length) setPopular(cards(local.anime))
      try {
        const p = await anilist.getPopular('ANIME', 1, 30)
        if (p?.media?.length) setPopular(cards(p.media))
      } catch {}
      const extra: Record<string, ShelfItem[]> = {}
      for (const g of GENRES.filter((x) => x !== 'Popular').slice(0, 8)) {
        try {
          extra[g] = cards((await anilist.getByGenre(g, 'ANIME', 1, 16)).media)
        } catch {
          extra[g] = []
        }
      }
      setRows(extra)
    })()
  }, [])

  const shown = chip === 'Popular' ? popular : (rows[chip] || popular)

  return (
    <div className="page-fade-enter pb-10">
      <HeroBanner item={shown[0]} kicker="ANIME" onPlay={() => shown[0] && open(shown[0])} />
      <div className="px-5 pt-5">
        <h1 className="text-2xl font-bold text-white">Anime</h1>
        <p className="text-xs text-white/35 mb-3">Same layout as Home · AniList</p>
      </div>
      <CategoryChips labels={GENRES} active={chip} onPick={setChip} />
      <PosterShelf title={chip} items={shown} onOpen={open} />
      {chip === 'Popular' && Object.entries(rows).map(([name, items]) => (
        <PosterShelf key={name} title={name} items={items} onOpen={open} />
      ))}
    </div>
  )
}
