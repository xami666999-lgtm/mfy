import { useEffect, useState } from 'react'
import { Trophy, Radio, ExternalLink, Loader2 } from 'lucide-react'
import { sportsApi, badgeUrl, posterUrl, type SportCategory, type SportMatch, type SportStream } from '../api/sports'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function Sports() {
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [sports, setSports] = useState<SportCategory[]>([])
  const [sportId, setSportId] = useState('football')
  const [matches, setMatches] = useState<SportMatch[]>([])
  const [live, setLive] = useState<SportMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [streams, setStreams] = useState<SportStream[] | null>(null)
  const [activeMatch, setActiveMatch] = useState<SportMatch | null>(null)
  const [streamError, setStreamError] = useState('')
  const [resolving, setResolving] = useState(false)

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
        <div className="w-10 h-10 rounded-xl bg-[#FF1493]/15 border border-[#FF1493]/25 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-[#FF1493]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">Sports</h2>
          <p className="text-[11px] text-white/30">Live & upcoming · Streamed.pk API</p>
        </div>
      </div>

      {live.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-red-400/90">Live now</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {live.slice(0, 6).map((m) => (
              <MatchCard key={m.id} match={m} onOpen={() => openMatch(m)} formatDate={formatDate} />
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scroll-row">
        {sports.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSportId(s.id)}
            className={cn(
              'flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-medium border transition-all',
              sportId === s.id
                ? 'bg-[#FF1493]/20 border-[#FF1493]/40 text-[#FF1493]'
                : 'border-white/10 text-white/40 hover:text-white/70'
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/30 text-xs py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading matches…
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} onOpen={() => openMatch(m)} formatDate={formatDate} />
          ))}
          {!matches.length && (
            <p className="text-xs text-white/25 col-span-2 py-10 text-center">No matches for this sport right now.</p>
          )}
        </div>
      )}

      {/* Stream picker modal */}
      {(activeMatch || resolving || streams) && (
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
