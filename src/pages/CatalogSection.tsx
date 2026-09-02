import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { anilist } from '../api/anilist'
import { noutubeApi } from '../api/noutube'
import { useStore } from '../store'

type Kind = 'manga' | 'novels' | 'comics' | 'books' | 'youtube' | 'music'

type Card = { id: string; title: string; image?: string; sub?: string; videoId?: string; preview?: string }

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

async function invidiousTrending(): Promise<Card[]> {
  for (const base of INVIDIOUS) {
    try {
      const r = await fetch(`${base}/api/v1/trending?type=Music`, { signal: AbortSignal.timeout(6000) })
      if (!r.ok) continue
      const rows = await r.json()
      if (Array.isArray(rows) && rows.length) {
        return rows.slice(0, 40).map((v: any) => ({
          id: v.videoId,
          videoId: v.videoId,
          title: v.title,
          image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          sub: v.author,
        }))
      }
    } catch {}
  }
  return []
}

async function invidiousSearch(q: string): Promise<Card[]> {
  for (const base of INVIDIOUS) {
    try {
      const r = await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`, { signal: AbortSignal.timeout(6000) })
      if (!r.ok) continue
      const rows = await r.json()
      if (Array.isArray(rows) && rows.length) {
        return rows.filter((v: any) => v.videoId).slice(0, 40).map((v: any) => ({
          id: v.videoId,
          videoId: v.videoId,
          title: v.title,
          image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          sub: v.author,
        }))
      }
    } catch {}
  }
  return []
}

async function itunesSongs(term: string): Promise<Card[]> {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=36`)
  const d = await r.json()
  return (d.results || []).map((s: any) => ({
    id: String(s.trackId),
    title: s.trackName,
    image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    sub: s.artistName,
    preview: s.previewUrl,
  }))
}

async function openLibrary(q: string): Promise<Card[]> {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=36`)
  const d = await r.json()
  return (d.docs || []).filter((b: any) => b.cover_i).map((b: any) => ({
    id: String(b.key),
    title: b.title,
    image: `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg`,
    sub: (b.author_name || []).slice(0, 2).join(', '),
  }))
}

function aniCards(media: any[]): Card[] {
  return (media || []).map((m) => ({
    id: String(m.id),
    title: m.title?.english || m.title?.romaji || 'Untitled',
    image: m.coverImage?.large || m.coverImage?.medium,
    sub: (m.genres || []).slice(0, 2).join(' · ') || m.format,
  }))
}

export default function CatalogSection({ kind, title }: { kind: Kind; title: string }) {
  const { setCurrentPage, setCurrentStreamUrl } = useStore()
  const [items, setItems] = useState<Card[]>([])
  const [q, setQ] = useState('')
  const [chip, setChip] = useState('Popular')
  const [loading, setLoading] = useState(true)

  const chips =
    kind === 'comics' ? ['Popular', 'Marvel', 'DC', 'Image', 'Star Wars', 'Superhero', 'Horror', 'Sci-Fi', 'Indie']
      : kind === 'books' ? ['Bestsellers', 'Fantasy', 'Sci-Fi', 'Romance', 'Comics', 'Mystery', 'History']
      : kind === 'manga' || kind === 'novels' ? ['Popular', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller', 'Mecha']
      : kind === 'youtube' ? ['Trending', 'Music', 'Trailers', 'Anime']
      : ['Top songs', 'Pop', 'Hip-Hop', 'Rock', 'Anime']

  async function load(label = chip, query = q) {
    setLoading(true)
    try {
      if (kind === 'youtube') {
        if (query.trim()) setItems(await invidiousSearch(query))
        else {
          try {
            const n = await noutubeApi.getTrending(1)
            const vids = (n as any).videos || []
            if (vids.length) {
              setItems(vids.map((v: any) => ({
                id: v.videoId,
                videoId: v.videoId,
                title: v.title,
                image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                sub: v.author,
              })))
            } else setItems(await invidiousSearch(label === 'Trending' ? 'official trailer' : label))
          } catch {
            setItems(await invidiousSearch(label === 'Trending' ? 'official trailer' : label))
          }
        }
      } else if (kind === 'music') {
        setItems(await itunesSongs(query.trim() || label))
      } else if (kind === 'books') {
        setItems(await openLibrary(query.trim() || label))
      } else if (kind === 'comics') {
        const term = query.trim() || `${label} comic`
        const [ol, al] = await Promise.all([
          openLibrary(term).catch(() => []),
          anilist.search(term, 'MANGA', 1, 24).then((r) => aniCards(r.media)).catch(() => []),
        ])
        const more = await Promise.all([1, 2, 3, 4, 5].map((p) => anilist.search(term, 'MANGA', p, 50).then((r) => aniCards(r.media)).catch(() => [])))
        const ol2 = await Promise.all(['marvel comics', 'dc comics', 'image comics', term].map((t) => openLibrary(t).catch(() => [])))
        setItems([...al, ...more.flat(), ...ol, ...ol2.flat()].filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i).slice(0, 300))
      } else {
        const term = query.trim()
        if (term) setItems(aniCards((await anilist.search(term, 'MANGA', 1, 40)).media))
        else {
          const pages = await Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((p) => anilist.getPopular('MANGA', p, 50)))
          let media = pages.flatMap((p) => p.media)
          if (kind === 'novels') media = media.filter((m) => /NOVEL/i.test(m.format || ''))
          if (label !== 'Popular') {
            const extra = await anilist.search(label, 'MANGA', 1, 30)
            media = extra.media
          }
          setItems(aniCards(media))
        }
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(chip, '') }, [kind])

  function open(item: Card) {
    if (item.videoId) {
      setCurrentStreamUrl(`https://www.youtube.com/embed/${item.videoId}`)
      setCurrentPage('player')
      return
    }
    if (item.preview) {
      setCurrentStreamUrl(item.preview)
      setCurrentPage('player')
    }
  }

  const wide = kind === 'youtube' || kind === 'music'

  return (
    <div className="px-6 py-5 page-fade-enter">
      <h1 className="text-[28px] font-bold text-white tracking-tight">{title}</h1>
      <p className="text-xs text-white/35 mb-4">Live catalogs · posters from AniList, Open Library, iTunes, YouTube</p>

      <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); load(chip, q) }}>
        <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.07]">
          <Search className="w-4 h-4 text-white/30" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="flex-1 bg-transparent text-sm text-white outline-none" />
        </div>
        <button type="submit" className="h-11 px-4 rounded-xl bg-[#FF1493] text-white text-sm font-semibold">Search</button>
      </form>

      <div className="flex gap-2 mb-5 flex-wrap">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setChip(c); load(c, '') }}
            className={`h-8 px-3 rounded-full text-[11px] font-medium ${chip === c ? 'bg-[#FF1493] text-white' : 'bg-white/[0.05] text-white/45 hover:text-white/70'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-white/70 mb-3">{chip === 'Popular' ? 'Popular' : chip}</h2>
      {loading && <p className="text-sm text-white/30 mb-4">Loading…</p>}

      <div className={wide ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4'}>
        {items.map((item) => (
          <button key={item.id} type="button" className="text-left group" onClick={() => open(item)}>
            <div className={`rounded-xl overflow-hidden bg-[#12121a] border border-white/[0.06] ${wide ? 'aspect-video' : 'aspect-[2/3]'}`}>
              {item.image
                ? <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                : <div className="w-full h-full grid place-items-center text-white/25 text-xs p-2">{item.title}</div>}
            </div>
            <p className="text-[12px] text-white mt-2 truncate">{item.title}</p>
            {item.sub && <p className="text-[10px] text-white/40 truncate">{item.sub}</p>}
          </button>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <p className="text-sm mb-1">Nothing loaded</p>
          <p className="text-xs text-white/35">Try another chip or search.</p>
        </div>
      )}
    </div>
  )
}
