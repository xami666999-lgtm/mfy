import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { PosterTile } from '../components/PosterTile'
import { watchPercent } from '../lib/watchProgress'

export type ShelfQuery = {
  title: string
  media: 'movie' | 'tv'
  mode?: 'discover' | 'trending'
  params?: Record<string, string>
}

export function readShelf(): ShelfQuery | null {
  try {
    const raw = sessionStorage.getItem('mfy-shelf')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function ShelfBrowse() {
  const { setCurrentPage, setSelectedMedia, watchHistory } = useStore()
  const query = readShelf()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [genres, setGenres] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!query) { setLoading(false); return }
    let dead = false
    setLoading(true)
    const run = query.mode === 'trending'
      ? tmdb.getTrending(query.media, 'week')
      : (query.media === 'tv' ? tmdb.discoverTV : tmdb.discoverMovies)(query.params || {})
    Promise.all([
      run,
      query.media === 'tv' ? tmdb.getTVGenres() : tmdb.getMovieGenres(),
    ]).then(([d, g]) => {
      if (dead) return
      setItems((d?.results || []).filter((x: any) => x.poster_path))
      const map: Record<number, string> = {}
      for (const row of g?.genres || []) map[row.id] = row.name
      setGenres(map)
    }).catch(() => { if (!dead) setItems([]) }).finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [query?.title, query?.media])

  function open(item: any) {
    const type = item.media_type === 'tv' || query?.media === 'tv' || item.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type, title: item.title || item.name } as any)
    setCurrentPage('detail')
  }

  return (
    <div className="nv-page shelf-page">
      <button type="button" className="shelf-back" onClick={() => setCurrentPage('home')}>
        <ArrowLeft size={16} /> Home
      </button>
      <h1>{query?.title || 'Browse'}</h1>
      {loading && <p className="shelf-empty">Loading…</p>}
      {!loading && items.length === 0 && <p className="shelf-empty">Nothing in this shelf yet.</p>}
      <div className="shelf-grid">
        {items.map((item) => {
          const pct = Math.max(0, ...((watchHistory || []).filter((h) => String(h.mediaId) === String(item.id)).map((h) => watchPercent(h))))
          const gid = item.genre_ids?.[0]
          return (
            <PosterTile
              key={item.id}
              poster={item.poster_path}
              title={item.title || item.name || ''}
              genre={gid ? genres[gid] : ''}
              score={item.vote_average}
              year={String(item.release_date || item.first_air_date || '').slice(0, 4)}
              pct={Number.isFinite(pct) ? pct : 0}
              onClick={() => open(item)}
            />
          )
        })}
      </div>
    </div>
  )
}
