import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { sportsApi, badgeFallbacks, watchfootyApi, wfSport, type SportMatch } from '../api/sports'
import { addonCatalog, addonStreams, ADDONS } from '../api/stremioAddons'
import { useStore } from '../store'

const ROWS = [
  { id: 'american-football', label: 'American Football - TV' },
  { id: 'basketball', label: 'Basketball - TV' },
  { id: 'baseball', label: 'Baseball - TV' },
  { id: 'football', label: 'Football - TV' },
  { id: 'hockey', label: 'Hockey - TV' },
  { id: 'fight', label: 'Fight - TV' },
  { id: 'motor-sports', label: 'Motor Sports - TV' },
  { id: 'tennis', label: 'Tennis - TV' },
]

const WASH = [
  'linear-gradient(115deg,#16344a 0%,#1c3d3a 100%)',
  'linear-gradient(115deg,#14362c 0%,#1e4a38 100%)',
  'linear-gradient(115deg,#3a2456 0%,#2a3058 100%)',
  'linear-gradient(115deg,#1a3344 0%,#1d4a34 100%)',
  'linear-gradient(115deg,#4a2238 0%,#3a1844 100%)',
  'linear-gradient(115deg,#1e2a4a 0%,#24324a 100%)',
]

const ESPN = [
  ['football', 'nfl'],
  ['football', 'college-football'],
  ['basketball', 'nba'],
  ['basketball', 'wnba'],
  ['baseball', 'mlb'],
  ['hockey', 'nhl'],
]

type Book = { score?: string; logo?: string }

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

function stamp(n: number) {
  if (!n) return 0
  return String(n).length < 13 ? n * 1000 : n
}

function dayLabel(n: number) {
  const t = stamp(n)
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()} ${d.toLocaleString('en-US', { month: 'long' })} ${d.getDate()}`
}

export default function Sports() {
  const { setCurrentStreamUrl, setCurrentPage, setSelectedMedia } = useStore()
  const [rows, setRows] = useState<Record<string, SportMatch[]>>({})
  const [book, setBook] = useState<Record<string, Book>>({})
  const [feeds, setFeeds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    let stop = false
    const catalogs = ['sports_live', 'sports_american_football', 'sports_basketball', 'sports_baseball', 'sports_football', 'sports_hockey']
    Promise.all(catalogs.map((id) => addonCatalog('sportsstreams', 'sport', id).catch(() => [])))
      .then((bags) => { if (!stop) setFeeds(bags.flat()) })
      .catch(() => {})
    Promise.all(ROWS.map(async (row) => {
      const [pop, all] = await Promise.all([
        sportsApi.getMatchesPopular(row.id).catch(() => [] as SportMatch[]),
        sportsApi.getMatches(row.id).catch(() => [] as SportMatch[]),
      ])
      const seen = new Set<string>()
      const list = [...(pop || []), ...(all || [])].filter((m) => {
        const id = String(m.id)
        if (seen.has(id)) return false
        seen.add(id)
        return true
      }).slice(0, 16)
      return [row.id, list] as const
    })).then((pairs) => {
      if (stop) return
      const next: Record<string, SportMatch[]> = {}
      pairs.forEach(([id, list]) => { next[id] = list })
      setRows(next)
    }).finally(() => { if (!stop) setLoading(false) })

    const next: Record<string, Book> = {}
    const put = (name: string, score?: string, logo?: string) => {
      const k = norm(name)
      if (!k) return
      next[k] = { score: score ?? next[k]?.score, logo: logo || next[k]?.logo }
    }
    Promise.all([
      ...ESPN.map(([sport, league]) => fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/scoreboard`).then((r) => r.json()).catch(() => null)),
      ...ROWS.map((row) => watchfootyApi.matches(wfSport(row.id)).catch(() => [])),
    ]).then((bags) => {
      if (stop) return
      bags.forEach((bag: any) => {
        const events = bag?.events
        if (Array.isArray(events)) {
          events.forEach((ev: any) => {
            const comps = ev?.competitions?.[0]?.competitors || []
            comps.forEach((c: any) => put(c?.team?.displayName || c?.team?.name, c?.score, c?.team?.logo))
          })
          return
        }
        const list = Array.isArray(bag) ? bag : []
        list.forEach((m: any) => {
          const home = m?.teams?.home
          const away = m?.teams?.away
          const hs = m?.scores?.home
          const as = m?.scores?.away
          if (home?.name) put(home.name, hs != null ? String(hs) : undefined, home.logoUrl ? `https://api.watchfooty.st${home.logoUrl}` : undefined)
          if (away?.name) put(away.name, as != null ? String(as) : undefined, away.logoUrl ? `https://api.watchfooty.st${away.logoUrl}` : undefined)
        })
      })
      setBook(next)
    }).catch(() => {})
    return () => { stop = true }
  }, [])

  async function play(match: SportMatch) {
    setErr('')
    setBusy(match.id)
    try {
      const home = norm(match.teams?.home?.name || match.title.split(/\s+vs\s+/i)[0] || '')
      const away = norm(match.teams?.away?.name || match.title.split(/\s+vs\s+/i)[1] || '')
      const words = (s: string) => s.split(' ').filter((w) => w.length > 3)
      const hit = feeds.find((e) => {
        const n = norm(e.title || e.name || '')
        const hw = words(home)
        const aw = words(away)
        return (hw.length ? hw.some((w) => n.includes(w)) : n.includes(home)) && (!aw.length || aw.some((w) => n.includes(w)))
      })
      let url = ''
      if (hit) {
        const list = await addonStreams(ADDONS.sportsstreams.base, 'sport', String(hit.stremioId || hit.id)).catch(() => [])
        const direct = list.find((r) => /^https?:/i.test(r.url) && /\.m3u8(\?|$)/i.test(r.url))
        const any = list.find((r) => /^https?:/i.test(r.url) && !/^magnet:/i.test(r.url))
        url = direct?.url || any?.url || ''
      }
      if (!url) {
        for (const s of match.sources || []) {
          const list = await sportsApi.getStreams(s.source, s.id).catch(() => [])
          const pick = list.find((x) => x.hd && x.embedUrl) || list.find((x) => x.embedUrl)
          if (pick?.embedUrl) { url = pick.embedUrl; break }
        }
      }
      if (!url && match.sources?.[0]) {
        const s = match.sources[0]
        url = `https://embed.st/embed/${s.source}/${s.id}/1`
      }
      if (!url) { setErr('No feed for this game yet.'); return }
      setSelectedMedia({ id: match.id, type: 'iptv', title: match.title, name: match.title } as any)
      setCurrentStreamUrl(url)
      setCurrentPage('player')
    } catch {
      setErr('Could not start that game.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="min-h-full bg-[#0b0b0b] text-white px-6 py-6">
      <h1 className="text-[22px] font-semibold mb-5">Sports</h1>
      {err && <p className="text-sm text-red-400 mb-3">{err}</p>}
      {loading && <p className="text-white/40 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading games…</p>}
      {ROWS.map((row) => {
        const list = rows[row.id] || []
        if (!list.length && !loading) return null
        return (
          <section key={row.id} className="mb-7">
            <h2 className="text-[15px] font-semibold mb-3">{row.label}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {list.map((m, i) => (
                <GameCard key={m.id} match={m} wash={WASH[i % WASH.length]} book={book} busy={busy === m.id} onPlay={() => play(m)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GameCard({ match, wash, book, busy, onPlay }: { match: SportMatch; wash: string; book: Record<string, Book>; busy: boolean; onPlay: () => void }) {
  const homeName = match.teams?.home?.name || match.title.split(/\s+vs\s+/i)[0] || match.title
  const awayName = match.teams?.away?.name || match.title.split(/\s+vs\s+/i)[1] || ''
  const home = book[norm(homeName)]
  const away = book[norm(awayName)]
  const when = stamp(match.date)
  const live = !!match.live || (when > 0 && when <= Date.now() + 15 * 60 * 1000 && Date.now() - when < 4 * 60 * 60 * 1000)
  const upcoming = !live && when > Date.now()
  const hs = home?.score
  const as = away?.score
  const league = (match.category || '').replace(/-/g, ' ')
  return (
    <button type="button" onClick={onPlay} className="shrink-0 w-[248px] text-left">
      <div className="relative h-[148px] rounded-xl overflow-hidden" style={{ background: wash }}>
        <div className="flex items-center justify-between px-3 pt-2 text-[9px] tracking-wide text-white/70 uppercase">
          <span className="truncate">{league}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${live ? 'bg-red-600 text-white' : 'bg-white/15 text-white'}`}>{live ? 'LIVE' : upcoming ? 'UPCOMING' : 'TODAY'}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pt-2 gap-1">
          <Side name={homeName} badge={match.teams?.home?.badge} extra={home?.logo} />
          <div className="text-white font-semibold text-[15px] tabular-nums px-1">{hs != null && as != null ? `${hs} - ${as}` : 'VS'}</div>
          <Side name={awayName} badge={match.teams?.away?.badge} extra={away?.logo} />
        </div>
        {busy && <div className="absolute inset-0 grid place-items-center bg-black/45 text-xs">Starting…</div>}
      </div>
      <p className="mt-2 text-[13px] font-medium truncate">
        {live && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 align-middle" />}
        {live ? 'LIVE: ' : ''}{match.title}
      </p>
      <p className="text-[11px] text-white/40">{dayLabel(match.date)}</p>
    </button>
  )
}

function Side({ name, badge, extra }: { name: string; badge?: string; extra?: string }) {
  const sources = [...badgeFallbacks(badge), extra || ''].filter(Boolean)
  return (
    <div className="min-w-0 text-center">
      <Crest sources={sources} name={name} />
      <p className="mt-1 text-[9px] uppercase tracking-wide text-white/90 truncate">{name}</p>
    </div>
  )
}

function Crest({ sources, name }: { sources: string[]; name: string }) {
  const [i, setI] = useState(0)
  const src = sources[i]
  if (!src) {
    return <span className="mx-auto grid place-items-center w-11 h-11 rounded-full bg-white text-[11px] font-bold text-black">{(name || '?').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || '?'}</span>
  }
  return (
    <img
      src={src}
      alt=""
      className="mx-auto w-11 h-11 rounded-full bg-white object-contain p-1"
      referrerPolicy="no-referrer"
      onError={() => setI((n) => n + 1)}
    />
  )
}
