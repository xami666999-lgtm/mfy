import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'
import { MediaShelf, titleOf } from '../components/MediaShelf'
import PageHero from '../components/PageHero'
import { OFFLINE_MANGA } from '../data/offlineCatalog'

async function viaElectron(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url)
    if (r?.ok && r.json) return r.json
  }
  const res = await fetch(url)
  return res.json()
}

async function openLib(q: string) {
  try {
    const d = await viaElectron(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24`)
    return (d.docs || []).filter((m: any) => m.cover_i).map((m: any) => ({
      id: m.key,
      title: m.title,
      poster_path: null,
      image: `https://covers.openlibrary.org/b/id/${m.cover_i}-L.jpg`,
    }))
  } catch {
    return []
  }
}

async function tmdbPosters(items: any[]) {
  const out = []
  for (const item of items) {
    const name = titleOf(item)
    try {
      const d = await tmdb.searchMulti(name)
      const hit = (d?.results || []).find((r: any) => r.poster_path)
      if (hit?.poster_path) out.push({ ...item, poster_path: hit.poster_path, id: hit.id || item.id, media_type: hit.media_type })
      else out.push(item)
    } catch {
      out.push(item)
    }
  }
  return out
}

export default function PrintHome({ kind }: { kind: 'manga' | 'comics' }) {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [popular, setPopular] = useState<any[]>(OFFLINE_MANGA || [])
  const [rows, setRows] = useState<Record<string, any[]>>({})
  const genres = kind === 'comics' ? ['Marvel', 'DC', 'Image', 'Star Wars'] : ['Action', 'Fantasy', 'Romance', 'Horror']
  const title = kind === 'comics' ? 'Comics' : 'Manga'

  function open(item: any) {
    if (item.poster_path && item.id && typeof item.id === 'number') {
      setSelectedMedia({ id: item.id, type: item.media_type === 'movie' ? 'movie' : 'tv' })
      setCurrentPage('detail')
    }
  }

  useEffect(() => {
    ;(async () => {
      const seeded = await tmdbPosters(OFFLINE_MANGA || [])
      if (seeded.length) setPopular(seeded)
      try {
        if (kind === 'comics') {
          const ol = await openLib('marvel dc comic')
          if (ol.length) setPopular(ol)
        } else {
          const p = await anilist.getPopular('MANGA', 1, 40)
          if (p?.media?.length) {
            const mapped = p.media.map((m: any) => ({
              ...m,
              image: m.coverImage?.large || m.coverImage?.medium,
            }))
            setPopular(mapped)
          }
        }
      } catch {}
      const extra: Record<string, any[]> = {}
      for (const g of genres) {
        extra[g] = kind === 'comics' ? await openLib(`${g} comic`) : ((await anilist.search(g, 'MANGA', 1, 16).catch(() => ({ media: [] }))).media || []).map((m: any) => ({ ...m, image: m.coverImage?.large }))
      }
      setRows(extra)
    })()
  }, [kind])

  return (
    <div className="board page-fade-enter">
      <PageHero item={popular[0]} kicker={title.toUpperCase()} onPlay={() => popular[0] && open(popular[0])} />
      <div className="board-content px-6 pt-6">
        <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
        <MediaShelf title={`Popular ${title}`} items={popular} onOpen={open} />
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3 mb-8">
          {popular.map((item: any, i: number) => (
            <button key={i} type="button" className="poster-card" onClick={() => open(item)}>
              {item.poster_path ? (
                <img src={`${POSTER_URL}${item.poster_path}`} alt="" referrerPolicy="no-referrer" />
              ) : item.image ? (
                <img src={item.image} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="poster-fallback">{titleOf(item)}</div>
              )}
              <div className="poster-overlay"><div className="poster-meta-title">{titleOf(item)}</div></div>
            </button>
          ))}
        </div>
        {genres.map((g) => (
          <MediaShelf key={g} title={g} items={rows[g] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
