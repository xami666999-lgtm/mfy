import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2, Maximize, Minimize, Subtitles, ArrowLeft, Cast, RefreshCw, Zap } from 'lucide-react'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { vidyUrl, getPlayerUrl, isPlayerEmbed, getFallbackSources, PlayerSource } from '../api/vidy'
import { useStore } from '../store'

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
  const trackRef = useRef<HTMLTrackElement>(null)

  const [autoNextBusy, setAutoNextBusy] = useState(false)
  const [playerSource, setPlayerSource] = useState<PlayerSource>(() => {
    try { return (localStorage.getItem('mfy-player-engine') as PlayerSource) || 'vidy' } catch { return 'vidy' }
  })

  useEffect(() => {
    const direct = currentStreamUrl && (
      !selectedMedia ||
      selectedMedia.type === 'iptv' ||
      /youtube|youtu\.be|nadeko|yewtu|invidious|m3u8|\.mp4|\.m4a|metegol|embed\/|itunes/.test(currentStreamUrl)
    )
    if (direct && currentStreamUrl) {
      setStreamUrl(currentStreamUrl)
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    if (!selectedMedia || selectedMedia.type === 'iptv') return
    const url = getPlayerUrl(
      playerSource,
      selectedMedia.type === 'movie' ? 'movie' : 'tv',
      selectedMedia.id,
      selectedMedia.season,
      selectedMedia.episode
    )
    setStreamUrl(url)
    setCurrentStreamUrl(url)
    setLoaded(true)
    setLoading(false)
    setError('')
  }, [selectedMedia, playerSource, currentStreamUrl])

  const handleIframeError = () => {
    if (/youtube|nadeko|yewtu|invidious|itunes|m3u8/.test(streamUrl || currentStreamUrl || '')) return
    const sources = getFallbackSources(
      selectedMedia?.type === 'movie' ? 'movie' : 'tv',
      selectedMedia?.id,
      selectedMedia?.season,
      selectedMedia?.episode
    )
    const currentIndex = sources.findIndex(s => s.source === playerSource)
    const nextSource = sources[(currentIndex + 1) % sources.length]
    if (nextSource && nextSource.source !== playerSource) {
      setPlayerSource(nextSource.source)
      setError(`Trying ${nextSource.source}...`)
    } else {
      setError('Stream not available on any source')
    }
  }

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
          const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, curSeason, next.episode_number)
          setCurrentStreamUrl(url)
          setCurrentPage('player')
        } else {
const d = await tmdb.getTVDetail(selectedMedia.id as number).catch(() => null)
          const seasons = d?.seasons || []
          const nextSeason = seasons.find((s: any) => s.season_number === curSeason + 1 && s.episode_count > 0)
          if (nextSeason) {
const s = await tmdb.getSeasonDetail(selectedMedia.id as number, nextSeason.season_number).catch(() => null)
            const first = s?.episodes?.[0]
            if (first) {
              setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: nextSeason.season_number, episode: first.episode_number })
              const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, nextSeason.season_number, first.episode_number)
              setCurrentStreamUrl(url)
              setCurrentPage('player')
            }
          }
        }
      } catch {}
      setAutoNextBusy(false)
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
            const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, nextSeason.season_number, first.episode_number)
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
    if (isPlayerEmbedUrl(streamUrl)) {
      const iframe = iframeRef.current
      if (!iframe) return
      if (document.fullscreenElement === iframe) {
        await document.exitFullscreen()
      } else {
        await iframe.requestFullscreen()
      }
    } else {
      const root = videoRef.current?.parentElement?.parentElement
      if (!root) return
      if (document.fullscreenElement === root) {
        await document.exitFullscreen()
      } else {
        await root.requestFullscreen()
      }
    }
  }

  async function togglePip(video: HTMLVideoElement | null) {
    if (!video) return
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (document.pictureInPictureEnabled) await video.requestPictureInPicture()
    } catch (e) { console.warn('PiP failed', e) }
  }

  function goBack() {
    setSelectedMedia(null)
    setCurrentPage('detail')
  }

  const title = selectedMedia ? `${selectedMedia.type === 'movie' ? 'Movie' : 'Series'} ${selectedMedia.id}` : 'MFY Player'

  return (
    <div className="mfy-player" onMouseMove={onMouseMove} style={{ background: '#000', minHeight: '100vh' }}>
      <div className={cn('player-topbar', showUI ? 'visible' : 'hidden')} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <button onClick={goBack} className="player-back flex items-center gap-2 text-white/80 hover:text-white" style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back
        </button>
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
            style={{ width: '100%', height: '100%', background: '#000' }}
            allowpopups="true"
            webpreferences="allowRunningInsecureContent, javascript=yes"
          />
        )}
        {loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <video ref={videoRef} playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
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
  )
}

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}