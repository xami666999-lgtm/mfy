import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { PosterTile } from '../components/PosterTile'
import { watchPercent } from '../lib/watchProgress'

export type ShelfQuery = {
  title: string
  media: 'movie' | 'tv'
  mode?: 'discover' | 'trending' | 'studio'
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
  const [tab, setTab] = useState<'movie' | 'tv'>(query?.media || 'movie')

  useEffect(() => {
    if (!query) { setLoading(false); return }
    let dead = false
    setLoading(true)
    const media = query.mode === 'studio' ? tab : query.media
    const run = query.mode === 'trending'
      ? tmdb.getTrending(media, 'week')
      : (media === 'tv' ? tmdb.discoverTV : tmdb.discoverMovies)(query.params || {})
    Promise.all([
      run,
      media === 'tv' ? tmdb.getTVGenres() : tmdb.getMovieGenres(),
    ]).then(([d, g]) => {
      if (dead) return
      const rows = (d?.results || []).filter((x: any) => x.poster_path)
      rows.sort((a: any, b: any) => String(a.release_date || a.first_air_date || '').localeCompare(String(b.release_date || b.first_air_date || '')))
      setItems(rows)
      const map: Record<number, string> = {}
      for (const row of g?.genres || []) map[row.id] = row.name
      setGenres(map)
    }).catch(() => { if (!dead) setItems([]) }).finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [query?.title, query?.media, query?.mode, tab])

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
      <div className="px-6 pt-4">
        <p className="text-[11px] tracking-[0.16em] text-white/40 mb-2">WATCH ORDER</p>
        <p className="text-sm text-white/75 max-w-2xl mb-4">{query?.mode === 'studio' ? `Everything from ${query.title}, oldest first. Pick movies or shows.` : query?.title}</p>
      </div>
      <h1>{query?.title || 'Browse'}</h1>
      {query?.mode === 'studio' && (
        <div className="flex gap-2 mb-4">
          {(['movie', 'tv'] as const).map((kind) => (
            <button key={kind} type="button" className={tab === kind ? 'bg-white text-black' : 'bg-white/10 text-white'} style={{ height: 34, padding: '0 14px', borderRadius: 999 }} onClick={() => setTab(kind)}>{kind === 'movie' ? 'Movies' : 'Shows'}</button>
          ))}
        </div>
      )}
      {loading && <p className="shelf-empty">Loading…</p>}
      {!loading && items.length === 0 && <p className="shelf-empty">Nothing in this shelf yet.</p>}
      <div className="shelf-grid">
        {items.map((item, i) => {
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
              mediaId={item.id}
              item={item}
              pct={Number.isFinite(pct) ? pct : 0}
              rank={query?.mode === 'trending' && i < 20 ? i + 1 : 0}
              onClick={() => open(item)}
            />
          )
        })}
      </div>
    </div>
  )
}
