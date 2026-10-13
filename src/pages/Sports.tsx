import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { sportsApi, timStreamsApi, watchfootyApi, badgeFallbacks, type SportMatch } from '../api/sports'
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
  const { setCurrentStreamUrl, setCurrentPage, setSelectedMedia, setIptvMultiview, setIptvMultiviewUrls } = useStore()
  const [rows, setRows] = useState<Record<string, SportMatch[]>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [multi, setMulti] = useState(false)
  const [slots, setSlots] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [layout, setLayout] = useState<'split' | 'focus' | 'stack'>('split')
  const [picked, setPicked] = useState<SportMatch[]>([])

  useEffect(() => {
    let stop = false
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
    return () => { stop = true }
  }, [])

  function firstUrl(value: any): string {
    if (!value) return ''
    if (typeof value === 'string' && /^https?:/i.test(value)) return value
    if (Array.isArray(value)) {
      for (const item of value) {
        const hit = firstUrl(item)
        if (hit) return hit
      }
      return ''
    }
    if (typeof value === 'object') {
      for (const key of ['embedUrl', 'embed', 'url', 'stream', 'link', 'player']) {
        const hit = firstUrl(value[key])
        if (hit) return hit
      }
    }
    return ''
  }

  async function workingUrl(match: SportMatch) {
    for (const s of match.sources || []) {
      const list = await sportsApi.getStreams(s.source, s.id).catch(() => [])
      const pick = list.find((x) => x.hd && /^https?:/i.test(x.embedUrl || '')) || list.find((x) => /^https?:/i.test(x.embedUrl || ''))
      if (pick?.embedUrl) return pick.embedUrl
    }
    const title = String(match.title || '').toLowerCase()
    const wf = await watchfootyApi.matches(match.category || 'football').catch(() => [])
    const wfHit = (wf || []).find((item: any) => title && String(item.title || item.name || item.match || '').toLowerCase().includes(title.slice(0, 12)))
    const wfUrl = firstUrl(wfHit)
    if (wfUrl) return wfUrl
    const tim = await timStreamsApi.live().catch(() => ({ events: [] as any[] }))
    const timHit = (tim.events || []).find((item: any) => title && String(item.title || item.name || '').toLowerCase().includes(title.slice(0, 12)))
    return firstUrl(timHit)
  }

  async function play(match: SportMatch) {
    if (multi) {
      setPicked((rows) => rows.some((row) => row.id === match.id) ? rows.filter((row) => row.id !== match.id) : [...rows, match].slice(0, slots))
      return
    }
    setErr('')
    setBusy(match.id)
    try {
      const url = await workingUrl(match)
      if (!url) { setErr('No working feed for this game yet.'); return }
      setIptvMultiview(false)
      setIptvMultiviewUrls([])
      setSelectedMedia({ id: match.id, type: 'iptv', title: match.title, name: match.title } as any)
      setCurrentStreamUrl(url)
      setCurrentPage('player')
    } catch {
      setErr('Could not start that game.')
    } finally {
      setBusy('')
    }
  }

  async function playMulti() {
    setErr('')
    setBusy('multi')
    try {
      const urls: string[] = []
      for (const match of picked) {
        const url = await workingUrl(match)
        if (url) urls.push(url)
      }
      if (!urls.length) { setErr('None of those games have a working feed.'); return }
      setIptvMultiview(true)
      try { sessionStorage.setItem('mfy-sports-grid', JSON.stringify({ layout, slots })) } catch {}
      setIptvMultiviewUrls(urls.slice(0, slots))
      setSelectedMedia({ id: 'sports-multi', type: 'iptv', title: 'Sports multi view', name: 'Sports multi view' } as any)
      setCurrentStreamUrl(urls[0])
      setCurrentPage('player')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="min-h-full bg-[#0b0b0b] text-white px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-semibold">Sports</h1>
        <div className="flex gap-2">
          <button type="button" className={`h-9 px-3 rounded-full text-xs ${multi ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => { setMulti((v) => !v); setPicked([]) }}>Multi view</button>
          {multi && [1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={`h-9 w-9 rounded-full text-xs ${slots === n ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => { setSlots(n as 1 | 2 | 3 | 4 | 5); setPicked((rows) => rows.slice(0, n)) }}>{n}</button>
          ))}
          {multi && ['split', 'focus', 'stack'].map((name) => (
            <button key={name} type="button" className={`h-9 px-3 rounded-full text-xs capitalize ${layout === name ? 'bg-white text-black' : 'bg-white/10 text-white'}`} onClick={() => setLayout(name as 'split' | 'focus' | 'stack')}>{name}</button>
          ))}
          {multi && <button type="button" className="h-9 px-3 rounded-full bg-white text-black text-xs" onClick={playMulti} disabled={!picked.length}>Play {picked.length || ''}</button>}
        </div>
      </div>
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
                <GameCard key={m.id} match={m} wash={WASH[i % WASH.length]} busy={busy === m.id} onPlay={() => play(m)} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function GameCard({ match, wash, busy, onPlay }: { match: SportMatch; wash: string; busy: boolean; onPlay: () => void }) {
  const homeName = match.teams?.home?.name || match.title.split(/\s+vs\s+/i)[0] || match.title
  const awayName = match.teams?.away?.name || match.title.split(/\s+vs\s+/i)[1] || ''
  const when = stamp(match.date)
  const live = !!match.live || (when > 0 && when <= Date.now() + 15 * 60 * 1000 && Date.now() - when < 4 * 60 * 60 * 1000)
  const upcoming = !live && when > Date.now()
  const league = (match.category || '').replace(/-/g, ' ')
  return (
    <button type="button" onClick={onPlay} className="shrink-0 w-[248px] text-left">
      <div className="relative h-[148px] rounded-xl overflow-hidden" style={{ background: wash }}>
        <div className="flex items-center justify-between px-3 pt-2 text-[9px] tracking-wide text-white/70 uppercase">
          <span className="truncate">{league}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${live ? 'bg-red-600 text-white' : 'bg-white/15 text-white'}`}>{live ? 'LIVE' : upcoming ? 'UPCOMING' : 'TODAY'}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-3 pt-2 gap-1">
          <Side name={homeName} badge={match.teams?.home?.badge} />
          <div className="text-white font-semibold text-[15px] tabular-nums px-1">VS</div>
          <Side name={awayName} badge={match.teams?.away?.badge} />
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

function Side({ name, badge }: { name: string; badge?: string }) {
  const sources = badgeFallbacks(badge)
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
