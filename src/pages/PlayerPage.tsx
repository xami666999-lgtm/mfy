import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2, Maximize, Minimize, Subtitles, ArrowLeft, Cast, RefreshCw, Zap } from 'lucide-react'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { vidyUrl, getPlayerUrl, isPlayerEmbed, getFallbackSources, PlayerSource } from '../api/vidy'
import { useStore } from '../store'
import RateModal from '../components/RateModal'
import { syncRating, isAnimeItem } from '../lib/trackers'
import { markSource } from '../lib/playerStatus'

function isPlayerEmbedUrl(url: string) {
  return isPlayerEmbed(url)
}

export default function PlayerPage() {
  const {
    selectedMedia,
    currentStreamUrl,
    setCurrentStreamUrl,
    setSelectedMedia,
    setCurrentPage,
    upsertHistory,
    autoplayNext,
    externalPlayer,
  } = useStore()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [streamUrl, setStreamUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur, setDur] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUI, setShowUI] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [vol, setVol] = useState(1)
  const [rate, setRate] = useState(1)
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [subtitleLabel, setSubtitleLabel] = useState('')
  const [subtitleOffset, setSubtitleOffset] = useState(0)
  const [subSize, setSubSize] = useState(0.65)
  const [subBg, setSubBg] = useState(true)
  const trackRef = useRef<HTMLTrackElement>(null)

  const [autoNextBusy, setAutoNextBusy] = useState(false)
  const [showRate, setShowRate] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const failTried = useRef<string[]>([])
  const [playerSource, setPlayerSource] = useState<PlayerSource>(() => {
    try { return (localStorage.getItem('mfy-player-engine') as PlayerSource) || 'vidy' } catch { return 'vidy' }
  })

  useEffect(() => {
    if (!selectedMedia || selectedMedia.type === 'iptv') {
      if (currentStreamUrl) {
        setStreamUrl(currentStreamUrl)
        setLoaded(true)
        setLoading(false)
      }
      return
    }
    const anime = isAnimeItem(selectedMedia)
    const src: PlayerSource = anime
      ? (['zangetsu', 'miruro', 'mangayomi'].includes(playerSource) ? playerSource : 'zangetsu')
      : playerSource
    const url = getPlayerUrl(
      src,
      selectedMedia.type === 'movie' ? 'movie' : 'tv',
      selectedMedia.id,
      selectedMedia.season,
      selectedMedia.episode,
      anime
    )
    setStreamUrl(url)
    setLoaded(true)
    setLoading(false)
    setError('')
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type, playerSource])

  function tryNextSource() {
    if (!selectedMedia || selectedMedia.type === 'iptv') return
    const kind = selectedMedia.type === 'movie' ? 'movie' : 'tv'
    const list = getFallbackSources(kind, selectedMedia.id, selectedMedia.season, selectedMedia.episode)
    const next = list.find((s) => s.source !== playerSource && !failTried.current.includes(s.source))
    if (!next) return
    markSource(playerSource, false)
    failTried.current.push(playerSource)
    setPlayerSource(next.source)
    setCurrentStreamUrl(next.url)
    try { localStorage.setItem('mfy-player-engine', next.source) } catch {}
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') seek(progress + 10)
      if (e.key === 'ArrowLeft') seek(progress - 10)
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'n' || e.key === 'N') setShowRate(true)
      if (e.key === 'Escape') goBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handleIframeError = () => {}

  useEffect(() => {
    const w = document.querySelector('webview') as any
    if (!w?.addEventListener) return
    const apply = () => {
      try {
        w.insertCSS(`video::cue { font-size: ${subSize}em !important; line-height: 1.2; background: ${subBg ? 'rgba(0,0,0,0.75)' : 'transparent'} !important; color: #fff; }`)
      } catch {}
    }
    w.addEventListener('dom-ready', apply)
    apply()
    return () => { try { w.removeEventListener('dom-ready', apply) } catch {} }
  }, [subSize, subBg, streamUrl])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !streamUrl) return
    if (isPlayerEmbedUrl(streamUrl)) return
    v.src = streamUrl
    v.load()
    v.play().catch(() => {})
    const onTime = () => { setProgress(v.currentTime || 0); setDur(Number.isFinite(v.duration) ? v.duration : 0) }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); handleEnded() }
    const onError = () => setError('The stream could not be loaded.')
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
    }
  }, [streamUrl])

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  async function handleEnded() {
    if (autoplayNext && selectedMedia?.type === 'tv' && !autoNextBusy) {
      setAutoNextBusy(true)
      try {
        const curSeason = selectedMedia.season || 1
        const curEpisode = selectedMedia.episode || 1
        const season = await tmdb.getSeasonDetail(selectedMedia.id as number, curSeason).catch(() => null)
        const eps = season?.episodes || []
        const next = eps.find((e: any) => e.episode_number === curEpisode + 1)
        if (next) {
          setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: curSeason, episode: next.episode_number })
          const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, curSeason, next.episode_number, isAnimeItem(selectedMedia))
          setCurrentStreamUrl(url)
          setLoaded(true)
          setAutoNextBusy(false)
          return
        }
        const d = await tmdb.getTVDetail(selectedMedia.id as number).catch(() => null)
        const seasons = d?.seasons || []
        const nextSeason = seasons.find((s: any) => s.season_number === curSeason + 1 && s.episode_count > 0)
        if (nextSeason) {
          const s = await tmdb.getSeasonDetail(selectedMedia.id as number, nextSeason.season_number).catch(() => null)
          const first = s?.episodes?.[0]
          if (first) {
            setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: nextSeason.season_number, episode: first.episode_number })
            const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, nextSeason.season_number, first.episode_number, isAnimeItem(selectedMedia))
            setCurrentStreamUrl(url)
            setLoaded(true)
            setAutoNextBusy(false)
            return
          }
        }
        setShowRate(true)
      } catch {
        const s = selectedMedia.season || 1
        const e = (selectedMedia.episode || 1) + 1
        setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: s, episode: e })
        setCurrentStreamUrl(getPlayerUrl(playerSource, 'tv', selectedMedia.id, s, e))
        setLoaded(true)
      }
      setAutoNextBusy(false)
    } else if (selectedMedia?.type === 'tv' || selectedMedia?.type === 'movie') {
      setShowRate(true)
    }
  }

  function seek(t: number) {
    if (videoRef.current && Number.isFinite(t)) videoRef.current.currentTime = Math.max(0, Math.min(dur || t, t))
  }

  async function goToEpisode(season: number, episode: number) {
    if (!selectedMedia || selectedMedia.type !== 'tv') return
    if (episode < 1) return
    setAutoNextBusy(true)
    try {
      const seasonData = await tmdb.getSeasonDetail(selectedMedia.id as number, season).catch(() => null)
      const eps = seasonData?.episodes || []
      const target = eps.find((e: any) => e.episode_number === episode)
      if (target) {
        setSelectedMedia({ id: selectedMedia.id, type: 'tv', season, episode: target.episode_number })
        const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, season, target.episode_number)
        setCurrentStreamUrl(url)
        setCurrentPage('player')
      } else {
        const d = await tmdb.getTVDetail(selectedMedia.id as number).catch(() => null)
        const seasons = d?.seasons || []
        const nextSeason = seasons.find((s: any) => s.season_number === season + 1 && s.episode_count > 0)
        if (nextSeason) {
          const s = await tmdb.getSeasonDetail(selectedMedia.id as number, nextSeason.season_number).catch(() => null)
          const first = s?.episodes?.[0]
          if (first) {
            setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: nextSeason.season_number, episode: first.episode_number })
            const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, nextSeason.season_number, first.episode_number, isAnimeItem(selectedMedia))
            setCurrentStreamUrl(url)
            setCurrentPage('player')
          }
        }
      }
    } catch {}
    setAutoNextBusy(false)
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v || isPlayerEmbedUrl(streamUrl)) return
    v.paused ? v.play().catch(() => {}) : v.pause()
  }

  function changeRate(r: number) {
    setRate(r)
    if (videoRef.current && !isPlayerEmbedUrl(streamUrl)) videoRef.current.playbackRate = r
  }

  function fmt(s: number) {
    if (!Number.isFinite(s) || s < 0) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
  }

  function onMouseMove() {
    setShowUI(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => playing && setShowUI(false), 3000)
  }

  async function toggleFullscreen() {
    const api = (window as any).electronAPI
    if (api?.fullscreen) {
      api.fullscreen()
      setFullscreen((v) => !v)
      return
    }
    const root = document.querySelector('.player-stage') as HTMLElement | null
    if (!root) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await root.requestFullscreen()
  }

  async function togglePip(video: HTMLVideoElement | null) {
    if (!video) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (document.pictureInPictureEnabled) await video.requestPictureInPicture()
    } catch (e) { console.warn('PiP failed', e) }
  }

  function leavePlayer(page: 'detail' | 'home' | 'sports' | 'anime' | 'movies' | 'tv') {
    try { (window as any).electronAPI?.exitFullscreen?.() } catch {}
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
    setShowRate(false)
    setCurrentStreamUrl('')
    setCurrentPage(page)
  }

  function goBack() {
    const sport = selectedMedia?.type === 'iptv' || /metegol|streamed|sport/i.test(streamUrl || '')
    if (sport) { leavePlayer('sports'); return }
    if (selectedMedia?.id) { leavePlayer('detail'); return }
    leavePlayer('home')
  }

  function finishRate(score?: number, note?: string) {
    if (score && selectedMedia) {
      const anime = isAnimeItem(selectedMedia)
      const type = anime ? 'anime' : selectedMedia.type === 'movie' ? 'movie' : 'tv'
      const st = useStore.getState()
      syncRating({
        title: String(selectedMedia.id),
        type,
        tmdbId: selectedMedia.id,
        score,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        serializdOn: !!st.serializdSyncEnabled && !anime,
        note,
      }).catch(() => {})
    }
    setShowRate(false)
    leavePlayer(selectedMedia?.id ? 'detail' : 'home')
  }

  const title = selectedMedia ? `${selectedMedia.type === 'movie' ? 'Movie' : 'Series'} ${selectedMedia.id}` : 'MFY Player'

  return (
    <>
    {showRate && (
        <RateModal title={title} kind={isAnimeItem(selectedMedia) ? 'anime' : (selectedMedia?.type === 'movie' ? 'movie' : 'tv')} onSubmit={(s, n) => finishRate(s, n)} onSkip={() => finishRate()} />
      )}
    <div className="mfy-player" onMouseMove={onMouseMove} style={{ background: '#000', minHeight: '100vh' }}>
      <div className={cn('player-topbar', showUI ? 'visible' : 'hidden')} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2">
        <button onClick={goBack} className="player-back flex items-center gap-2 text-white/80 hover:text-white" style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={() => setShowRate(true)} style={{ background: '#FF1493', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}>Mark watched</button>
        </div>
        <div className="player-title text-white font-medium truncate" style={{ maxWidth: 400 }}>{title}</div>
        <div className="player-top-actions flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 10, color: 'white/60' }}>Source:</span>
            <select
              value={playerSource}
              onChange={(e) => {
                const v = e.target.value as PlayerSource
                setPlayerSource(v)
                try { localStorage.setItem('mfy-player-engine', v) } catch {}
              }}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: 6,
                padding: '6px 10px',
                color: 'white',
                fontSize: 11,
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="playtorrio">PlayTorrio</option>
              <option value="simplstream">SimplStream</option>
              <option value="zangetsu">Zangetsu</option>
              <option value="miruro">Miruro</option>
              <option value="vidy">Vidy</option>
            </select>
            <button type="button" onClick={tryNextSource} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', color: 'white', fontSize: 11, cursor: 'pointer' }}>Switch source</button>
            <Zap size={12} style={{ color: '#FFD24C' }} />
          </div>
          <button className="player-icon-button" onClick={toggleFullscreen} style={{ background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}><Maximize size={18} /></button>
        </div>
      </div>

      <div className="player-stage" onClick={togglePlay} style={{ position: 'relative', width: '100%', height: 'calc(100vh - 100px)', minHeight: 400 }}>
        {!loaded && !error && (
          <div className="player-empty" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white/60' }}>
            <div className="player-empty-icon" style={{ fontSize: 48, marginBottom: 16 }}><Play /></div>
            <h2>Loading stream…</h2>
          </div>
        )}
        {error && <div className="player-error" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', padding: 24, textAlign: 'center' }}>{error}</div>}
        {loaded && !error && isPlayerEmbedUrl(streamUrl) && (
          // @ts-expect-error Electron webview
          <webview
            src={streamUrl}
            partition="persist:mfy"
            style={{ width: '100%', height: '100%', background: '#000' }}
            allowpopups="false"
            allowfullscreen="true"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            webpreferences="allowRunningInsecureContent, javascript=yes"
          />
        )}
        {loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <video ref={videoRef} playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
        )}

        {loaded && !error && isPlayerEmbedUrl(streamUrl) && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 30, display: 'flex', gap: 8 }}>
            {(isAnimeItem(selectedMedia) ? (['zangetsu', 'miruro', 'mangayomi'] as PlayerSource[]) : (['playtorrio', 'simplstream', 'vidy'] as PlayerSource[])).map((s) => (
              <button key={s} type="button" onClick={() => { setPlayerSource(s); try { localStorage.setItem('mfy-player-engine', s) } catch {} }}
                style={{ background: playerSource === s ? '#FF1493' : 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8, padding: '8px 10px', color: 'white', fontSize: 11, cursor: 'pointer' }}>
                {s === 'playtorrio' ? 'Auto' : s === 'simplstream' ? '1080' : s === 'vidy' ? 'Vidy' : s === 'zangetsu' ? 'Zangetsu' : s === 'miruro' ? 'Miruro' : 'Manga'}
              </button>
            ))}
            <button type="button" onClick={() => setSubSize((n) => (n <= 0.55 ? 0.9 : 0.55))} style={{ background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8, padding: '8px 10px', color: 'white', cursor: 'pointer' }}>Subs {subSize <= 0.6 ? 'S' : 'M'}</button>
            <button type="button" onClick={() => setSubBg((v) => !v)} style={{ background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8, padding: '8px 10px', color: 'white', cursor: 'pointer' }}>Sub bg {subBg ? 'on' : 'off'}</button>
            <button type="button" onClick={toggleFullscreen} style={{ background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: 8, padding: '8px 10px', color: 'white', cursor: 'pointer' }}>{fullscreen ? 'Exit' : 'Full'}</button>
          </div>
        )}
        {showUI && loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <div className={cn('player-controls', showUI ? 'visible' : 'hidden')} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, padding: '16px 24px 24px', background: 'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, transparent 100%)', pointerEvents: 'auto' }}>
            <div className="player-progress" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur) }} style={{ cursor: 'pointer', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 12 }}>
              <div className="player-progress-fill" style={{ height: '100%', background: '#FF1493', borderRadius: 2, transition: 'width 0.1s linear', width: `${dur ? Math.min(100, (progress / dur) * 100) : 0}%` }} />
            </div>
            <div className="player-control-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div className="player-left-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => seek(progress - 10)} title="Rewind 10s" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SkipBack size={20} /></button>
                <button className="player-main-play" onClick={togglePlay} style={{ background: '#FF1493', border: 'none', borderRadius: '50%', padding: 12, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{playing ? <Pause size={24} /> : <Play size={24} />}</button>
                <button onClick={() => seek(progress + 10)} title="Forward 10s" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SkipForward size={20} /></button>
                {selectedMedia?.type === 'tv' && selectedMedia.season !== undefined && selectedMedia.episode !== undefined && (
                  <>
                    <button onClick={() => goToEpisode(selectedMedia.season!, (selectedMedia.episode || 1) - 1)} title="Previous episode" disabled={selectedMedia.episode === 1} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedMedia.episode === 1 ? 0.5 : 1 }}><SkipBack size={18} /></button>
                    <button onClick={() => goToEpisode(selectedMedia.season!, (selectedMedia.episode || 1) + 1)} title="Next episode" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SkipForward size={18} /></button>
                  </>
                )}
                <button onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{muted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} onChange={(e) => { const value = Number(e.target.value); setVol(value); setMuted(value === 0); if (videoRef.current) { videoRef.current.volume = value; videoRef.current.muted = value === 0 } }} style={{ width: 80, accentColor: '#FF1493' }} />
                <span style={{ color: 'white/70', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{fmt(progress)} / {fmt(dur)}</span>
              </div>
              <div className="player-right-controls" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button title="Playback speed" onClick={() => { const speeds = [1, 1.25, 1.5, 1.75, 2, 0.5, 0.75]; const next = speeds[(speeds.indexOf(rate) + 1) % speeds.length]; changeRate(next) }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 600 }}>{rate}x</button>
                <button title="Picture in Picture" onClick={() => togglePip(videoRef.current)} type="button" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Settings2 size={18} /></button>
                <button onClick={toggleFullscreen} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}