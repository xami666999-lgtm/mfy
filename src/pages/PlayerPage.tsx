import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, Settings2, Subtitles, AlertCircle
} from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { isTorrentInput, pickBestFile, onTorrentProgress, formatBytes, formatSpeed } from '../api/torrent'
import { tmdb } from '../api/tmdb'
import { AddonStreamService, type Stream } from '../services/addonStreamService'

function isHls(url: string) { return /\.m3u8(?:$|\?)/i.test(url) }
function isDash(url: string) { return /\.mpd(?:$|\?)/i.test(url) }
function isDirectMedia(url: string) { return /\.(m3u8|mpd|mp4|webm|mkv|mov|avi|ts)(?:$|\?)/i.test(url) }
function isEmbed(url: string) {
  return Boolean(
    url &&
    /^https?:/i.test(url) &&
    !isDirectMedia(url) &&
    !isTorrentInput(url)
  )
}
async function togglePip(video: HTMLVideoElement | null) {
  if (!video) return
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture()
    }
  } catch (e) {
    console.warn('PiP failed', e)
  }
}

function srtToVtt(input: string) {
  if (/^WEBVTT/m.test(input)) return input
  return `WEBVTT\n\n${input.replace(/\r?\n/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
}

export default function PlayerPage() {
  const { selectedMedia, currentStreamUrl, setCurrentStreamUrl, setCurrentPage, upsertHistory, autoplayNext } = useStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<any>(null)
  const shakaRef = useRef<any>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [streamUrl, setStreamUrl] = useState(currentStreamUrl || '')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur, setDur] = useState(0)
  const [vol, setVol] = useState(1)
  const [muted, setMuted] = useState(false)
  const [showUI, setShowUI] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [subtitleUrl, setSubtitleUrl] = useState('')
  const [subtitleLabel, setSubtitleLabel] = useState('')
  const [subtitleEnabled, setSubtitleEnabled] = useState(true)
  const trackRef = useRef<HTMLTrackElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [loaded, setLoaded] = useState(Boolean(currentStreamUrl))
  const [pipActive, setPipActive] = useState(false)
  const [torrentInfo, setTorrentInfo] = useState<any>(null)
  const [addonStreams, setAddonStreams] = useState<Stream[]>([])
  const [addonsLoading, setAddonsLoading] = useState(false)
  const stallTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // If a torrent is buffering with no peers for ~25s, give up and offer a way
  // out instead of buffering forever.
  useEffect(() => {
    if (!torrentInfo || !torrentInfo.infoHash) return
    if (torrentInfo.numPeers > 0 || torrentInfo.progress > 0) {
      if (stallTimer.current) {
        clearTimeout(stallTimer.current)
        stallTimer.current = null
      }
      return
    }
    if (!stallTimer.current) {
      stallTimer.current = setTimeout(() => {
        stallTimer.current = null
        setError('No peers found for this torrent. It may be dead — pick another source.')
      }, 25000)
    }
    return () => {
      if (stallTimer.current) {
        clearTimeout(stallTimer.current)
        stallTimer.current = null
      }
    }
  }, [torrentInfo])

  // Post-play episode rating prompt
  const [showRating, setShowRating] = useState(false)
  const [ratingHover, setRatingHover] = useState(0)
  const ratingKey = selectedMedia ? `mfy-rating:${selectedMedia.type}-${selectedMedia.id}-${selectedMedia.season ?? 0}-${selectedMedia.episode ?? 0}` : null

  function saveRating(stars: number) {
    if (!ratingKey) return
    try {
      localStorage.setItem(ratingKey, String(stars))
      localStorage.setItem(`${ratingKey}:at`, new Date().toISOString())
    } catch {}
    setShowRating(false)
  }
  function openRatingPrompt() {
    if (selectedMedia && ratingKey && localStorage.getItem(ratingKey) == null) {
      setShowRating(true)
    }
  }

  // Load addon streams (Torrentio / Comet / Sports) for quick source picking
  useEffect(() => {
    let cancelled = false
    if (!selectedMedia) return
    setAddonsLoading(true)
    setAddonStreams([])
    ;(async () => {
      try {
        const ext = await tmdb.getExternalIds(selectedMedia.type, selectedMedia.id)
        const imdbId = ext?.imdb_id
        if (imdbId && !cancelled) {
          const type = selectedMedia.type === 'movie' ? 'movie' : 'series'
          const streams = await AddonStreamService.getStreams(imdbId, type)
          if (!cancelled) setAddonStreams(streams)
        }
      } catch {}
      if (!cancelled) setAddonsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedMedia])

  useEffect(() => {
    const unsub = onTorrentProgress((t) => {
      setTorrentInfo(t)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    setStreamUrl(currentStreamUrl || '')
  }, [currentStreamUrl])

  // Persist continue-watching progress every ~5s while playing
  useEffect(() => {
    const v = videoRef.current
    if (!v || !selectedMedia) return
    const id = setInterval(() => {
      if (!v.duration || v.paused) return
      upsertHistory({
        id: `${selectedMedia.type}-${selectedMedia.id}-${selectedMedia.season || 0}-${selectedMedia.episode || 0}`,
        mediaId: selectedMedia.id,
        mediaType: selectedMedia.type,
        title: document.title || 'Watching',
        posterPath: null,
        progress: v.currentTime,
        duration: v.duration,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        watchedAt: new Date().toISOString(),
        profileId: 'default',
      })
    }, 5000)

  return () => clearInterval(id)
  }, [selectedMedia, loaded])


  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => { setProgress(v.currentTime || 0); setDur(Number.isFinite(v.duration) ? v.duration : 0) }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); openRatingPrompt() }
    const onError = () => setError('The stream could not be loaded. Check the URL or choose another source.')
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
  }, [])

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)

  return () => {
      document.removeEventListener('fullscreenchange', onFullscreen)
      hlsRef.current?.destroy?.()
      shakaRef.current?.destroy?.()
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (currentStreamUrl) loadStream(currentStreamUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamUrl])

  async function loadStream(url: string) {
    const v = videoRef.current
    if (!v || !url.trim()) return
    setLoading(true)
    setLoaded(false)
    setError('')
    setProgress(0)
    setDur(0)
    hlsRef.current?.destroy?.()
    hlsRef.current = null
    await shakaRef.current?.destroy?.()
    shakaRef.current = null
    v.removeAttribute('src')
    v.load()

    try {
      let clean = url.trim()
      if (isTorrentInput(clean)) {
        setStreamUrl(clean)
        const torrentRes = await pickBestFile(clean)
        if (!torrentRes?.streamUrl) {
          throw new Error('No playable file found in that torrent.')
        }
        clean = torrentRes.streamUrl
      }
      if (isEmbed(clean)) {
        setStreamUrl(clean)
        setCurrentStreamUrl(clean)
        setLoaded(true)
        return
      }
      if (isHls(clean)) {
        const mod = await import('hls.js')
        const HlsCtor: any = (mod as any).default || mod
        if (HlsCtor.isSupported()) {
          const hls = new HlsCtor({ enableWorker: true, lowLatencyMode: false })
          hls.loadSource(clean)
          hls.attachMedia(v)
          hls.on(HlsCtor.Events.ERROR, (_event: any, data: any) => {
            if (data?.fatal) setError('HLS playback failed. Try another source.')
          })
          hlsRef.current = hls
        } else {
          v.src = clean
        }
      } else if (isDash(clean)) {
        const mod: any = await import('shaka-player')
        const shaka: any = mod.default || mod
        shaka.polyfill?.installAll?.()
        if (!shaka.Player?.isBrowserSupported?.()) throw new Error('DASH playback is not supported by this build.')
        const player = new shaka.Player(v)
        player.addEventListener('error', (e: any) => setError(`DASH playback error${e?.detail?.code ? ` (${e.detail.code})` : ''}.`))
        await player.load(clean)
        shakaRef.current = player
      } else {
        v.src = clean
        await v.load()
      }
      setCurrentStreamUrl(clean)
      setLoaded(true)
      await v.play().catch(() => {})
    } catch (e: any) {
      setError(e?.message || 'Unable to initialize the player.')
    } finally {
      setLoading(false)
    }
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v || !streamUrl) return
    v.paused ? v.play().catch(() => {}) : v.pause()
  }

  function seek(t: number) {
    if (videoRef.current && Number.isFinite(t)) videoRef.current.currentTime = Math.max(0, Math.min(dur || t, t))
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
    const root = videoRef.current?.parentElement?.parentElement
    if (!root) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await root.requestFullscreen()
  }

  async function handleSubtitle(file: File) {
    const text = await file.text()
    const blob = new Blob([srtToVtt(text)], { type: 'text/vtt' })
    const url = URL.createObjectURL(blob)
    setSubtitleUrl(url)
    setSubtitleLabel(file.name)
    setSubtitleEnabled(true)
  }

  const title = selectedMedia ? `${selectedMedia.type === 'movie' ? 'Movie' : 'Series'} ${selectedMedia.id}` : 'MFY Player'
  const embedStream = isEmbed(streamUrl)

  return (
    <div className="mfy-player" onMouseMove={onMouseMove}>
      <div className={cn('player-topbar', showUI ? 'visible' : 'hidden')}>
        <button onClick={() => setCurrentPage('detail')} className="player-back"><ArrowLeft /> Back</button>
        <div className="player-title">{title}</div>
        <div className="player-top-actions">
          {addonStreams.length > 0 && (
            <select
              className="player-addon-select"
              value=""
              onChange={(e) => {
                if (e.target.value) loadStream(e.target.value)
              }}
            >
              <option value="">Addons · {addonsLoading ? 'loading…' : `${addonStreams.length} sources`}</option>
              {addonStreams.map((s, i) => (
                <option key={`${s.source}-${i}`} value={s.url}>
                  {s.title} - {s.source}
                  {typeof s.seeders === 'number' ? ` (${s.seeders} peers)` : ''}
                </option>
              ))}
            </select>
          )}
          {!embedStream && (
            <label className="player-icon-button" title="Load subtitles">
              <Subtitles />
              <input type="file" accept=".srt,.vtt,text/vtt" hidden onChange={(e) => e.target.files?.[0] && handleSubtitle(e.target.files[0])} />
            </label>
          )}
          <button className="player-icon-button" onClick={toggleFullscreen}><Maximize /></button>
        </div>
      </div>

      <div className="player-stage" onClick={togglePlay}>
        {isEmbed(streamUrl) ? (
          <iframe
            title="Stream"
            src={streamUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        ) : (
        <video ref={videoRef} playsInline preload="metadata">
          {subtitleUrl && <track ref={trackRef} kind="subtitles" src={subtitleUrl} srcLang="en" label={subtitleLabel || 'Subtitles'} default />}
        </video>
        )}
        {!loaded && (
          <div className="player-empty" onClick={(e) => e.stopPropagation()}>
            <div className="player-empty-icon"><Play /></div>
            <h2>No source selected</h2>
            <p>Pick a stream from the title's stream list to start watching.</p>
            <div className="test-links">
              <button onClick={() => setCurrentPage('detail')}>Back to streams</button>
              <button onClick={() => setCurrentPage('home')}>Home</button>
            </div>
          </div>
        )}
        {loading && <div className="player-loading">Loading stream…</div>}
        {torrentInfo && torrentInfo.progress < 1 && !error && (
          <div className="player-loading torrent-status">
            <div className="torrent-progress-bar">
              <div className="torrent-progress-fill" style={{ width: `${Math.round((torrentInfo.progress || 0) * 100)}%` }} />
            </div>
            <span>
              Torrent buffering · {Math.round((torrentInfo.progress || 0) * 100)}% ·{' '}
              {formatSpeed(torrentInfo.downloadSpeed || 0)} down · {torrentInfo.numPeers || 0} peers
            </span>
          </div>
        )}
        {error && <div className="player-error"><AlertCircle /> {error}</div>}
      </div>

      {!embedStream && (
      <div className={cn('player-controls', showUI ? 'visible' : 'hidden')} onClick={(e) => e.stopPropagation()}>
        <div className="player-progress" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur) }}>
          <div className="player-progress-fill" style={{ width: `${dur ? Math.min(100, (progress / dur) * 100) : 0}%` }} />
        </div>
        <div className="player-control-row">
          <div className="player-left-controls">
            <button onClick={() => seek(progress - 10)}><SkipBack /></button>
            <button className="player-main-play" onClick={togglePlay}>{playing ? <Pause /> : <Play />}</button>
            <button onClick={() => seek(progress + 10)}><SkipForward /></button>
            <button onClick={() => { const next = !muted; setMuted(next); if (videoRef.current) videoRef.current.muted = next }}>{muted ? <VolumeX /> : <Volume2 />}</button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : vol} onChange={(e) => { const value = Number(e.target.value); setVol(value); setMuted(value === 0); if (videoRef.current) { videoRef.current.volume = value; videoRef.current.muted = value === 0 } }} />
            <span>{fmt(progress)} / {fmt(dur)}</span>
          </div>
          <div className="player-right-controls">
            {subtitleLabel && <button className={cn('subtitle-toggle', subtitleEnabled && 'on')} onClick={() => { const next = !subtitleEnabled; setSubtitleEnabled(next); const track = trackRef.current?.track; if (track) track.mode = next ? 'showing' : 'hidden' }} title="Toggle subtitles"><Subtitles /> {subtitleEnabled ? 'CC On' : 'CC Off'}</button>}
            <button title="Picture in Picture" onClick={() => togglePip(videoRef.current)} type="button"><Settings2 /></button>
            <button title="PiP" type="button" onClick={() => togglePip(videoRef.current)} className="text-[10px] px-2">PiP</button>
            <button onClick={toggleFullscreen}>{fullscreen ? <Minimize /> : <Maximize />}</button>
          </div>
      </div>
    </div>
    )}

    {showRating && selectedMedia && (
      <div className="rating-overlay" onClick={() => setShowRating(false)}>
        <div className="rating-card" onClick={(e) => e.stopPropagation()}>
          <div className="rating-title">Rate this {selectedMedia.type === 'movie' ? 'movie' : 'episode'}</div>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = star <= (ratingHover || 0)
              return (
                <button
                  key={star}
                  type="button"
                  className="rating-star"
                  style={{ color: filled ? '#FFD24C' : '#555' }}
                  onMouseEnter={() => setRatingHover(star)}
                  onMouseLeave={() => setRatingHover(0)}
                  onClick={() => saveRating(star)}
                  aria-label={`${star} stars`}
                >
                  ★
                </button>
              )
            })}
          </div>
          <button type="button" className="rating-skip" onClick={() => setShowRating(false)}>Not now</button>
          <div className="rating-note">Your rating is saved locally and shown on posters.</div>
        </div>
      </div>
    )}
  </div>
  )
}
