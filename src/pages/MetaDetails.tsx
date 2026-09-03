import { useEffect, useState } from 'react'
import { ArrowLeft, Play, Star, Clock, Calendar, Heart, Plus, Share2, List, Check, Cast } from 'lucide-react'
import { tmdb, POSTER_URL, BACKDROP_URL, PROFILE_URL, STILL_URL } from '../api/tmdb'
import { fetchOmdbByImdbId } from '../api/omdb'
import { fetchRottenTomatoes } from '../api/rottentomatoes'
import QualityBadges from '../components/QualityBadges'
import { fetchMdblistRatings, type MdblistRating } from '../api/mdblist'
import { vidyUrl, getPlayerUrl } from '../api/vidy'
import { isAnimeItem } from '../lib/trackers'
import { useStore } from '../store'
import { sourceDot, reportBroken } from '../lib/playerStatus'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'

export default function MetaDetails() {
  const { selectedMedia, setCurrentPage, setSelectedMedia, tmdbApiKey, setCurrentStreamUrl, addToWatchlist, removeFromWatchlist, isInWatchlist, addFavorite, removeFavorite, isFavorite, aiostreamsUrl, externalPlayer, mdblistApiKey, customLists, addToCustomList, removeFromCustomList, isInCustomList, createCustomList } = useStore()
  const [detail, setDetail] = useState<any>(null)
  const [seasonData, setSeasonData] = useState<any>(null)
  const [activeSeason, setActiveSeason] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showTrailer, setShowTrailer] = useState(false)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'streams'>('details')
  const [streamOptions, setStreamOptions] = useState<any[]>([])
  const [resolving, setResolving] = useState(false)
  const [streamError, setStreamError] = useState('')
  const [omdb, setOmdb] = useState<{ imdbRating: string | null; rottenTomatoes: string | null; imdbVotes: string | null } | null>(null)
  const [rtExtra, setRtExtra] = useState<{ critics: string | null; audience: string | null } | null>(null)
  const [imdbId, setImdbId] = useState<string | null>(null)
  const [mdblistRatings, setMdblistRatings] = useState<MdblistRating[] | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const [newListName, setNewListName] = useState('')

  useEffect(() => {
    if (!selectedMedia) return
    load()
  }, [selectedMedia])

  useEffect(() => {
    const title = detail?.title || detail?.name
    if (!title) return
    fetchRottenTomatoes(String(title)).then(setRtExtra).catch(() => setRtExtra(null))
  }, [detail?.id, detail?.title, detail?.name])

  async function load() {
    if (!selectedMedia) return
    setLoading(true)
    try {
      // Handle IPTV
      if (selectedMedia.type === 'iptv') {
        setDetail({ id: selectedMedia.id, title: selectedMedia.channel?.name || 'IPTV Channel', overview: '', poster_path: selectedMedia.channel?.logo, backdrop_path: null, vote_average: 0, genres: [] })
        setLoading(false)
        return
      }
      // TypeScript type narrowing: after iptv check, type is 'movie' | 'tv'
      const mediaId = selectedMedia.id as number
      let d: any = null
      if (selectedMedia.type === 'movie') {
        d = await tmdb.getMovieDetail(mediaId)
      } else {
        d = await tmdb.getTVDetail(mediaId)
      }
      if (!d?.id) {
        const q = String((selectedMedia as any).title || (selectedMedia as any).name || '')
        if (q && !/^\d+$/.test(q)) {
          const s = await tmdb.searchMulti(q)
          const hit = (s?.results || []).find((r: any) => r.media_type === 'tv' || r.media_type === 'movie')
          if (hit) {
            d = hit.media_type === 'movie' ? await tmdb.getMovieDetail(hit.id) : await tmdb.getTVDetail(hit.id)
            setSelectedMedia({ ...selectedMedia, id: hit.id, type: hit.media_type === 'movie' ? 'movie' : 'tv' })
          }
        }
      }
      if (d) {
        setDetail(d)
        setTrailerKey(d?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')?.key || null)
        if (d.seasons?.length) {
          const sNum = d.seasons.find((s: any) => s.season_number > 0)?.season_number || 0
          setActiveSeason(sNum)
          tmdb.getSeasonDetail(d.id, sNum).then(setSeasonData).catch(() => {})
        }
      }
    } catch {}
    setLoading(false)
    try {
      if (selectedMedia && selectedMedia.type !== 'iptv') {
        const ext = await tmdb.getExternalIds(selectedMedia.type, selectedMedia.id as number)
        const iid = ext?.imdb_id || null
        setImdbId(iid)
        if (iid) fetchOmdbByImdbId(iid).then(setOmdb).catch(() => setOmdb(null))
        else setOmdb(null)
      }
    } catch {
      setOmdb(null)
    }
    try {
      if (selectedMedia && selectedMedia.type !== 'iptv' && mdblistApiKey) {
        fetchMdblistRatings(selectedMedia.type, selectedMedia.id as number).then((data) => setMdblistRatings(data?.ratings || null)).catch(() => setMdblistRatings(null))
      } else {
        setMdblistRatings(null)
      }
    } catch {
      setMdblistRatings(null)
    }
  }

  async function changeSeason(num: number) {
    if (!selectedMedia || selectedMedia.type !== 'tv') return
    setActiveSeason(num)
    const d = await tmdb.getSeasonDetail(selectedMedia.id as number, num)
    setSeasonData(d)
  }

  // Rank streams: prefer non-torrent direct/embed streams, then torrents by
  // seed count, then quality. Returns the best source.
  function pickBestStream(list: any[]): any | null {
    if (!list.length) return null
    const rank = (s: any) => {
      const isTorrent = s?.infoHash || /^magnet:/i.test(s?.url || '')
      let score = isTorrent ? 10 : 100
      if (s?.seeds) score += Math.min(50, s.seeds)
      if (s?.size) score += 5
      const q = String(s?.quality || '')
      if (/4k|2160/i.test(q)) score += 30
      else if (/1080/i.test(q)) score += 20
      else if (/720/i.test(q)) score += 10
      return score
    }
    return [...list].sort((a, b) => rank(b) - rank(a))[0]
  }

  // Populate the streams list (addons + torrents) whenever the streams tab is shown.
  useEffect(() => {
    if (activeTab !== 'streams' || !selectedMedia || !detail || streamOptions.length > 0) return
    // Skip streams for IPTV
    if (selectedMedia.type === 'iptv') return
    let cancelled = false
    setResolving(true)
    ;(async () => {
      try {
        const { resolveFromAiostreams, resolveFromTorrentio, getExternalIds } = await import('../api/streams')
        let idForAddon = String(selectedMedia.id)
        if (tmdbApiKey && (selectedMedia.type === 'movie' || selectedMedia.type === 'tv')) {
          const ext = await getExternalIds(selectedMedia.type, selectedMedia.id as number, tmdbApiKey)
          if (ext?.imdb_id) idForAddon = ext.imdb_id
        }
        const season = selectedMedia.season
        const episode = selectedMedia.episode
        let streams: any[] = []
        let torrents: any[] = []
        const mediaId = selectedMedia.id as number
        if (aiostreamsUrl && (selectedMedia.type === 'movie' || selectedMedia.type === 'tv')) {
          streams = await resolveFromAiostreams(aiostreamsUrl, selectedMedia.type, String(mediaId), season, episode)
        }
        if (selectedMedia.type === 'movie' || selectedMedia.type === 'tv') {
          torrents = await resolveFromTorrentio(selectedMedia.type, String(mediaId), { season, episode })
        }
        const list = [...streams, ...torrents]
        if (!cancelled) setStreamOptions(list)
      } catch {
        if (!cancelled) setStreamOptions([])
      }
      if (!cancelled) setResolving(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMedia, detail])

  // Skip streams for iptv type
  useEffect(() => {
    if (selectedMedia?.type === 'iptv') return
  }, [selectedMedia])


  const PLAYERS = [
    { id: 'playtorrio', label: 'PlayTorrio', q: '4K · HDR · Atmos' },
    { id: 'simplstream', label: 'SimplStream', q: '1080p · HDR' },
    { id: 'zangetsu', label: 'Zangetsu', q: '1080p · Sub/Dub' },
    { id: 'miruro', label: 'Miruro', q: '1080p · Anime' },
    { id: 'mangayomi', label: 'Mangayomi', q: 'Reader / 1080p' },
    { id: 'vidy', label: 'Vidy', q: '1080p · 720p' },
  ]
  const [playerPick, setPlayerPick] = useState(() => {
    try { return localStorage.getItem('mfy-player-engine') || 'zangetsu' } catch { return 'zangetsu' }
  })
  const [pickOpen, setPickOpen] = useState(false)

  async function handlePlay() {
    if (!selectedMedia || selectedMedia.type === 'iptv') return
    if (selectedMedia.type === 'manga' || selectedMedia.type === 'comics' || selectedMedia.type === 'book') {
      setCurrentPage('manga-detail')
      return
    }
    const kind = selectedMedia.type === 'movie' ? 'movie' : 'tv'
    const anime = isAnimeItem(selectedMedia) || isAnimeItem(detail)
    const pick = anime && !['zangetsu', 'miruro', 'mangayomi'].includes(playerPick) ? 'zangetsu' : playerPick
    const url = getPlayerUrl(pick as any, kind, selectedMedia.id as number, activeSeason, selectedMedia.episode || 1, anime)
    setSelectedMedia({ ...selectedMedia, season: activeSeason, episode: selectedMedia.episode })
    setCurrentStreamUrl(url)
    try {
      const st = useStore.getState()
      st.upsertHistory({
        id: `${selectedMedia.id}-${kind}-${activeSeason || 0}-${selectedMedia.episode || 0}`,
        mediaId: selectedMedia.id,
        mediaType: kind,
        title: (detail as any)?.title || (detail as any)?.name || String(selectedMedia.id),
        posterPath: (detail as any)?.poster_path || null,
        progress: 1,
        duration: 1,
        season: activeSeason,
        episode: selectedMedia.episode,
        watchedAt: new Date().toISOString(),
        profileId: st.currentProfile?.id || 'default',
      })
    } catch {}
    setCurrentPage('player')
  }

  function goBack() {
    setSelectedMedia(null)
    setCurrentPage('home')
  }

  if (loading) return (
    <div className="h-full">
      <div className="skeleton" style={{ height: 420, borderRadius: 0 }} />
      <div className="p-8 space-y-3">
        <div className="skeleton skeleton-text w-40" />
        <div className="skeleton skeleton-text w-80" />
        <div className="skeleton skeleton-text w-60" />
      </div>
    </div>
  )
  if (!detail) return (
    <div className="p-10 text-white">
      <button type="button" className="text-[#FF1493] mb-4" onClick={() => setCurrentPage('home')}>← Home</button>
      <p className="text-white/60">Couldn’t open this title. Go home and try again.</p>
    </div>
  )

  const title = detail.title || detail.name || ''
  const year = (detail.release_date || detail.first_air_date || '').slice(0, 4)
  const runtime = detail.runtime || detail.episode_run_time?.[0] || 0

  // Binge time — native version of bingeclock.com: for a movie it's the runtime,
  // for a series it's avg episode length × total episodes across all seasons.
  const bingeMinutes = selectedMedia?.type === 'tv'
    ? (detail.episode_run_time?.[0] || 0) * (detail.number_of_episodes || 0)
    : runtime
  function formatBinge(mins: number): string {
    if (!mins || !Number.isFinite(mins)) return ''
    const total = Math.round(mins)
    const d = Math.floor(total / 1440)
    const h = Math.floor((total % 1440) / 60)
    const m = total % 60
    const parts: string[] = []
    if (d > 0) parts.push(`${d}d`)
    if (h > 0) parts.push(`${h}h`)
    if (m > 0 || parts.length === 0) parts.push(`${m}m`)
    return parts.join(' ')
  }

  return (
    <div className="page-fade-enter">
      {/* Cinematic full-bleed hero */}
      <div className="relative min-h-[min(72vh,640px)] h-[560px] max-h-[80vh]">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{
            backgroundImage: detail.backdrop_path ? `url(${BACKDROP_URL}${detail.backdrop_path})` : undefined,
            backgroundColor: '#0a0a10',
          }}
        />
        {/* Soft vignette — readable text, keep face/scene visible */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, rgba(6,5,10,0.92) 0%, rgba(6,5,10,0.55) 38%, rgba(6,5,10,0.15) 62%, transparent 78%),
              linear-gradient(0deg, rgba(6,5,10,1) 0%, rgba(6,5,10,0.75) 22%, rgba(6,5,10,0.2) 55%, transparent 72%),
              linear-gradient(180deg, rgba(6,5,10,0.45) 0%, transparent 28%)
            `,
          }}
        />

        <div className="absolute top-4 left-4 z-20">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-black/45 backdrop-blur-md text-xs text-white/70 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        <div className="relative z-10 h-full flex items-end px-8 md:px-12 pb-10 md:pb-14">
          <div className="max-w-xl">
            {/* Title as logo-style wordmark */}
            <h1
              className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-3 drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]"
              style={{ fontFamily: 'system-ui, Segoe UI, sans-serif' }}
            >
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/55 mb-3">
              {detail.genres?.[0]?.name && <span>{detail.genres[0].name}</span>}
              {detail.genres?.[0] && year && <span className="text-white/25">·</span>}
              {year && <span>{year}</span>}
              {selectedMedia?.type === 'tv' && detail.number_of_seasons != null && (
                <>
                  <span className="text-white/25">·</span>
                  <span>{detail.number_of_seasons} Season{detail.number_of_seasons === 1 ? '' : 's'}</span>
                </>
              )}
              {runtime > 0 && selectedMedia?.type === 'movie' && (
                <>
                  <span className="text-white/25">·</span>
                  <span>{formatRuntime(runtime)}</span>
                </>
              )}
              {bingeMinutes > 0 && selectedMedia?.type === 'tv' && (
                <>
                  <span className="text-white/25">·</span>
                  <span title="Total time to watch every episode">Binge {formatBinge(bingeMinutes)}</span>
                </>
              )}
            </div>

            {/* Ratings row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(omdb?.imdbRating || detail.vote_average > 0) && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#f5c518]/20 border border-[#f5c518]/40 text-[11px] font-bold text-[#f5c518] shadow-sm">
                  IMDb {omdb?.imdbRating || Number(detail.vote_average).toFixed(1)}
                </span>
              )}
              {(omdb?.rottenTomatoes || rtExtra?.critics) && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#fa320a]/15 border border-[#fa320a]/40 text-[11px] font-bold text-[#ff6b4a]">
                  RT {omdb?.rottenTomatoes || rtExtra?.critics}
                </span>
              )}
              {rtExtra?.audience && (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#fa320a]/10 border border-[#fa320a]/25 text-[11px] font-bold text-[#ff8a6a]">
                  Audience {rtExtra.audience}
                </span>
              )}
              {mdblistRatings && mdblistRatings.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {mdblistRatings.slice(0, 5).map((r) => {
                    const label = (r.source || '').toLowerCase()
                    const score = r.score ?? r.value
                    if (score == null || !Number.isFinite(score)) return null
                    const pct = label === 'letterboxd' ? Math.round(score * 20) : label === 'imdb' || label === 'tmdb' || label === 'trakt' ? Math.round(score * 10) : Math.round(score)
                    const badge = label === 'rotten' ? { c: 'bg-[#fa320a]/15 text-[#ff6b4a] border-[#fa320a]/40', t: 'RT' }
                      : label === 'metacritic' ? { c: 'bg-[#3a6ea5]/20 text-[#7cb2e8] border-[#3a6ea5]/45', t: 'MC' }
                      : label === 'letterboxd' ? { c: 'bg-[#00b19d]/15 text-[#34d4c0] border-[#00b19d]/40', t: 'LB' }
                      : label === 'trakt' ? { c: 'bg-[#ed1c24]/15 text-[#ff6b6b] border-[#ed1c24]/40', t: 'TK' }
                      : { c: 'bg-[#f5c518]/20 text-[#f5c518] border-[#f5c518]/40', t: 'IMDb' }
                    return (
                      <span key={r.source} className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md border text-[11px] font-bold ${badge.c}`} title={`${r.source}: ${score}${r.votes != null ? ` (${r.votes} votes)` : ''}`}>
                        {badge.t} {pct}%
                      </span>
                    )
                  })}
                </div>
              )}
              {imdbId && (
                <button
                  type="button"
                  className="text-[10px] text-white/35 hover:text-white/70"
                  onClick={() => (window as any).electronAPI?.openExternal?.(`https://www.imdb.com/title/${imdbId}/`)}
                >
                  {imdbId}
                </button>
              )}
            </div>
            <QualityBadges
              year={(detail.release_date || detail.first_air_date || '').slice(0, 4)}
              haystack={[detail.title, detail.name, detail.tagline, ...(detail.genres||[]).map((g:any)=>g.name)].join(' ')}
            />

            {detail.overview && (
              <p className="text-[13px] text-white/70 leading-relaxed line-clamp-4 max-w-lg mb-6 drop-shadow-sm">
                {detail.overview}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {PLAYERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlayerPick(p.id)
                    try { localStorage.setItem('mfy-player-engine', p.id) } catch {}
                  }}
                  className={`h-7 px-2.5 rounded-full text-[10px] font-semibold ${playerPick === p.id ? 'bg-[#FF1493] text-white' : 'bg-white/10 text-white/50'}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{background: sourceDot(p.id)==='green'?'#22c55e':sourceDot(p.id)==='red'?'#ef4444':'#64748b'}} />
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPickOpen(true)
                  try { localStorage.setItem('mfy-player-engine', playerPick) } catch {}
                  handlePlay()
                }}
                disabled={resolving}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-60 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              >
                <Play className="w-4 h-4" fill="black" />
                {resolving ? 'Finding…' : 'Play'}
              </button>
              <button type="button" className="h-11 px-4 rounded-full bg-white/10 text-xs" onClick={() => { reportBroken(detail?.title || detail?.name || 'title', playerPick); alert('Reported. Next Play will try another source.') }}>Report broken</button>
              {pickOpen && (
                <div className="w-full mt-3 rounded-2xl bg-black/55 border border-white/10 p-3 space-y-2">
                  {PLAYERS.map((p) => (
                    <button key={p.id} type="button" className="w-full flex items-center justify-between h-10 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-left" onClick={() => {
                      setPlayerPick(p.id)
                      try { localStorage.setItem('mfy-player-engine', p.id) } catch {}
                      handlePlay()
                    }}>
                      <span className="text-sm">{p.label}</span>
                      <span className="text-[10px] text-[#FF1493]">{p.q}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('mfy-detail-body')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setActiveTab('details')
                }}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-sm font-medium text-white/90 hover:bg-white/15 transition-all"
              >
                More Info
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedMedia || !detail || selectedMedia.type === 'iptv') return
                  const mediaId = selectedMedia.id as number
                  const item = {
                    mediaId,
                    mediaType: selectedMedia.type,
                    title,
                    posterPath: detail.poster_path || null,
                    addedAt: new Date().toISOString(),
                  }
                  if (isInWatchlist(mediaId, selectedMedia.type)) {
                    removeFromWatchlist(mediaId, selectedMedia.type)
                  } else {
                    addToWatchlist(item)
                  }
                }}
className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/8 border border-white/12 text-sm text-white/70 hover:text-white transition-all"
                >
                <Plus className="w-4 h-4" />
                {selectedMedia && selectedMedia.type !== 'iptv' && isInWatchlist(selectedMedia.id as number, selectedMedia.type) ? 'In List' : 'My List'}
              </button>
              <button
                type="button"
                onClick={() => window.open('https://google.com/cast', '_blank')}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-[#FF1493]/15 border border-[#FF1493]/30 text-sm text-[#FF1493] hover:bg-[#FF1493]/25 transition-all"
                title="Cast to TV"
              >
                <Cast className="w-4 h-4" />
                Cast
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setListOpen((v) => !v)}
                  className={cn(
                    'inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/8 border text-sm transition-all',
                    listOpen ? 'text-white border-white/25 bg-white/12' : 'text-white/70 border-white/12 hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                  Add to list
                </button>
                {listOpen && (
                  <div className="absolute z-50 right-0 top-full mt-2 w-56 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl p-2 page-fade-enter">
                    {customLists.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-0.5 mb-1">
                        {customLists.map((l) => {
                          const mediaId = selectedMedia?.id
                          const inList = selectedMedia && mediaId && selectedMedia.type !== 'iptv' && isInCustomList(l.id, mediaId as number, selectedMedia.type)
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                if (!selectedMedia || !mediaId || selectedMedia.type === 'iptv') return
                                if (inList) {
                                  removeFromCustomList(l.id, mediaId as number, selectedMedia.type)
                                } else {
                                  addToCustomList(l.id, mediaId as number, selectedMedia.type, { title, posterPath: detail?.poster_path || null })
                                }
                                setListOpen(false)
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/[0.06] hover:text-white text-left transition-all"
                            >
                              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', inList ? 'bg-[#FF1493]' : 'bg-white/15')} />
                              <span className="flex-1 truncate">{l.name}</span>
                              {inList && <Check className="w-3.5 h-3.5 text-[#FF1493] flex-shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
onKeyDown={(e) => {
                          if (e.key === 'Enter' && newListName.trim()) {
                            const id = createCustomList(newListName.trim())
                            const mediaId = selectedMedia?.id
                            if (selectedMedia && mediaId && selectedMedia.type !== 'iptv') addToCustomList(id, mediaId as number, selectedMedia.type, { title, posterPath: detail?.poster_path || null })
                            setNewListName('')
                            setListOpen(false)
                          }
                        }}
                        placeholder="New list name…"
                        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/40"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newListName.trim()) return
                          const id = createCustomList(newListName.trim())
                          const mediaId = selectedMedia?.id
                          if (selectedMedia && mediaId && selectedMedia.type !== 'iptv') addToCustomList(id, mediaId as number, selectedMedia.type, { title, posterPath: detail?.poster_path || null })
                          setNewListName('')
                          setListOpen(false)
                        }}
                        className="h-8 px-2.5 rounded-lg bg-[#FF1493]/20 text-[#FF1493] hover:bg-[#FF1493]/30 text-xs flex items-center gap-1"
                      >
                        <Plus size={12} /> New
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {trailerKey && (
                <button
                  type="button"
                  onClick={() => setShowTrailer(true)}
                  className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/8 border border-white/12 text-sm text-white/70 hover:text-white transition-all"
                >
                  Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact poster strip under hero (optional identity) */}
      <div id="mfy-detail-body" className="px-8 -mt-6 relative z-10 mb-2">
        <div className="flex gap-4 items-end">
          <div className="w-[110px] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/40">
            {detail.poster_path ? (
              <img src={`${POSTER_URL}${detail.poster_path}`} alt={title} className="w-full block" />
            ) : (
              <div className="aspect-[2/3] bg-white/[0.04]" />
            )}
          </div>
          <div className="pb-1 flex flex-wrap gap-1.5">
            {(detail.genres || []).slice(0, 6).map((g: any) => (
              <span key={g.id} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white/[0.06] text-white/50 border border-white/[0.06]">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowTrailer(false)}>
          <div className="w-[800px] aspect-video rounded-xl overflow-hidden border border-white/[0.1]" onClick={(e) => e.stopPropagation()}>
            <iframe width="100%" height="100%" src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4 border-b border-white/[0.05] mb-5">
          {(['details', 'streams'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn('pb-3 text-xs font-medium border-b-2 transition-all capitalize', activeTab === t ? 'text-white border-[#FF1493]' : 'text-white/30 border-transparent hover:text-white/50')}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'details' && (
          <div className="space-y-8 pb-12">
            {/* Cast */}
            {detail.credits?.cast?.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Cast</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scroll-row">
                  {detail.credits.cast.slice(0, 12).map((p: any) => (
                    <div key={p.id} className="flex-shrink-0 w-[80px] text-center">
                      <div className="w-14 h-14 rounded-full mx-auto mb-1.5 overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                        {p.profile_path ? <img src={`${PROFILE_URL}${p.profile_path}`} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">{p.name[0]}</div>}
                      </div>
                      <p className="text-[10px] font-medium text-white/60 truncate">{p.name}</p>
                      <p className="text-[9px] text-white/20 truncate">{p.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seasons (TV) */}
            {selectedMedia?.type === 'tv' && detail.seasons && (
              <div>
                <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">Seasons</h3>
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  {detail.seasons.filter((s: any) => s.season_number >= 0).map((s: any) => (
                    <button key={s.id} onClick={() => changeSeason(s.season_number)} className={cn('px-3 py-1.5 rounded-md text-[11px] font-medium transition-all border', activeSeason === s.season_number ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20' : 'bg-white/[0.03] text-white/30 border-transparent hover:text-white/50')}>
                      {s.season_number === 0 ? 'Specials' : `Season ${s.season_number}`}
                    </button>
                  ))}
                </div>
                {seasonData?.episodes && (
                  <div className="space-y-1.5">
                    {seasonData.episodes.map((ep: any) => (
                      <div key={ep.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] cursor-pointer transition-all group">
                        <div className="w-28 h-16 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.03]">
                          {ep.still_path && <img src={`${STILL_URL}${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-[#00E5FF] font-medium">E{ep.episode_number}</p>
                          <p className="text-xs text-white/70 truncate group-hover:text-white transition-colors">{ep.name}</p>
                          <p className="text-[10px] text-white/20 line-clamp-1">{ep.overview}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ep.vote_average > 0 && <span className={cn('text-[10px] font-semibold', getRatingColor(ep.vote_average))}>★ {ep.vote_average.toFixed(1)}</span>}
                          {ep.runtime && <span className="text-[10px] text-white/15">{ep.runtime}m</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* What to Watch — similar / recommendations */}
            {(() => {
              const similar = (detail.similar?.results || detail.recommendations?.results || []).filter(Boolean)
              if (!similar.length) return null
              return (
                <div>
                  <h3 className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">What to Watch</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scroll-row">
                    {similar.slice(0, 12).map((s: any) => (
                      <div
                        key={s.id}
                        className="flex-shrink-0 w-[110px] poster-card"
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedMedia({ id: s.id, type: s.media_type === 'movie' ? 'movie' : 'tv' })
                          setCurrentPage('detail')
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedMedia({ id: s.id, type: s.media_type === 'movie' ? 'movie' : 'tv' })}
                      >
                        {s.poster_path ? (
                          <img src={`${POSTER_URL}${s.poster_path}`} alt={s.title || s.name} loading="lazy" />
                        ) : (
                          <div className="poster-fallback">{s.title || s.name}</div>
                        )}
                        <div className="poster-play"><Play size={18} fill="#fff" /></div>
                        <div className="poster-overlay">
                          <div className="poster-meta-title">{s.title || s.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="pb-12 space-y-2">
            {streamError && <div className="error-banner">{streamError}</div>}
            {resolving && <p className="text-xs text-white/30 py-6 text-center">Looking for streams…</p>}
            {!resolving && streamOptions.length === 0 && (
              <p className="text-xs text-white/20 text-center py-12">
                No streams found. Try again in a moment.
              </p>
            )}

            {/* Vidy — always-available embed player, no torrent needed */}
            <button
              type="button"
              onClick={() => {
                const url = vidyUrl(selectedMedia?.type === 'movie' ? 'movie' : 'tv', selectedMedia?.id ?? 0, activeSeason, selectedMedia?.episode)
                setCurrentStreamUrl(url)
                setCurrentPage('player')
              }}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FF1493]/10 border border-[#FF1493]/25 hover:bg-[#FF1493]/15 text-left transition-all"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-white/85 truncate">Vidy Player</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF1493]/25 text-[#FF1493] flex-shrink-0">Instant</span>
                </div>
                <div className="text-[10px] text-white/30 truncate mt-0.5">HD embed stream · works without torrent peers</div>
              </div>
              <span className="text-[10px] text-[#FF1493] flex-shrink-0">Play</span>
            </button>

            {streamOptions.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  const best = pickBestStream(streamOptions)
                  if (!best) { setStreamError('No playable source found.'); return }
                  setResolving(true)
                  try {
                    if (best.infoHash || /^magnet:/i.test(best.url || '')) {
                      const { pickBestFile } = await import('../api/torrent')
                      const picked = await pickBestFile(best.url, best.fileIdx)
                      if (picked?.streamUrl) {
                        setCurrentStreamUrl(picked.streamUrl)
                        setCurrentPage('player')
                      } else {
                        setStreamError('Could not start that torrent. Try another source.')
                      }
                    } else {
                      setCurrentStreamUrl(best.url)
                      if (externalPlayer && externalPlayer !== '') {
                        ;(window as any).electronAPI?.openExternal?.(best.url)
                      } else {
                        setCurrentPage('player')
                      }
                    }
                  } catch {
                    setStreamError('Could not start that source. Try another one.')
                  } finally {
                    setResolving(false)
                  }
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 text-left transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium text-white/85 truncate">Auto-play Best Source</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-400 flex-shrink-0">Auto</span>
                  </div>
                  <div className="text-[10px] text-white/30 truncate mt-0.5">Picks the highest-quality, most-seeded source automatically</div>
                </div>
                <span className="text-[10px] text-emerald-400 flex-shrink-0">Play</span>
              </button>
            )}

            {streamOptions.map((s: any, i: number) => {
              const isTorrent = s?.infoHash || /^magnet:/i.test(s?.url || '')
              const meta = [
                s.provider,
                s.seeds ? `${s.seeds} seeds` : '',
                s.size,
              ].filter(Boolean).join(' · ')
              return (
                <button
                  key={i}
                  type="button"
                  onClick={async () => {
                    if (isTorrent && s.url) {
                      setResolving(true)
                      try {
                        const { pickBestFile } = await import('../api/torrent')
                        const picked = await pickBestFile(s.url, s.fileIdx)
                        if (picked?.streamUrl) {
                          setCurrentStreamUrl(picked.streamUrl)
                          setCurrentPage('player')
                        } else {
                          setStreamError('Could not start that torrent. Try another source.')
                        }
                      } catch {
                        setStreamError('Could not start that torrent. Try another source.')
                      } finally {
                        setResolving(false)
                      }
                      return
                    }
                    setCurrentStreamUrl(s.url)
                    if (externalPlayer && externalPlayer !== '' && !isTorrent) {
                      ;(window as any).electronAPI?.openExternal?.(s.url)
                    } else {
                      setCurrentPage('player')
                    }
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-left transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-white/80 truncate">{s.name || s.provider || 'Stream'}</span>
                      {isTorrent && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 flex-shrink-0">Torrent</span>}
                    </div>
                    {meta && <div className="text-[10px] text-white/30 truncate mt-0.5">{meta}</div>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.quality && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF1493]/20 text-[#FF1493]">{s.quality}</span>}
                    <span className="text-[10px] text-[#FF1493]">Play</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
