import { useEffect, useMemo, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

type Kind = 'movie' | 'tv'
type CalItem = {
  key: string
  id: number
  type: Kind
  title: string
  date: string
  poster?: string | null
  note: string
}

type View = 'month' | 'week' | 'day'

function iso(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
function startOfWeek(d: Date) {
  return addDays(d, -d.getDay())
}
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function rangeFor(view: View, cursor: Date) {
  if (view === 'day') return { start: cursor, end: cursor, cells: [cursor] }
  if (view === 'week') {
    const start = startOfWeek(cursor)
    return { start, end: addDays(start, 6), cells: Array.from({ length: 7 }, (_, i) => addDays(start, i)) }
  }
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  return { start: cells[0], end: cells[41], cells }
}

function labelFor(view: View, cursor: Date) {
  if (view === 'day') return cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (view === 'week') {
    const start = startOfWeek(cursor)
    const end = addDays(start, 6)
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export default function CalendarPage() {
  const { setSelectedMedia, setCurrentPage, watchlist, favorites, customLists, addToWatchlist, isInWatchlist, upsertHistory, currentProfile } = useStore()
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [when, setWhen] = useState<'all' | 'past' | 'today' | 'upcoming'>('all')
  const [globalRows, setGlobalRows] = useState<CalItem[]>([])
  const [personalRows, setPersonalRows] = useState<CalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [personalLoading, setPersonalLoading] = useState(false)
  const [picked, setPicked] = useState<CalItem | null>(null)
  const [msg, setMsg] = useState('')
  const [hideGlobal, setHideGlobal] = useState(() => {
    try { return localStorage.getItem('mfy-cal-hide-global') === '1' } catch { return false }
  })

  const today = iso(new Date())
  const range = useMemo(() => rangeFor(view, cursor), [view, cursor.getFullYear(), cursor.getMonth(), cursor.getDate()])

  useEffect(() => {
    const onStorage = () => {
      try { setHideGlobal(localStorage.getItem('mfy-cal-hide-global') === '1') } catch {}
    }
    window.addEventListener('focus', onStorage)
    return () => window.removeEventListener('focus', onStorage)
  }, [])

  useEffect(() => {
    if (hideGlobal) { setGlobalRows([]); setLoading(false); return }
    let dead = false
    setLoading(true)
    const start = iso(range.start)
    const end = iso(range.end)
    Promise.all([
      tmdb.discoverMovies({ 'primary_release_date.gte': start, 'primary_release_date.lte': end, sort_by: 'popularity.desc' }).catch(() => null),
      tmdb.discoverMovies({ 'primary_release_date.gte': start, 'primary_release_date.lte': end, sort_by: 'primary_release_date.asc', page: '2' }).catch(() => null),
      tmdb.discoverTV({ 'first_air_date.gte': start, 'first_air_date.lte': end, sort_by: 'popularity.desc' }).catch(() => null),
      tmdb.discoverTV({ with_genres: '16', with_original_language: 'ja', 'first_air_date.gte': start, 'first_air_date.lte': end, sort_by: 'popularity.desc' }).catch(() => null),
    ]).then(([m1, m2, tv, anime]) => {
      if (dead) return
      const movies: CalItem[] = [...(m1?.results || []), ...(m2?.results || [])].filter((m: any) => m.release_date).map((m: any) => ({
        key: `m-${m.id}-${m.release_date}`,
        id: m.id,
        type: 'movie' as const,
        title: m.title || m.name,
        date: m.release_date,
        poster: m.poster_path,
        note: 'Movie',
      }))
      const shows: CalItem[] = (tv?.results || []).filter((m: any) => m.first_air_date).map((m: any) => ({
        key: `t-${m.id}-${m.first_air_date}`,
        id: m.id,
        type: 'tv' as const,
        title: m.name || m.title,
        date: String(m.first_air_date),
        poster: m.poster_path,
        note: 'Series',
      }))
      const animes: CalItem[] = (anime?.results || []).filter((m: any) => m.first_air_date).map((m: any) => ({
        key: `a-${m.id}-${m.first_air_date}`,
        id: m.id,
        type: 'tv' as const,
        title: m.name || m.title,
        date: String(m.first_air_date),
        poster: m.poster_path,
        note: 'Anime',
      }))
      const seen = new Set<string>()
      const merged = [...movies, ...shows, ...animes].filter((r) => {
        if (!r.date || r.date < start || r.date > end || seen.has(r.key)) return false
        seen.add(r.key)
        return true
      })
      setGlobalRows(merged)
    }).finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [hideGlobal, range.start.getTime(), range.end.getTime()])

  useEffect(() => {
    const bag: { id: number; type: Kind; title: string; poster?: string | null }[] = []
    const push = (id: any, type: any, title: string, poster?: string | null) => {
      const n = Number(id)
      if (!n || (type !== 'movie' && type !== 'tv')) return
      if (bag.some((x) => x.id === n && x.type === type)) return
      bag.push({ id: n, type, title: title || 'Title', poster })
    }
    for (const w of watchlist || []) push(w.mediaId, w.mediaType, w.title, w.posterPath)
    for (const w of favorites || []) push(w.mediaId, w.mediaType, w.title, w.posterPath)
    for (const list of customLists || []) {
      for (const item of list.items || []) push(item.mediaId, item.mediaType, item.title || '', item.posterPath)
    }
    if (!bag.length) { setPersonalRows([]); return }
    let dead = false
    setPersonalLoading(true)
    Promise.all(bag.slice(0, 24).map(async (item) => {
      try {
        if (item.type === 'movie') {
          const d = await tmdb.getMovieDetail(item.id)
          const date = d?.release_date || ''
          if (!date) return []
          return [{
            key: `p-m-${item.id}-${date}`,
            id: item.id,
            type: 'movie' as const,
            title: d.title || item.title,
            date,
            poster: d.poster_path || item.poster,
            note: 'Movie release',
          }]
        }
        const d = await tmdb.getTVDetail(item.id)
        const out: CalItem[] = []
        const title = d?.name || item.title
        const poster = d?.poster_path || item.poster
        const next = d?.next_episode_to_air
        if (next?.air_date) {
          out.push({
            key: `p-n-${item.id}-${next.air_date}-${next.episode_number}`,
            id: item.id,
            type: 'tv',
            title,
            date: next.air_date,
            poster,
            note: `S${next.season_number}E${next.episode_number} ${next.name || ''}`.trim(),
          })
        }
        const last = d?.last_episode_to_air
        if (last?.air_date && last.air_date !== next?.air_date) {
          out.push({
            key: `p-l-${item.id}-${last.air_date}-${last.episode_number}`,
            id: item.id,
            type: 'tv',
            title,
            date: last.air_date,
            poster,
            note: `Aired S${last.season_number}E${last.episode_number}`,
          })
        }
        for (const season of d?.seasons || []) {
          if (!season?.air_date || season.season_number === 0) continue
          out.push({
            key: `p-s-${item.id}-${season.season_number}-${season.air_date}`,
            id: item.id,
            type: 'tv',
            title,
            date: season.air_date,
            poster,
            note: `${season.name || `Season ${season.season_number}`} premiere`,
          })
        }
        return out
      } catch { return [] }
    })).then((groups) => {
      if (dead) return
      const seen = new Set<string>()
      setPersonalRows(groups.flat().filter((r) => r.date && !seen.has(r.key) && seen.add(r.key)))
    }).finally(() => { if (!dead) setPersonalLoading(false) })
    return () => { dead = true }
  }, [watchlist, favorites, customLists])

  function shift(dir: number) {
    setCursor((c) => {
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() + dir, 1)
      if (view === 'week') return addDays(c, dir * 7)
      return addDays(c, dir)
    })
  }

  function keep(item: CalItem) {
    if (when === 'all') return true
    if (when === 'today') return item.date === today
    if (when === 'past') return item.date < today
    return item.date > today
  }

  function onDay(date: string, rows: CalItem[]) {
    return rows.filter((r) => r.date === date && keep(r)).slice(0, view === 'month' ? 3 : 8)
  }

  function openDetails(item: CalItem) {
    setPicked(null)
    setSelectedMedia({ id: item.id, type: item.type, title: item.title } as any)
    setCurrentPage('detail')
  }

  function addLibrary(item: CalItem) {
    if (isInWatchlist(item.id, item.type)) { setMsg('Already in your library.'); return }
    addToWatchlist({ mediaId: item.id, mediaType: item.type, title: item.title, posterPath: item.poster || null, addedAt: new Date().toISOString() })
    setMsg('Added to Library.')
  }

  function markWatched(item: CalItem) {
    upsertHistory({
      id: `cal-${item.id}-${item.date}`,
      mediaId: item.id,
      mediaType: item.type,
      title: item.title,
      posterPath: item.poster || null,
      progress: 7200,
      duration: 7200,
      watchedAt: new Date().toISOString(),
      profileId: currentProfile?.id || 'default',
      completed: true,
    })
    setMsg('Marked as watched.')
  }

  const personalInView = personalRows.filter((r) => r.date >= iso(range.start) && r.date <= iso(range.end))
  const upcomingPersonal = personalRows.filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8)

  return (
    <div className="cal-page">
      <header className="cal-head">
        <div>
          <h1>Calendar</h1>
          <p>{labelFor(view, cursor)}</p>
        </div>
        <div className="cal-tools">
          <div className="cal-views">
            {(['month', 'week', 'day'] as View[]).map((v) => (
              <button key={v} type="button" className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
          <div className="cal-nav">
            <button type="button" onClick={() => shift(-1)} aria-label="Previous">‹</button>
            <button type="button" onClick={() => setCursor(new Date())}>Today</button>
            <button type="button" onClick={() => shift(1)} aria-label="Next">›</button>
          </div>
          <div className="cal-views">
            {(['all', 'past', 'today', 'upcoming'] as const).map((w) => (
              <button key={w} type="button" className={when === w ? 'on' : ''} onClick={() => setWhen(w)}>{w}</button>
            ))}
          </div>
        </div>
      </header>

      {!hideGlobal && (
        <section className="cal-block">
          <h2>Global Release Calendar</h2>
          <p>Past, current, and upcoming movies, shows, and anime.</p>
          {loading && <p className="cal-empty">Loading releases…</p>}
          <CalendarGrid view={view} cells={range.cells} cursor={cursor} rows={globalRows} onDay={onDay} onPick={setPicked} />
        </section>
      )}

      <section className="cal-block">
        <h2>Personal Library Calendar</h2>
        <p>Releases and new episodes for titles in your Library, Watchlist, and collections.</p>
        {personalLoading && <p className="cal-empty">Checking your titles…</p>}
        {!personalLoading && personalRows.length === 0 && <p className="cal-empty">Save a movie or show and its release dates will land here.</p>}
        <CalendarGrid view={view} cells={range.cells} cursor={cursor} rows={personalInView} onDay={onDay} onPick={setPicked} />
        {upcomingPersonal.length > 0 && (
          <div className="cal-next">
            <h3>Coming up for you</h3>
            {upcomingPersonal.map((item) => (
              <button key={item.key} type="button" onClick={() => setPicked(item)}>
                {item.poster ? <img src={`${POSTER_URL}${item.poster}`} alt="" /> : <i />}
                <span><b>{item.title}</b><small>{item.date} · {item.note}</small></span>
              </button>
            ))}
          </div>
        )}
      </section>

      {picked && (
        <div className="cal-sheet-bg" onClick={() => { setPicked(null); setMsg('') }}>
          <div className="cal-sheet" onClick={(e) => e.stopPropagation()}>
            {picked.poster ? <img src={`${POSTER_URL}${picked.poster}`} alt="" /> : <i />}
            <div>
              <h3>{picked.title}</h3>
              <p>{picked.date} · {picked.note}</p>
              {msg && <p className="cal-msg">{msg}</p>}
              <div>
                <button type="button" onClick={() => addLibrary(picked)}>Add to Library</button>
                <button type="button" onClick={() => openDetails(picked)}>View details</button>
                <button type="button" onClick={() => markWatched(picked)}>Mark as Watched</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CalendarGrid({
  view, cells, cursor, rows, onDay, onPick,
}: {
  view: View
  cells: Date[]
  cursor: Date
  rows: CalItem[]
  onDay: (date: string, rows: CalItem[]) => CalItem[]
  onPick: (item: CalItem) => void
}) {
  const today = iso(new Date())
  return (
    <div className={`cal-grid ${view}`}>
      {view !== 'day' && ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
      {cells.map((day) => {
        const date = iso(day)
        const items = onDay(date, rows)
        const muted = view === 'month' && !sameMonth(day, cursor)
        return (
          <div key={date + view} className={`cal-cell${date === today ? ' today' : ''}${muted ? ' muted' : ''}`}>
            <b>{day.getDate()}</b>
            {items.map((item) => (
              <button key={item.key} type="button" onClick={() => onPick(item)}>
                {item.title}
                <small>{item.note}</small>
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
