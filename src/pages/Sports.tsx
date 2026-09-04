import { useEffect, useState, useMemo } from 'react'
import { Trophy, Radio, ExternalLink, Loader2, Activity, Flag, Volleyball, Target, Gauge, Swords, Medal, Siren, Dumbbell, Skull, Bike, Sparkles, PlayCircle, X, Search, Filter } from 'lucide-react'
import { sportsApi, badgeUrl, posterUrl, type SportCategory, type SportMatch, type SportStream } from '../api/sports'
import { iptvEnhancedApi } from '../api/iptv-enhanced'
import { useStore } from '../store'
import { addonCatalog, addonStreams, ADDONS } from '../api/stremioAddons'
import { cn } from '../lib/utils'
import TogetherPanel from '../components/TogetherPanel'

const SPORT_META: Record<string, { icon: any; color: string }> = {
  football: { icon: Activity, color: '#22C55E' },
  'american-football': { icon: Flag, color: '#F97316' },
  basketball: { icon: Volleyball, color: '#F59E0B' },
  hockey: { icon: Swords, color: '#3B82F6' },
  baseball: { icon: Target, color: '#EF4444' },
  'motor-sports': { icon: Gauge, color: '#A855F7' },
  fight: { icon: Dumbbell, color: '#E11D48' },
  tennis: { icon: Volleyball, color: '#84CC16' },
  rugby: { icon: Skull, color: '#14B8A6' },
  golf: { icon: Flag, color: '#10B981' },
  billiards: { icon: Target, color: '#6366F1' },
  afl: { icon: Medal, color: '#8B5CF6' },
  darts: { icon: Target, color: '#F43F5E' },
  cricket: { icon: Trophy, color: '#0EA5E9' },
  other: { icon: Sparkles, color: '#94A3B8' },
}

const DEFAULT_SPORT = 'football'

export default function Sports() {
  const { setCurrentStreamUrl, setCurrentPage, setSelectedMedia } = useStore()
  const [sports, setSports] = useState<SportCategory[]>([])
  const [sportId, setSportId] = useState(DEFAULT_SPORT)
  const [matches, setMatches] = useState<SportMatch[]>([])
  const [live, setLive] = useState<SportMatch[]>([])
  const [multiView, setMultiView] = useState(false)
  const [mvSlots, setMvSlots] = useState<{ id: string; title: string; url: string }[]>([])
  const [mvGrid, setMvGrid] = useState<'1x2' | '2x1' | '2x2' | '1+2' | '3x3'>('2x2')
  const [partyCode, setPartyCode] = useState('')
  const [together, setTogether] = useState(false)
  const [streams, setStreams] = useState<SportStream[] | null>(null)
  const [activeMatch, setActiveMatch] = useState<SportMatch | null>(null)
  const [streamError, setStreamError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [engine, setEngine] = useState<'streamed' | 'metegol' | 'nuvio'>('streamed')
  const [nuvio, setNuvio] = useState<any[]>([])
  const [watchUrl, setWatchUrl] = useState('')
  const [metegol, setMetegol] = useState<any[]>([])
  const [when, setWhen] = useState<'live' | 'upcoming' | 'finished'>('live')

  const filteredMatches = useMemo(() => {
    const now = Date.now()
    let list = matches
    if (when === 'live') list = matches.filter((m) => m.live) 
    else if (when === 'upcoming') list = matches.filter((m) => !m.live && Number(m.date) * (String(m.date).length < 13 ? 1000 : 1) > now)
    else list = matches.filter((m) => !m.live && Number(m.date) * (String(m.date).length < 13 ? 1000 : 1) <= now)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.teams?.home?.name?.toLowerCase().includes(q) ||
        m.teams?.away?.name?.toLowerCase().includes(q)
      )
    }
    return list
  }, [matches, searchQuery, when])

  useEffect(() => {
    Promise.all([
      addonCatalog('nuvio').catch(() => []),
      addonCatalog('nova').catch(() => []),
      addonCatalog('nebula').catch(() => []),
    ]).then(([a, b, c]) => setNuvio([...(a || []), ...(b || []), ...(c || [])]))
    iptvEnhancedApi.getMetegolEvents().then(setMetegol).catch(() => {
      fetch('./data/metegol.json').then((r) => r.json()).then((d) => setMetegol(d.events || [])).catch(() => setMetegol([]))
    })
    sportsApi.getSports().then(setSports).catch(() => setSports([
      { id: 'football', name: 'Football' },
      { id: 'basketball', name: 'Basketball' },
      { id: 'american-football', name: 'American Football' },
      { id: 'baseball', name: 'Baseball' },
      { id: 'hockey', name: 'Hockey' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'fight', name: 'Fight' },
    ]))
    sportsApi
      .getLive()
      .then((m) => setLive((Array.isArray(m) ? m : []).map((x) => ({ ...x, live: true }))))
      .catch(() => setLive([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    sportsApi
      .getMatches(sportId)
      .then((m) => {
        if (!cancelled) setMatches(Array.isArray(m) ? m : [])
      })
      .catch(() => {
        if (!cancelled) setMatches([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sportId])

  async function openMatch(match: SportMatch) {
    setActiveMatch(match)
    setStreams(null)
    setStreamError('')
    const sources = match.sources || []
    if (!sources.length) {
      setStreamError('No sources listed for this match.')
      return
    }
    setResolving(true)
    try {
      const jobs = sources.slice(0, 3).map((s) => sportsApi.getStreams(s.source, s.id).then((list) => (Array.isArray(list) ? list : [])).catch(() => [] as SportStream[]))
      const first = await Promise.race([
        Promise.any(jobs.map(async (j) => {
          const list = await j
          if (list[0]?.embedUrl) return list
          throw new Error('empty')
        })),
        new Promise<SportStream[]>((resolve) => setTimeout(() => resolve([]), 3500)),
      ])
      if (first[0]?.embedUrl) {
        playEmbed(first[0].embedUrl)
        setResolving(false)
        return
      }
      const all = (await Promise.all(jobs)).flat()
      setStreams(all)
      if (!all.length) setStreamError('No live embeds available for this match right now.')
    } catch {
      setStreamError('Could not load streams.')
    }
    setResolving(false)
  }

  function playEmbed(url: string, title?: string) {
    setActiveMatch(null)
    setStreams(null)
    if (multiView) {
      const cap = mvGrid === '1x2' || mvGrid === '2x1' ? 2 : mvGrid === '1+2' ? 3 : mvGrid === '3x3' ? 9 : 4
      setMvSlots((cur) => {
        const next = [...cur, { id: `${Date.now()}`, title: title || activeMatch?.title || 'Stream', url }]
        return next.slice(0, cap)
      })
      return
    }
    setWatchUrl(url)
  }

  function formatDate(ms: number) {
    if (!ms) return ''
    try {
      return new Date(ms).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <>
    {together && <TogetherPanel streamUrl={watchUrl} onClose={() => setTogether(false)} />}
    <div className="page-fade-enter min-h-full bg-[#0b0f14] text-white flex">
      <aside className="w-52 flex-shrink-0 bg-[#0a0e12] border-r border-white/10 p-3 hidden md:block">
        <p className="text-[10px] tracking-[0.25em] text-[#FF1493] font-bold mb-3">MFY SPORTS</p>
        {sports.map((s) => (
          <button key={s.id} type="button" onClick={() => setSportId(s.id)} className={cn('w-full text-left px-3 py-2 rounded-md text-sm mb-0.5', sportId === s.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white')}>
            {s.name || s.id}
          </button>
        ))}
      </aside>
      <div className="flex-1 p-5 min-w-0">
      {watchUrl && (
        <div className="mb-5">
          <button type="button" className="h-9 px-3 mb-2 rounded-full bg-white text-black text-sm font-semibold" onClick={() => setWatchUrl('')}>Back</button>
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe title="Sports" src={watchUrl} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
          </div>
        </div>
      )}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-[#22c55e] font-bold">LIVE</p>
          <h2 className="text-3xl font-bold text-white">{sportId.replace(/-/g, ' ')}</h2>
        </div>
        <div className="flex gap-2">
          {(['live', 'upcoming', 'finished'] as const).map((w) => (
            <button key={w} type="button" onClick={() => setWhen(w)} className={cn('h-8 px-3 rounded-full text-[11px] font-semibold', when === w ? 'bg-white text-black' : 'bg-white/10 text-white/45')}>{w}</button>
          ))}
          {(['streamed', 'metegol', 'nuvio'] as const).map((e) => (
            <button key={e} type="button" onClick={() => setEngine(e)} className={cn('h-8 px-3 rounded-full text-[11px] font-semibold', engine === e ? 'bg-[#FF1493] text-white' : 'bg-white/10 text-white/45')}>
              {e === 'streamed' ? 'Streamed' : e === 'metegol' ? 'Metegol' : 'Nuvio'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF1493]/15 border border-[#FF1493]/30 text-xs text-[#FF1493] hover:bg-[#FF1493]/25 transition-all"
          title="Search">
          <Search className="w-3.5 h-3.5" /> Search
        </button>
        <button
          type="button"
          onClick={() => setMultiView(!multiView)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF1493]/15 border border-[#FF1493]/30 text-xs text-[#FF1493] hover:bg-[#FF1493]/25 transition-all"
          title="Multi-view">
          <PlayCircle className="w-3.5 h-3.5" /> Multi-view
        </button>
        <button
          type="button"
          onClick={() => setPartyCode((v) => (typeof v === 'string' ? '' : 'watching'))}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs hover:bg-emerald-500/15 transition-all"
          title="Watch party">
          <PlayCircle className="w-3.5 h-3.5" /> Party
        </button>
        <button type="button" onClick={() => setTogether(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-xs text-white">Together</button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scroll-row">
        {sports.map((s) => {
          const meta = SPORT_META[s.id] || SPORT_META.other
          const Icon = meta.icon
          const active = sportId === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSportId(s.id)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl border transition-all',
                active
                  ? 'bg-white/[0.06] border-white/25 scale-[1.02]'
                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
              )}
              style={active ? { boxShadow: `0 0 24px ${meta.color}33` } : undefined}
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${meta.color}1f`, color: meta.color, border: `1px solid ${meta.color}40` }}
              >
                <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              </span>
              <span className="text-[9px] font-medium text-white/60 truncate max-w-[76px]">{s.name}</span>
            </button>
          )
        })}
      </div>

      {engine === 'nuvio' && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-3.5 h-3.5 text-[#FF1493]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#FF1493]">Nuvio Live Sports</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {nuvio.map((e: any) => (
              <button
                key={e.id}
                type="button"
                className="text-left rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[#FF1493]/40"
                onClick={async () => {
                  const nid = String(e.stremioId || e.id || '')
                  const rows = await addonStreams(ADDONS.nuvio.base, 'tv', nid).catch(() => [])
                  const hit = rows.find((r) => /^https?:/i.test(r.url)) || rows[0]
                  if (hit?.url) {
                    playEmbed(hit.url, e.title || e.name)
                    return
                  }
                  if (nid) playEmbed(`https://nuvio.moaqeel6679.my.id/watch?id=${encodeURIComponent(nid)}`, e.title || e.name)
                }}
              >
                <p className="text-sm font-semibold text-white line-clamp-2">{e.title || e.name}</p>
                <p className="text-[11px] text-white/40 mt-1">Nuvio</p>
              </button>
            ))}
            {!nuvio.length && <p className="text-white/40 text-sm">No Nuvio events right now.</p>}
          </div>
        </section>
      )}
      {engine === 'metegol' && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-3.5 h-3.5 text-[#FF1493]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#FF1493]">Metegol</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {metegol.map((e: any) => (
              <button
                key={e.id}
                type="button"
                className="text-left rounded-xl border border-white/10 bg-white/[0.03] p-3 hover:border-[#FF1493]/40"
                onClick={async () => {
                  const url = e.streams?.[0]?.url || e.url || e.embed || ''
                  const title = String(e.title || '')
                  if (/\.m3u8($|\?)/i.test(url)) {
                    playEmbed(url, title)
                    return
                  }
                  const liveHit = live.find((m) => title && m.title.toLowerCase().includes(title.split(' vs ')[0]?.toLowerCase?.() || '___nomatch'))
                  if (liveHit) {
                    await openMatch(liveHit)
                    return
                  }
                  if (url && !/\.m3u($|\?)/i.test(url)) {
                    playEmbed(url, title)
                    return
                  }
                  const foot = matches.find((m) => title && m.title.toLowerCase().includes(title.split(' ')[0].toLowerCase()))
                  if (foot) await openMatch(foot)
                  else if (live[0]) await openMatch(live[0])
                }}
              >
                <p className="text-[10px] text-red-400 font-bold">LIVE</p>
                <p className="text-sm text-white font-medium">{e.title}</p>
                <p className="text-[11px] text-white/40">{e.competition} · {e.sport}</p>
              </button>
            ))}
          </div>
          {metegol.length === 0 && <p className="text-sm text-white/30">No Metegol events loaded.</p>}
        </section>
      )}

      {engine === 'streamed' && live.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-red-400/90">Live now</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {live.slice(0, 12).map((m) => (
              <MatchCard key={m.id} match={m} onOpen={() => openMatch(m)} formatDate={formatDate} />
            ))}
          </div>
        </section>
      )}

      {multiView && (
        <section className="mb-6 rounded-2xl border border-white/10 bg-black/50 p-3">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[11px] uppercase tracking-widest text-[#FF1493]">Multi-view</span>
            {(['1x2', '2x1', '2x2', '1+2', '3x3'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setMvGrid(g)}
                className={`h-7 px-2.5 rounded-full text-[11px] ${mvGrid === g ? 'bg-[#FF1493] text-white' : 'bg-white/10 text-white/70'}`}>
                {g === '1x2' ? 'Side by side' : g === '2x1' ? 'Stacked' : g === '2x2' ? '2×2' : g === '1+2' ? 'Main + 2' : '3×3'}
              </button>
            ))}
            <button type="button" className="ml-auto text-[11px] text-white/50" onClick={() => setMvSlots([])}>Clear</button>
            <button type="button" className="text-[11px] text-red-400" onClick={() => { setMultiView(false); setMvSlots([]) }}>Close</button>
          </div>
          <div
            className={
              mvGrid === '1x2' ? 'grid grid-cols-2 gap-2 h-[52vh]' :
              mvGrid === '2x1' ? 'grid grid-cols-1 grid-rows-2 gap-2 h-[70vh]' :
              mvGrid === '1+2' ? 'grid grid-cols-3 grid-rows-2 gap-2 h-[62vh]' :
              mvGrid === '3x3' ? 'grid grid-cols-3 grid-rows-3 gap-2 h-[72vh]' :
              'grid grid-cols-2 grid-rows-2 gap-2 h-[62vh]'
            }
          >
            {Array.from({ length: mvGrid === '1x2' || mvGrid === '2x1' ? 2 : mvGrid === '1+2' ? 3 : mvGrid === '3x3' ? 9 : 4 }).map((_, i) => {
              const slot = mvSlots[i]
              const extra = mvGrid === '1+2' && i === 0 ? 'col-span-2 row-span-2' : ''
              return (
                <div key={i} className={`relative rounded-xl overflow-hidden bg-[#0c0c12] border border-white/10 ${extra}`}>
                  {slot?.url ? (
                    <>
                      <iframe title={slot.title} src={slot.url} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
                      <div className="absolute top-1 left-1 right-1 flex justify-between text-[10px] text-white">
                        <span className="bg-black/60 px-2 py-0.5 rounded">{slot.title}</span>
                        <button type="button" className="bg-black/60 px-2 py-0.5 rounded" onClick={() => setMvSlots((s) => s.filter((x) => x.id !== slot.id))}>✕</button>
                      </div>
                    </>
                  ) : (
                    <button type="button" className="w-full h-full text-white/35 text-xs" onClick={() => live[i] && openMatch(live[i])}>
                      Click a match below to fill this pane
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-white/40 mt-2">Open matches while Multi-view is on — they drop into empty panes instead of taking the whole screen.</p>
        </section>
      )}

      {activeMatch || resolving || streams ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => {
            setActiveMatch(null)
            setStreams(null)
            setStreamError('')
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#12121a] border border-white/10 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-white mb-1">{activeMatch?.title}</h3>
            <p className="text-[10px] text-white/30 mb-4">{activeMatch?.category}</p>
            {resolving && (
              <div className="flex items-center gap-2 text-xs text-white/40 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Finding streams…
              </div>
            )}
            {streamError && <div className="error-banner mb-3">{streamError}</div>}
            {streams && streams.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {streams.map((s, i) => (
                  <button
                    key={`${s.id}-${s.streamNo}-${i}`}
                    type="button"
                    onClick={() => s.embedUrl && playEmbed(s.embedUrl)}
                    className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] hover:border-[#FF1493]/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="relative flex w-2 h-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                        <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs text-white/85">
                          {s.language || `Stream ${s.streamNo || i + 1}`}
                          {s.hd ? (
                            <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-400">HD</span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-white/30">
                          {s.viewers != null ? `${s.viewers} watching` : s.source}
                        </div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-[#FF1493] flex-shrink-0">Watch <ExternalLink className="w-3 h-3" /></span>
                  </button>
                ))}
              </div>
            )}
            {streams && streams.length === 0 && !streamError && (
              <p className="text-[11px] text-white/25 text-center py-4">No live embeds available for this match right now.</p>
            )}
            <button
              type="button"
              className="mt-4 text-[11px] text-white/35 hover:text-white/60"
              onClick={() => {
                setActiveMatch(null)
                setStreams(null)
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="pb-6">
          <p className="text-[11px] text-white/25 text-center">Select a sport above to see live matches</p>
        </div>
      )}

      {activeMatch && partyCode && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-white/90 rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="text-lg font-bold mb-4">Watch Party</h3>
            <p className="text-white/70 mb-6">Share this party code with friends:</p>
            <div className="bg-white/20 rounded p-4 mb-6">
              <code className="text-lg font-mono text-white/80">{partyCode}</code>
            </div>
            <button
              className="bg-[#FF1493] text-white px-6 py-2 rounded-md hover:bg-[#FF1493]/90"
              onClick={() => setPartyCode('')}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading ? (
    <div className="flex items-center gap-2 text-white/30 text-xs py-12 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading matches…
    </div>
  ) : (
    <>
      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search matches, teams, leagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white placeholder-white/20 focus:border-[#FF1493]/50 focus:outline-none focus:ring-1 focus:ring-[#FF1493]/30 text-sm"
            />
          </div>
        </div>
      )}
      {filteredMatches.length === 0 && searchQuery && !loading && (
        <p className="text-xs text-white/25 text-center py-10">No matches found for "<span className="text-white/60">{searchQuery}</span>"</p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {filteredMatches.map((m) => (
          <MatchCard key={m.id} match={m} onOpen={() => openMatch(m)} formatDate={formatDate} />
        ))}
        {!filteredMatches.length && !loading && !searchQuery && (
          <p className="text-xs text-white/25 col-span-2 py-10 text-center">No matches for this sport right now.</p>
        )}
      </div>
    </>
    )}
      </div>
    </div>
    </>
  )
}

function MatchCard({
  match,
  onOpen,
  formatDate,
}: {
  match: SportMatch
  onOpen: () => void
  formatDate: (n: number) => string
}) {
  const home = match.teams?.home
  const away = match.teams?.away
  const parsed = String(match.title || '').match(/(\d+)\s*[-–]\s*(\d+)/)
  const hs = match.score?.home ?? parsed?.[1]
  const as = match.score?.away ?? parsed?.[2]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 p-3 rounded-xl bg-[#0e141c] border border-white/10 hover:border-[#22c55e]/40 text-left transition-all w-full"
    >
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <div className="text-xs text-white/80 truncate text-right">{home?.name || match.title.split(/vs|v\s/i)[0]}</div>
        {home?.badge ? <img src={badgeUrl(home.badge)} alt="" className="w-9 h-9 object-contain" /> : <div className="w-9 h-9 rounded-full bg-white/10" />}
      </div>
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        {match.live && <span className="text-[8px] text-red-400 font-bold tracking-widest">LIVE</span>}
        <div className="text-lg font-bold text-white tabular-nums">{hs != null && as != null ? `${hs} - ${as}` : 'VS'}</div>
        <div className="text-[9px] text-white/30">{match.date ? formatDate(match.date) : match.category}</div>
      </div>
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {away?.badge ? <img src={badgeUrl(away.badge)} alt="" className="w-9 h-9 object-contain" /> : <div className="w-9 h-9 rounded-full bg-white/10" />}
        <div className="text-xs text-white/80 truncate">{away?.name || match.title.split(/vs|v\s/i)[1] || ''}</div>
      </div>
    </button>
  )
}