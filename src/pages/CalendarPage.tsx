import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

type Row = { id: number; title: string; date: string; type: 'movie' | 'tv'; poster?: string | null }

export default function CalendarPage() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [rows, setRows] = useState<Row[]>([])
  const [tab, setTab] = useState<'all' | 'movie' | 'tv' | 'anime'>('all')

  useEffect(() => {
    let live = true
    ;(async () => {
      const today = new Date().toISOString().slice(0, 10)
      const later = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().slice(0, 10)
      const [up, air, anime] = await Promise.all([
        tmdb.getUpcoming(),
        tmdb.discoverTV({ 'first_air_date.gte': today, 'first_air_date.lte': later, sort_by: 'first_air_date.asc' }),
        tmdb.discoverTV({
          with_keywords: '210024',
          'first_air_date.gte': today,
          'first_air_date.lte': later,
          sort_by: 'first_air_date.asc',
        }),
      ])
      const movies: Row[] = (up?.results || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.release_date,
        type: 'movie' as const,
        poster: m.poster_path,
      }))
      const shows: Row[] = (air?.results || []).map((m: any) => ({
        id: m.id,
        title: m.name,
        date: m.first_air_date,
        type: 'tv' as const,
        poster: m.poster_path,
      }))
      const animes: Row[] = (anime?.results || []).map((m: any) => ({
        id: m.id,
        title: m.name,
        date: m.first_air_date,
        type: 'tv' as const,
        poster: m.poster_path,
      }))
      const merged = [...movies, ...shows, ...animes]
        .filter((r) => r.date)
        .sort((a, b) => a.date.localeCompare(b.date))
      if (live) setRows(merged)
    })()
    return () => {
      live = false
    }
  }, [])

  const visible = rows.filter((r) => {
    if (tab === 'all') return true
    if (tab === 'movie') return r.type === 'movie'
    if (tab === 'tv') return r.type === 'tv'
    return r.type === 'tv'
  })

  return (
    <div className="px-8 py-8 pl-[320px]">
      <h1 className="font-display text-3xl font-bold mb-2">Calendar</h1>
      <p className="text-white/45 text-sm mb-6">Upcoming movies, shows and anime from TMDB.</p>
      <div className="flex gap-2 mb-6">
        {(['all', 'movie', 'tv', 'anime'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`h-9 px-4 rounded-full text-sm ${tab === t ? 'bg-white text-black font-semibold' : 'bg-white/10 text-white/70'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {visible.slice(0, 80).map((r) => (
          <button
            key={`${r.type}-${r.id}-${r.date}`}
            type="button"
            className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-left"
            onClick={() => {
              setSelectedMedia({ id: r.id, type: r.type } as any)
              setCurrentPage('detail')
            }}
          >
            <div className="w-10 h-14 rounded overflow-hidden bg-white/5 flex-shrink-0">
              {r.poster ? <img src={`${POSTER_URL}${r.poster}`} alt="" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{r.title}</div>
              <div className="text-[11px] text-white/40">
                {r.date} · {r.type === 'movie' ? 'Movie' : 'Show'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
