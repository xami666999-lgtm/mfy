import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarX } from 'lucide-react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { jikan } from '../api/jikan'
import { useStore } from '../store'

type Rel = {
  id: number
  title: string
  date: string
  poster: string
  type: 'movie' | 'tv'
  anime?: boolean
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Upcoming() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const now = new Date()
  const [y, setY] = useState(now.getFullYear())
  const [m, setM] = useState(now.getMonth())
  const [sel, setSel] = useState(ymd(now))
  const [items, setItems] = useState<Rel[]>([])

  useEffect(() => {
    let live = true
    const from = new Date(y, m - 1, 1).toISOString().slice(0, 10)
    const to = new Date(y, m + 2, 0).toISOString().slice(0, 10)
    Promise.all([
      tmdb.discoverMovies({ sort_by: 'primary_release_date.asc', 'primary_release_date.gte': from, 'primary_release_date.lte': to, page: '1' }).catch(() => ({ results: [] })),
      tmdb.getUpcoming().catch(() => ({ results: [] })),
      tmdb.discoverTV({ sort_by: 'first_air_date.asc', 'first_air_date.gte': from, 'first_air_date.lte': to, page: '1' }).catch(() => ({ results: [] })),
      tmdb.discoverTV({ with_genres: '16', with_origin_country: 'JP', sort_by: 'first_air_date.asc', 'first_air_date.gte': from, page: '1' }).catch(() => ({ results: [] })),
      jikan.seasonUpcoming().catch(() => []),
    ]).then(([mv, up, tv, an, jk]) => {
      if (!live) return
      const out: Rel[] = []
      const push = (r: any, type: 'movie' | 'tv', anime = false) => {
        const date = String(r.release_date || r.first_air_date || '').slice(0, 10)
        if (!date || !r.id) return
        out.push({
          id: r.id,
          title: r.title || r.name,
          date,
          poster: r.poster_path ? `${POSTER_URL}${r.poster_path}` : (r.image || ''),
          type,
          anime,
        })
      }
      for (const r of mv?.results || []) push(r, 'movie')
      for (const r of up?.results || []) push(r, 'movie')
      for (const r of tv?.results || []) push(r, 'tv')
      for (const r of an?.results || []) push(r, 'tv', true)
      for (const r of jk || []) {
        const date = String(r.aired || r.date || '').slice(0, 10)
        out.push({ id: r.id, title: r.title, date: date || `${y}-${String(m + 1).padStart(2, '0')}-15`, poster: r.image || '', type: 'tv', anime: true })
      }
      const seen = new Set<string>()
      setItems(out.filter((x) => {
        const k = `${x.type}-${x.id}-${x.date}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      }))
    })
    return () => { live = false }
  }, [y, m])

  const byDay = useMemo(() => {
    const map: Record<string, Rel[]> = {}
    for (const it of items) (map[it.date] ||= []).push(it)
    return map
  }, [items])

  const first = new Date(y, m, 1)
  const startWeek = first.getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(startWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const selected = byDay[sel] || []
  const selDate = new Date(sel + 'T12:00:00')
  const today = ymd(now)
  const monthLabel = first.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  function open(it: Rel) {
    setSelectedMedia({ id: it.id, type: it.type, title: it.title, isAnime: it.anime } as any)
    setCurrentPage('detail')
  }
  function goToday() {
    setY(now.getFullYear()); setM(now.getMonth()); setSel(today)
  }
  function nextRelease() {
    const all = Object.keys(byDay).sort()
    const hit = all.find((d) => d >= today) || all[0]
    if (!hit) return
    const dt = new Date(hit + 'T12:00:00')
    setY(dt.getFullYear()); setM(dt.getMonth()); setSel(hit)
  }

  return (
    <div className="page-fade-enter min-h-full bg-[#0b0b0d] text-white px-8 py-6">
      <div className="flex items-start gap-10">
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-semibold mb-5">Calendar</h1>
          <div className="flex items-center gap-3 mb-5">
            <button type="button" className="w-9 h-9 rounded-full border border-white/15 grid place-items-center hover:bg-white/10" onClick={() => { const d = new Date(y, m - 1, 1); setY(d.getFullYear()); setM(d.getMonth()) }}><ChevronLeft size={16} /></button>
            <span className="text-lg font-medium w-48 text-center">{monthLabel}</span>
            <button type="button" className="w-9 h-9 rounded-full border border-white/15 grid place-items-center hover:bg-white/10" onClick={() => { const d = new Date(y, m + 1, 1); setY(d.getFullYear()); setM(d.getMonth()) }}><ChevronRight size={16} /></button>
            <button type="button" className="h-8 px-3 rounded-full border border-white/15 text-sm hover:bg-white/10" onClick={goToday}>Today</button>
          </div>
          <div className="grid grid-cols-7 gap-2 text-[11px] text-white/35 mb-2 px-1">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />
              const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const list = byDay[key] || []
              const active = sel === key
              const isToday = key === today
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSel(key)}
                  className={`relative h-[86px] rounded-xl text-left p-1.5 overflow-hidden ${active ? 'ring-2 ring-white' : ''}`}
                  style={{ background: active ? '#1c1c22' : '#141418' }}
                >
                  <span className={`text-xs ${isToday ? 'inline-flex w-5 h-5 rounded-full bg-white text-black items-center justify-center font-semibold' : 'text-white/70'}`}>{day}</span>
                  {list[0]?.poster && (
                    <img src={list[0].poster} alt="" className="absolute right-1 bottom-1 w-8 h-11 object-cover rounded-sm opacity-90" />
                  )}
                  {list.length > 1 && <span className="absolute left-1.5 bottom-1 text-[9px] text-white/50">+{list.length - 1}</span>}
                </button>
              )
            })}
          </div>
        </div>
        <aside className="w-[340px] flex-shrink-0 pt-2">
          <p className="text-[11px] tracking-[0.18em] text-white/35 text-right mb-6">UPCOMING</p>
          <h2 className="text-2xl font-semibold">{selDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <p className="text-[11px] tracking-[0.14em] text-white/40 mt-1 mb-5">
            {sel === today ? 'TODAY' : ''}{selected.length ? `${sel === today ? ' · ' : ''}${selected.length} RELEASE${selected.length === 1 ? '' : 'S'}` : ''}
          </p>
          {selected.length === 0 ? (
            <div className="pt-10 text-center text-white/50">
              <CalendarX size={42} className="mx-auto mb-4 opacity-40" />
              <p className="font-medium text-white/80">No releases on this day</p>
              <p className="text-sm mt-1 mb-5">Move across the calendar to find the next release.</p>
              <button type="button" onClick={nextRelease} className="h-10 px-4 rounded-full border border-white/20 text-sm hover:bg-white/10">Go to next release</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {selected.map((it) => (
                <button key={`${it.type}-${it.id}`} type="button" onClick={() => open(it)} className="w-[120px] text-left">
                  {it.poster ? <img src={it.poster} alt="" className="w-[120px] h-[178px] object-cover rounded-lg mb-2" /> : <div className="w-[120px] h-[178px] rounded-lg bg-white/10 mb-2" />}
                  <p className="text-sm truncate">{it.title}</p>
                  <p className="text-[11px] text-white/40">{it.anime ? 'Anime' : it.type === 'movie' ? 'Movie' : 'Series'}</p>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
