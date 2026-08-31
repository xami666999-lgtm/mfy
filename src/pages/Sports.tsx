import { useEffect, useState, useMemo } from 'react'
import { Trophy, Radio, ExternalLink, Loader2, Activity, Flag, Volleyball, Target, Gauge, Swords, Medal, Siren, Dumbbell, Skull, Bike, Sparkles, PlayCircle, X, Search, Filter } from 'lucide-react'
import { sportsApi, badgeUrl, posterUrl, type SportCategory, type SportMatch, type SportStream } from '../api/sports'
import { useStore } from '../store'
import { cn } from '../lib/utils'

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
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [sports, setSports] = useState<SportCategory[]>([])
  const [sportId, setSportId] = useState(DEFAULT_SPORT)
  const [matches, setMatches] = useState<SportMatch[]>([])
  const [live, setLive] = useState<SportMatch[]>([])
  const [multiView, setMultiView] = useState(false)
  const [partyCode, setPartyCode] = useState('')
  const [streams, setStreams] = useState<SportStream[] | null>(null)
  const [activeMatch, setActiveMatch] = useState<SportMatch | null>(null)
  const [streamError, setStreamError] = useState('')
  const [resolving, setResolving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches
    const q = searchQuery.toLowerCase()
    return matches.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.teams?.home?.name?.toLowerCase().includes(q) ||
      m.teams?.away?.name?.toLowerCase().includes(q)
    )
  }, [matches, searchQuery])

  useEffect(() => {
    sportsApi.getSports().then(setSports).catch(() => setSports([]))
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
      let found: SportStream[] = []
      for (const s of sources) {
        const list = await sportsApi.getStreams(s.source, s.id)
        if (Array.isArray(list) && list.length) {
          found = list
          break
        }
      }
      setStreams(found)
      if (!found.length) setStreamError('No live embeds available for this match right now.')
    } catch {
      setStreamError('Could not load streams.')
    }
    setResolving(false)
  }

  function playEmbed(url: string) {
    setCurrentStreamUrl(url)
    setCurrentPage('player')
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
    <div className="p-6 md:p-8 page-fade-enter max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FF1493]/15 border border-[#FF1493]/25 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center leading-none py-2">
            <Trophy className="w-5 h-5 text-[#FF1493]" />
            <span className="text-[8px] font-black text-[#FF1493] mt-0.5 tracking-tight">MFY</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Sports</h2>
          <p className="text-[11px] text-white/30">Live & upcoming · Streamed.pk API</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FF1493]/15 border border-[#FF1493]/25 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center leading-none py-2">
            <Trophy className="w-5 h-5 text-[#FF1493]" />
            <span className="text-[8px] font-black text-[#FF1493] mt-0.5 tracking-tight">MFY</span>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Sports</h2>
          <p className="text-[11px] text-white/30">Live & upcoming · Streamed.pk API</p>
        </div>
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

      {live.length > 0 && (
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
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-white/60">Multi-view</span>
            <button
              type="button"
              onClick={() => setMultiView(false)}
              className="ml-2 text-[10px] text-red-400 hover:text-red-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {live.slice(0, 4).map((m) => (
              <MatchCard key={m.id} match={m} onOpen={() => openMatch(m)} formatDate={formatDate} />
            ))}
          </div>
          <p className="text-[10px] text-white/30 mt-2">Multi-view is opt-in. Click the button above to close.</p>
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
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-left transition-all"
    >
      {match.poster ? (
        <img src={posterUrl(match.poster)} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/5" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center gap-1 flex-shrink-0 overflow-hidden">
          {home?.badge && <img src={badgeUrl(home.badge)} alt="" className="w-6 h-6 object-contain" />}
          {away?.badge && <img src={badgeUrl(away.badge)} alt="" className="w-6 h-6 object-contain" />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-white/85 truncate">{match.title}</div>
          {match.live && (
            <span className="flex-shrink-0 flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-70" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-500" />
              </span>
              LIVE
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/30 mt-0.5">
          {match.category}
          {match.date ? ` · ${formatDate(match.date)}` : ''}
          {match.popular ? ' · Popular' : ''}
        </div>
      </div>
    </button>
  )
}