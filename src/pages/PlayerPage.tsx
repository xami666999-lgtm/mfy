import { useEffect, useRef, useState, createElement } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2, Maximize, Minimize, Subtitles, ArrowLeft, Cast, RefreshCw, Zap } from 'lucide-react'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'
import { tmdb, POSTER_URL, BACKDROP_URL, STILL_URL } from '../api/tmdb'
import { vidyUrl, getPlayerUrl, isPlayerEmbed, getFallbackSources, isDeadEmbed, PlayerSource } from '../api/vidy'
import { mediafusionStreams } from '../api/mediafusion'
import { aggregateStreams, bestPlayable } from '../api/stremioAgg'
import { addonStreams, isOnePiece, STREAM_HOST, onePaceStreams } from '../api/stremioAddons'
import { ANIME_SOURCES, MOVIE_TV_SOURCES, ALL_PLAY_SOURCES } from '../api/vidy'
import { useStore } from '../store'
import RateModal from '../components/RateModal'
import IntroSkip from '../components/IntroSkip'
import TogetherPanel from '../components/TogetherPanel'
import { syncRating, isAnimeItem } from '../lib/trackers'
import { nextCanonEpisode } from '../lib/filler'
import { syncFinished } from '../lib/syncWatch'
import { markSource } from '../lib/playerStatus'
import { searchStremioSubtitles } from '../api/subtitles'
import { fetchIntroSegments, type IntroSeg } from '../api/introdb'
import { loadPlaybackPrefs, savePlaybackPrefs } from '../lib/playbackPrefs'
import { resolveFromTorrentio } from '../api/streams'
import { pickBestFile, isTorrentInput } from '../api/torrent'

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
  const [subtitleOffset, setSubtitleOffset] = useState(() => loadPlaybackPrefs().subDelay)
  const [subSize, setSubSize] = useState(0.65)
  const [subColor, setSubColor] = useState('#ffffff')
  const [bright, setBright] = useState(1)
  const [subBg, setSubBg] = useState(false)
  const [subList, setSubList] = useState<{ url: string; name: string; lang: string; format: string }[]>([])
  const [subOpen, setSubOpen] = useState(false)
  const cuesRef = useRef<{ start: number; end: number; text: string }[]>([])
  const [cueText, setCueText] = useState('')
  const [torrents, setTorrents] = useState<{ url: string; name: string; quality: string; size?: string; seeds?: string }[]>([])
  const [magnetBox, setMagnetBox] = useState('')
  const [torrentBusy, setTorrentBusy] = useState('')
  const [fit, setFit] = useState<'contain' | 'cover' | 'fill' | 'full'>('contain')
  const [picks, setPicks] = useState<{ title: string; url: string; quality: string }[]>([])
  const [srcOpen, setSrcOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const sourceNames: Record<string, string> = {
    playtorrio: 'PlayTorrio', simplstream: 'SimplStream', vidy: 'Vidy',
    zangetsu: 'Zangetsu', miruro: 'Miruro', mangayomi: 'Mangayomi',
    mediafusion: 'MediaFusion', flix: 'Flix', nyaa: 'Nyaa', animeflv: 'AnimeFLV',
    onepace: 'One Pace', streamsppv: 'StreamsPPV', sportsstreams: 'Sports Streams', moviebox: 'MovieBox', vixsrc: 'Vixsrc', vidnest: 'Vidnest', animepahe: 'AnimePahe', pengu: 'Pengu', webtorrent: 'WebTorrent', pipe: 'Pipe', torrentio: 'Torrentio', comet: 'Comet', kitsu: 'Kitsu', vlc: 'VLC',
  }
  const trackRef = useRef<HTMLTrackElement>(null)

  const [autoNextBusy, setAutoNextBusy] = useState(false)
  const [stillWatching, setStillWatching] = useState<null | 'idle' | 'next'>(null)
  const autoNextCount = useRef(0)
  const startedAt = useRef(Date.now())
  const bestProgress = useRef(0)
  const bestDuration = useRef(0)
  const lastVideoAt = useRef(0)
  const progressKey = useRef('')
  const [showRate, setShowRate] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [gate, setGate] = useState(true)
  const [together, setTogether] = useState(false)
  const [meta, setMeta] = useState<{ title: string; overview: string; poster: string; backdrop: string } | null>(null)
  const [nextUp, setNextUp] = useState<{ season: number; episode: number; name: string; still?: string; overview?: string } | null>(null)
  const [epName, setEpName] = useState('')
  const [segments, setSegments] = useState<IntroSeg[]>([])
  const [showNext, setShowNext] = useState(false)
  const [expectedSec, setExpectedSec] = useState(0)
  const failTried = useRef<string[]>([])
  const [playerSource, setPlayerSource] = useState<PlayerSource>('playtorrio')

  useEffect(() => {
    const at = Number((selectedMedia as any)?.resumeAt || 0)
    const row = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && Number(h.season || 0) === Number(selectedMedia?.season || 0) && Number(h.episode || 0) === Number(selectedMedia?.episode || 0))
    const saved = Math.max(at, Number(row?.progress || 0))
    if (saved > 8) {
      bestProgress.current = Math.max(bestProgress.current, saved)
      setProgress(saved)
    }
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

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
    const title = String((selectedMedia as any).title || (selectedMedia as any).name || '')
    if (currentStreamUrl && /^https?:/i.test(currentStreamUrl) && !isDeadEmbed(currentStreamUrl)) {
      setStreamUrl(currentStreamUrl)
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    let src: PlayerSource = anime ? 'zangetsu' : 'playtorrio'
    if (isOnePiece(title)) src = 'onepace'
    else if (src === 'webtorrent') src = 'webtorrent'
    else if (anime && !(ANIME_SOURCES as string[]).includes(src) && src !== 'onepace' && src !== 'webtorrent') src = 'zangetsu'
    else if (!anime && !(MOVIE_TV_SOURCES as string[]).includes(src) && src !== 'webtorrent') src = 'playtorrio'
    const embed = getPlayerUrl(src, selectedMedia.type === 'movie' ? 'movie' : 'tv', selectedMedia.id, selectedMedia.season, selectedMedia.episode, anime)
    if (embed && /^https?:/i.test(embed)) {
      setStreamUrl(embed)
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    if (src === 'webtorrent') {
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    if (src === 'moviebox' || src === 'animepahe' || src === 'pengu') {
      setStreamUrl(getPlayerUrl(src, selectedMedia.type === 'movie' ? 'movie' : 'tv', selectedMedia.id, selectedMedia.season, selectedMedia.episode, anime))
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    const addonBase = (STREAM_HOST as any)[src]
    if (addonBase) {
      setLoading(true); setLoaded(false); setError('')
      const kind = selectedMedia.type === 'movie' ? 'movie' : 'series'
      const sid = String((selectedMedia as any).imdb || ('tmdb:' + selectedMedia.id))
      const want = selectedMedia.type === 'movie' ? sid : `${sid}:${selectedMedia.season || 1}:${selectedMedia.episode || 1}`
      const load = src === 'onepace'
        ? onePaceStreams(selectedMedia.season || 1, selectedMedia.episode || 1)
        : addonStreams(addonBase, kind, want)
      load.then((rows) => {
        setPicks(rows)
        const playable = rows.find((r: any) => /^https?:/i.test(r.url) && !/pengu\.uk\/signin|signin\.mp4|pengu\.uk\/direct|attachment|download/i.test(r.url))
        const q = playable || (src === 'pengu' ? null : rows[0])
        if (!q || /pengu\.uk\/signin|signin\.mp4|pengu\.uk\/direct/i.test(q.url || '')) {
          const fallback = getPlayerUrl('playtorrio', selectedMedia.type === 'movie' ? 'movie' : 'tv', selectedMedia.id, selectedMedia.season, selectedMedia.episode, anime)
          setStreamUrl(fallback); setLoaded(true); setLoading(false); return
        }
        setStreamUrl(q.url); setLoaded(true); setLoading(false)
      }).catch(() => {
        const fallback = getPlayerUrl('playtorrio', selectedMedia.type === 'movie' ? 'movie' : 'tv', selectedMedia.id, selectedMedia.season, selectedMedia.episode, anime)
        setStreamUrl(fallback); setLoaded(true); setLoading(false); setError('')
      })
      return
    }
    if (src === 'pipe' || src === 'torrentio' || src === 'comet' || src === 'vlc' || src === 'kitsu') {
      setLoading(true)
      setLoaded(false)
      setError('')
      aggregateStreams({
        type: selectedMedia.type === 'movie' ? 'movie' : 'tv',
        tmdbId: selectedMedia.id,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        anime,
        title,
      }).then((rows) => {
        setPicks(rows)
        const pick = rows.find((r) => /^https?:/i.test(r.url)) || rows[0]
        if (!pick) {
          setError('No Pipe/Torrentio/Comet stream')
          setLoading(false)
          return
        }
        if (src === 'vlc') {
          try { (window as any).electronAPI?.openVlc?.(pick.url) } catch {}
          setLoaded(true)
          setLoading(false)
          return
        }
        setStreamUrl(pick.url)
        setCurrentStreamUrl(pick.url)
        setLoaded(true)
        setLoading(false)
      }).catch(() => {
        setError('Aggregator failed')
        setLoading(false)
      })
      return
    }
    if (src === 'mediafusion') {
      setLoading(true)
      setLoaded(false)
      setError('')
      mediafusionStreams({
        type: selectedMedia.type === 'movie' ? 'movie' : 'tv',
        tmdbId: selectedMedia.id,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        anime,
        malId: (selectedMedia as any).mal_id,
      }).then((rows) => {
        const pick = rows.find((r) => /^https?:/i.test(r.url)) || rows[0]
        if (!pick) {
          setError('MediaFusion found no stream. Switch source.')
          setLoading(false)
          return
        }
        setStreamUrl(pick.url)
        setCurrentStreamUrl(pick.url)
        setLoaded(true)
        setLoading(false)
      }).catch(() => {
        setError('MediaFusion failed')
        setLoading(false)
      })
      return
    }
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

  useEffect(() => {
    if (loaded || error || !selectedMedia || selectedMedia.type === 'iptv') return
    const t = setTimeout(() => tryNextSource(), 2500)
    return () => clearTimeout(t)
  }, [playerSource, selectedMedia?.id, selectedMedia?.episode, loaded, error])

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
      if (e.repeat) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') { e.preventDefault(); seekBy(loadPlaybackPrefs().seekFwd) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seekBy(-loadPlaybackPrefs().seekBack) }
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'n' || e.key === 'N') setShowRate(true)
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); goBack() }
    }
    window.addEventListener('keydown', onKey, true)
    const off = (window as any).electronAPI?.onPlayerEscape?.(() => goBack())
    const offMm = (window as any).electronAPI?.onPlayerMouse?.(() => onMouseMove())
    return () => {
      window.removeEventListener('keydown', onKey, true)
      try { off?.() } catch {}
      try { offMm?.() } catch {}
    }
  })

  const handleIframeError = () => {}

  useEffect(() => {
    const w = document.querySelector('webview') as any
    if (!w?.addEventListener) return
    const apply = () => {
      try {
        w.insertCSS(`
          html, body { width:100% !important; height:100% !important; margin:0 !important; background:#000 !important; }
          video::cue, ::cue { font-size: ${subSize}em !important; line-height: 1.25; background: none !important; background-color: ${subBg ? 'rgba(0,0,0,0.45)' : 'transparent'} !important; text-shadow: none !important; color: #fff !important; }
          #mfy-inplayer { display:none !important; }
        `)
        w.executeJavaScript(`(() => {
          const bar = document.getElementById('mfy-inplayer');
          if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
          document.querySelectorAll('video').forEach(v => {
            v.style.objectFit = '${fit === 'full' ? 'contain' : fit}';
            v.muted = false; v.volume = 1;
            const p = v.play(); if (p && p.catch) p.catch(() => {});
          });
        })()`)
      } catch {}
    }
    w.addEventListener('dom-ready', apply)
    return () => { try { w.removeEventListener('dom-ready', apply) } catch {} }
  }, [subSize, subBg, streamUrl, fit])

  useEffect(() => {
    const row = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && Number(h.season || 0) === Number(selectedMedia?.season || 0) && Number(h.episode || 0) === Number(selectedMedia?.episode || 0))
    const at = Math.max(Number((selectedMedia as any)?.resumeAt || 0), Number(row?.progress || 0), bestProgress.current)
    if (!(at > 15)) return
    const dur = Math.max(Number(row?.duration || 0), bestDuration.current)
    if (dur >= 600 && at / dur >= 0.95) return
    bestProgress.current = Math.max(bestProgress.current, at)
    const ping = () => {
      const w = document.querySelector('webview') as any
      try { w?.send?.('mfy-seek', at) } catch {}
      try {
        w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v || v.readyState < 1) return; if (Math.abs((v.currentTime||0) - ${at}) > 4) v.currentTime = ${at}; })()`)
      } catch {}
      if (videoRef.current && videoRef.current.readyState >= 1) {
        try { if (Math.abs(videoRef.current.currentTime - at) > 4) videoRef.current.currentTime = at } catch {}
      }
    }
    ping()
    const id = setInterval(ping, 700)
    const t = setTimeout(() => clearInterval(id), 22000)
    const w = document.querySelector('webview') as any
    w?.addEventListener?.('dom-ready', ping)
    w?.addEventListener?.('did-finish-load', ping)
    return () => {
      clearInterval(id)
      clearTimeout(t)
      try { w?.removeEventListener?.('dom-ready', ping); w?.removeEventListener?.('did-finish-load', ping) } catch {}
    }
  }, [streamUrl, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

  useEffect(() => {
    const id = setInterval(() => { saveProgress(false).catch(() => {}) }, 20000)
    return () => clearInterval(id)
  }, [selectedMedia?.id, selectedMedia?.episode, streamUrl])

  useEffect(() => {
    if (!subtitleEnabled) { setCueText(''); return }
    let raf = 0
    const tick = () => {
      const hold = loadPlaybackPrefs().subHold
      const t = (progress || 0) + (Number(subtitleOffset) || 0)
      const list = cuesRef.current
      let hit = ''
      for (let i = 0; i < list.length; i++) {
        if (t >= list[i].start && t <= list[i].end + hold) { hit = list[i].text; break }
      }
      setCueText((prev) => prev === hit ? prev : hit)
      raf = window.setTimeout(tick, 80)
    }
    tick()
    return () => clearTimeout(raf)
  }, [subtitleEnabled, progress, subtitleOffset])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !streamUrl) return
    if (isPlayerEmbedUrl(streamUrl)) return
    let hls: { destroy: () => void } | null = null
    const start = () => { v.play().catch(() => {}) }
    if (/\.m3u8(\?|$)/i.test(streamUrl) && !v.canPlayType('application/vnd.apple.mpegurl')) {
      import('hls.js').then(({ default: Hls }) => {
        if (videoRef.current !== v) return
        if (!Hls.isSupported()) { v.src = streamUrl; start(); return }
        const player = new Hls()
        hls = player
        player.loadSource(streamUrl)
        player.attachMedia(v)
        player.on(Hls.Events.MANIFEST_PARSED, start)
        player.on(Hls.Events.ERROR, (_e: unknown, data: { fatal?: boolean }) => { if (data?.fatal) setError('The stream could not be loaded.') })
      }).catch(() => setError('The stream could not be loaded.'))
    } else {
      v.src = streamUrl
      v.load()
      start()
    }
    const onMeta = () => {
      const row = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && Number(h.season || 0) === Number(selectedMedia?.season || 0) && Number(h.episode || 0) === Number(selectedMedia?.episode || 0))
      const at = Number((selectedMedia as any)?.resumeAt || row?.progress || 0)
      if (at > 8 && v.currentTime < 5) v.currentTime = at
    }
    const onTime = () => {
      const cur = v.currentTime || 0
      const d = Number.isFinite(v.duration) ? v.duration : 0
      if (cur > 2) {
        lastVideoAt.current = Date.now()
        bestProgress.current = Math.max(bestProgress.current, cur)
        setProgress(cur)
      }
      if (d > 30) {
        bestDuration.current = Math.max(bestDuration.current, d)
        setDur(d)
      }
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); handleEnded() }
    const onError = () => setError('The stream could not be loaded.')
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('loadedmetadata', onMeta)
    v.addEventListener('loadedmetadata', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    v.addEventListener('error', onError)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('loadedmetadata', onMeta)
      v.removeEventListener('loadedmetadata', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
      v.removeEventListener('error', onError)
      try { hls?.destroy() } catch {}
    }
  }, [streamUrl])

  useEffect(() => {
    if (!selectedMedia?.id || selectedMedia.type === 'iptv') return
    const kind = selectedMedia.type === 'movie' ? 'movie' : 'tv'
    const existing = String((selectedMedia as any).title || (selectedMedia as any).name || '')
    const run = async () => {
      let d: any = null
      try {
        d = kind === 'movie' ? await tmdb.getMovieDetail(selectedMedia.id as number) : await tmdb.getTVDetail(selectedMedia.id as number)
      } catch {}
      setMeta({
        title: d?.title || d?.name || existing || `${kind === 'movie' ? 'Movie' : 'Series'}`,
        overview: d?.overview || (selectedMedia as any).overview || '',
        poster: d?.poster_path || (selectedMedia as any).poster_path || '',
        backdrop: d?.backdrop_path || (selectedMedia as any).backdrop_path || '',
      })
    }
    run()
  }, [selectedMedia?.id, selectedMedia?.type])

  useEffect(() => {
    if (!gate) return
    setCountdown(5)
    const id = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(id)
          setGate(false)
          if (!streamUrl) {
            try {
              const fallback = getPlayerUrl('playtorrio', selectedMedia?.type === 'movie' ? 'movie' : 'tv', selectedMedia?.id as any, selectedMedia?.season, selectedMedia?.episode, isAnimeItem(selectedMedia))
              setStreamUrl(fallback)
              setLoaded(true)
              setError('')
            } catch {}
          }
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [gate, selectedMedia?.id, selectedMedia?.episode])

  useEffect(() => {
    const leave = (e: MouseEvent) => {
      if (!e.relatedTarget && (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) hideChrome()
    }
    window.addEventListener('mouseout', leave)
    document.addEventListener('mouseleave', hideChrome as any)
    return () => {
      window.removeEventListener('mouseout', leave)
      document.removeEventListener('mouseleave', hideChrome as any)
    }
  }, [])

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    const again = () => setTimeout(() => { try { const w=document.querySelector('webview') as any; w?.executeJavaScript?.(`document.querySelectorAll('video').forEach(v=>{v.style.objectFit=getComputedStyle(v).objectFit})`) } catch {} }, 200)
    document.addEventListener('fullscreenchange', again)
    return () => { document.removeEventListener('fullscreenchange', onFullscreen); document.removeEventListener('fullscreenchange', again) }
  }, [])


  useEffect(() => {
    const off = (window as any).electronAPI?.onFlushProgress?.(() => { saveProgress(false).catch(() => {}) })
    return () => { try { off?.() } catch {} }
  }, [selectedMedia?.id, selectedMedia?.episode])

  useEffect(() => {
    const id = setInterval(() => { saveProgress(false).catch(() => {}) }, 4000)
    const onHide = () => { saveProgress(false).catch(() => {}) }
    window.addEventListener('beforeunload', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', onHide)
      document.removeEventListener('visibilitychange', onHide)
      saveProgress(false).catch(() => {})
    }
  }, [selectedMedia?.id, selectedMedia?.episode, playerSource])

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const w = document.querySelector('webview') as any
        const got = await w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v) return null; return { p: v.currentTime || 0, d: v.duration || 0, paused: !!v.paused } })()`)
        if (got) {
          const cur = Number(got.p) || 0
          const d = Number(got.d)
          if (cur >= bestProgress.current - 12) {
            bestProgress.current = Math.max(bestProgress.current, cur)
            setProgress(cur)
          } else if (bestProgress.current > 30 && cur < 12) {
            setProgress(bestProgress.current)
          } else {
            setProgress(cur)
            if (cur > 0) bestProgress.current = cur
          }
          if (Number.isFinite(d) && d > 60) {
            bestDuration.current = Math.max(bestDuration.current, d)
            setDur(d)
          }
          setPlaying(!got.paused)
        }
      } catch {}
    }, 400)
    return () => clearInterval(id)
  }, [streamUrl])

  useEffect(() => {
    const bind = () => {
      const w = document.querySelector('webview') as any
      if (!w || w.__mfyTime) return
      w.__mfyTime = true
      w.addEventListener('ipc-message', (e: any) => {
        if (e.channel !== 'mfy-time') return
        lastVideoAt.current = Date.now()
        const row = e.args?.[0] || {}
        const cur = Number(row.p) || 0
        const d = Number(row.d) || 0
        if (cur > 3) {
          if (cur >= bestProgress.current - 20) {
            bestProgress.current = Math.max(bestProgress.current, cur)
            setProgress(cur)
          }
        }
        if (d > 60) {
          bestDuration.current = Math.max(bestDuration.current, d)
          setDur(d)
        }
      })
    }
    bind()
    const id = setInterval(bind, 1000)
    return () => clearInterval(id)
  }, [streamUrl])

  useEffect(() => {
    const key = `${selectedMedia?.id}-${selectedMedia?.season || 0}-${selectedMedia?.episode || 0}`
    if (progressKey.current !== key) {
      progressKey.current = key
      const row = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && Number(h.season || 0) === Number(selectedMedia?.season || 0) && Number(h.episode || 0) === Number(selectedMedia?.episode || 0))
      let backup = { p: 0, d: 0 }
      try { backup = JSON.parse(localStorage.getItem(`mfy-ep-${selectedMedia?.id}-${selectedMedia?.season || 0}-${selectedMedia?.episode || 0}`) || '{}') } catch {}
      bestProgress.current = Math.max(Number((selectedMedia as any)?.resumeAt || 0), Number(row?.progress || 0), Number(backup.p || 0), 0)
      bestDuration.current = Math.max(Number(row?.duration || 0), Number(backup.d || 0), 0)
      setProgress(bestProgress.current)
      if (bestDuration.current > 0) setDur(bestDuration.current)
      startedAt.current = Date.now() - bestProgress.current * 1000
    }
    setShowUI(true)
    const id = setTimeout(() => setShowUI(false), 2500)
    return () => clearTimeout(id)
  }, [streamUrl, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

  useEffect(() => {
    if (!loaded || gate) return
    const id = setInterval(() => {
      const v = videoRef.current
      if (v && v.currentTime > 1 && !isPlayerEmbedUrl(streamUrl)) return
      const wall = Math.max(0, (Date.now() - startedAt.current) / 1000)
      if (wall < 2) return
      bestProgress.current = Math.max(bestProgress.current, wall)
      setProgress((p) => Math.max(p, wall))
      ;(window as any).__mfyProgress = Math.max(progress, wall)
      if (expectedSec > 60) {
        bestDuration.current = Math.max(bestDuration.current, expectedSec)
        setDur((d) => Math.max(d, expectedSec))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [loaded, gate, streamUrl, expectedSec])

  useEffect(() => {
    setShowNext(false)
    setNextUp(null)
    if (!selectedMedia || selectedMedia.type === 'movie' || selectedMedia.type === 'iptv') return
    const id = Number(selectedMedia.id)
    const season = selectedMedia.season || 1
    const ep = selectedMedia.episode || 1
    ;(async () => {
      const title = String((selectedMedia as any).title || (selectedMedia as any).name || '')
      const hit = await nextCanonEpisode(id, season, ep, title).catch(() => null)
      if (hit) setNextUp({ season: hit.season, episode: hit.episode, name: hit.name, still: hit.still, overview: hit.overview || '' })
    })()
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

  useEffect(() => {
    setSegments([])
    if (!selectedMedia?.id || selectedMedia.type === 'iptv') return
    let live = true
    fetchIntroSegments({
      tmdbId: selectedMedia.id,
      season: selectedMedia.season || 1,
      episode: selectedMedia.episode || 1,
      isMovie: selectedMedia.type === 'movie',
    }).then((rows) => { if (live) setSegments(rows) }).catch(() => {})
    return () => { live = false }
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  useEffect(() => {
    if (!nextUp || !selectedMedia || selectedMedia.type === 'movie') return
    const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, nextUp.season, nextUp.episode, isAnimeItem(selectedMedia))
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.as = 'document'
    link.href = url
    document.head.appendChild(link)
    return () => { try { link.remove() } catch {} }
  }, [nextUp?.season, nextUp?.episode, selectedMedia?.id, playerSource])

  useEffect(() => {
    setSubList([])
    if (!selectedMedia?.id || selectedMedia.type === 'iptv') return
    ;(async () => {
      let imdb = String((selectedMedia as any).imdb || '')
      if (!imdb.startsWith('tt')) {
        try {
          const ids = await tmdb.getExternalIds(selectedMedia.type === 'movie' ? 'movie' : 'tv', Number(selectedMedia.id))
          imdb = ids?.imdb_id || imdb
        } catch {}
      }
      if (!imdb) return
      const rows = await searchStremioSubtitles(
        selectedMedia.type === 'movie' ? 'movie' : 'series',
        imdb,
        selectedMedia.season,
        selectedMedia.episode,
      )
      setSubList(rows)
      const en = rows.find((s) => /^(eng|en|english)$/i.test(s.lang)) || rows[0]
      if (en) applySub(en)
    })()
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  useEffect(() => {
    if (!selectedMedia?.id || selectedMedia.type === 'iptv') return
    ;(async () => {
      let imdb = String((selectedMedia as any).imdb || '')
      if (!imdb.startsWith('tt')) {
        try {
          const ids = await tmdb.getExternalIds(selectedMedia.type === 'movie' ? 'movie' : 'tv', Number(selectedMedia.id))
          imdb = ids?.imdb_id || imdb
        } catch {}
      }
      if (!imdb) return
      const rows = await resolveFromTorrentio(selectedMedia.type === 'movie' ? 'movie' : 'tv', imdb, {
        season: selectedMedia.season,
        episode: selectedMedia.episode,
      })
      const ranked = rows
        .map((s: any) => ({
          url: s.url,
          name: s.name || s.title || 'Torrent',
          quality: s.quality || '',
          size: s.size,
          seeds: s.seeds,
        }))
        .sort((a, b) => {
          const rank = (q: string) => /2160|4k/i.test(q) ? 4 : /1080/i.test(q) ? 3 : /720/i.test(q) ? 2 : 1
          return rank(b.quality) - rank(a.quality) || Number(b.seeds || 0) - Number(a.seeds || 0)
        })
      setTorrents(ranked.slice(0, 20))
    })()
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  async function playMagnet(link: string, label?: string) {
    if (!link) return
    setTorrentBusy(label || 'Starting WebTorrent…')
    try {
      const picked = await pickBestFile(link)
      if (!picked?.streamUrl) { setTorrentBusy('No video file in that torrent'); return }
      setStreamUrl(picked.streamUrl)
      setCurrentStreamUrl(picked.streamUrl)
      setLoaded(true)
      setError('')
      setTorrentBusy(picked.name || 'Playing')
    } catch {
      setTorrentBusy('Torrent failed')
    }
  }

  function parseVtt(raw: string) {
    const toSec = (s: string) => {
      const t = s.trim().split(/\s+/)[0].replace(',', '.')
      const p = t.split(':')
      if (p.length === 3) return Number(p[0]) * 3600 + Number(p[1]) * 60 + Number(p[2])
      if (p.length === 2) return Number(p[0]) * 60 + Number(p[1])
      return 0
    }
    const blocks = raw.replace(/\r/g, '').replace(/\{\\an\d\}/g, '').split(/\n\n+/)
    const out: { start: number; end: number; text: string }[] = []
    for (const b of blocks) {
      const line = b.split('\n').find((l) => l.includes('-->'))
      if (!line) continue
      const [a, c] = line.split('-->')
      const text = b.split('\n').filter((l) => l && !l.includes('-->') && !/^\d+$/.test(l) && l !== 'WEBVTT' && !/^NOTE/.test(l)).join('\n').replace(/<[^>]+>/g, '').trim()
      if (!text) continue
      out.push({ start: toSec(a), end: toSec(c), text })
    }
    return out
  }

  async function applySub(item: { url: string; name: string; format: string }) {
    setSubtitleLabel(item.name)
    setSubtitleEnabled(true)
    setSubOpen(false)
    setCueText('')
    try {
      const api = (window as any).electronAPI
      const raw = api?.fetchText ? (await api.fetchText(item.url, 15000))?.text : await (await fetch(item.url)).text()
      if (!raw) return
      let vtt = raw
      if (!/^WEBVTT/m.test(raw)) {
        vtt = 'WEBVTT\n\n' + raw.replace(/\r/g, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
      }
      cuesRef.current = parseVtt(vtt)
      const w = document.querySelector('webview') as any
      const payload = JSON.stringify(vtt)
      await w?.executeJavaScript?.(`(() => {
        const v = document.querySelector('video'); if (!v) return false;
        [...v.querySelectorAll('track')].forEach((t) => { try { t.track.mode = 'hidden' } catch(e) {} t.remove(); });
        if (v.textTracks) for (let i=0;i<v.textTracks.length;i++) try { v.textTracks[i].mode = 'hidden' } catch(e) {}
        const blob = new Blob([${payload}], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const tr = document.createElement('track');
        tr.kind = 'subtitles'; tr.label = 'MFY'; tr.srclang = 'en'; tr.default = true; tr.src = url;
        v.appendChild(tr);
        const show = () => { try { if (tr.track) tr.track.mode = 'showing' } catch(e) {} };
        tr.addEventListener('load', show); setTimeout(show, 200);
        let s = document.getElementById('mfy-cue');
        if (!s) { s = document.createElement('style'); s.id = 'mfy-cue'; document.documentElement.appendChild(s); }
        s.textContent = 'video::cue{background:transparent!important;background-color:transparent!important;color:#fff!important;text-shadow:0 1px 2px #000,0 0 8px #000;font-weight:700} ::cue{background:none!important}';
        return true;
      })()`)
    } catch {}
  }

  useEffect(() => {
    setExpectedSec(0)
    if (!selectedMedia?.id) return
    ;(async () => {
      try {
        if (selectedMedia.type === 'movie') {
          const d = await tmdb.getMovieDetail(selectedMedia.id as number).catch(() => null)
          const mins = Number(d?.runtime || 0)
          if (mins >= 40) setExpectedSec(mins * 60)
          return
        }
        if (selectedMedia.type === 'tv' || (selectedMedia as any).isAnime) {
          const s = selectedMedia.season || 1
          const e = selectedMedia.episode || 1
          const season = await tmdb.getSeasonDetail(selectedMedia.id as number, s).catch(() => null)
          const ep = (season?.episodes || []).find((x: any) => x.episode_number === e)
          const mins = Number(ep?.runtime || 0)
          if (mins >= 15) setExpectedSec(mins * 60)
          if (ep?.name) setEpName(ep.name)
          else {
            const show = await tmdb.getTVDetail(selectedMedia.id as number).catch(() => null)
            const avg = Number(show?.episode_run_time?.[0] || 0)
            if (avg >= 15) setExpectedSec(avg * 60)
          }
        }
      } catch {}
    })()
  }, [selectedMedia?.id, selectedMedia?.type, selectedMedia?.season, selectedMedia?.episode])

  useEffect(() => {
    const id = setInterval(() => {
      if (!nextUp && !(segments.some((s) => s.kind === 'credits'))) return
      const total = Math.max(expectedSec || 0, Number.isFinite(dur) ? dur : 0, bestDuration.current || 0)
      const p = Math.max(progress || 0, Number((window as any).__mfyProgress) || 0)
      const inCredits = segments.some((s) => s.kind === 'credits' && p >= s.start - 1)
      if (inCredits || (total > 90 && total - p <= 30 && total - p >= -2 && p > 20)) setShowNext(true)
    }, 2000)
    return () => clearInterval(id)
  }, [nextUp, progress, dur, expectedSec, segments])

  function playNextEpisode() {
    if (!selectedMedia || selectedMedia.type === 'movie') return
    const season = nextUp?.season || selectedMedia.season || 1
    const episode = nextUp?.episode || (selectedMedia.episode || 1) + 1
    setShowNext(false)
    setGate(true)
    setLoaded(false)
    startedAt.current = Date.now()
    bestProgress.current = 0
    bestDuration.current = 0
    progressKey.current = `${selectedMedia.id}-${season}-${episode}`
    setProgress(0)
    setDur(0)
    setSelectedMedia({
      ...selectedMedia,
      type: 'tv',
      season,
      episode,
      title: (selectedMedia as any).title,
      resumeAt: 0,
    } as any)
    const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, season, episode, isAnimeItem(selectedMedia))
    setCurrentStreamUrl(url)
    setStreamUrl(url)
    setLoaded(true)
  }

  async function handleEnded() {
    const p = progress
    if (expectedSec > 180 && p < expectedSec * 0.85) {
      const pool = isAnimeItem(selectedMedia) ? ANIME_SOURCES : MOVIE_TV_SOURCES
      const next = pool.find((s) => !failTried.current.includes(s) && s !== playerSource)
      if (next) {
        failTried.current.push(playerSource)
        setPlayerSource(next)
        return
      }
      return
    }
    saveProgress(true).catch(() => {})
    if (!ratedRef.current) {
      setShowRate(true)
      return
    }
    if (nextUp) { playNextEpisode(); return }
    if (autoplayNext && selectedMedia?.type === 'tv' && !autoNextBusy) {
      autoNextCount.current += 1
      if (autoNextCount.current >= 2) {
        setStillWatching('next')
        return
      }
      setAutoNextBusy(true)
      try {
        const curSeason = selectedMedia.season || 1
        const curEpisode = selectedMedia.episode || 1
        const title = String((selectedMedia as any).title || (selectedMedia as any).name || '')
        const next = await nextCanonEpisode(selectedMedia.id as number, curSeason, curEpisode, title)
        if (next) {
          setGate(true)
          setSelectedMedia({ id: selectedMedia.id, type: 'tv', season: next.season, episode: next.episode })
          const url = getPlayerUrl(playerSource, 'tv', selectedMedia.id, next.season, next.episode, isAnimeItem(selectedMedia))
          setCurrentStreamUrl(url)
          setLoaded(true)
          setAutoNextBusy(false)
          return
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
    seekBy(t - (progress || 0))
  }

  const lastSeekAt = useRef(0)
  function seekBy(delta: number) {
    if (!Number.isFinite(delta) || !delta) return
    const now = Date.now()
    if (now - lastSeekAt.current < 280) return
    lastSeekAt.current = now
    try {
      const w = document.querySelector('webview') as any
      w?.executeJavaScript?.(`document.querySelectorAll('video').forEach(v => { v.currentTime = Math.max(0, (v.currentTime || 0) + (${delta})); })`)
    } catch {}
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, (videoRef.current.currentTime || 0) + delta)
    setProgress((p) => Math.max(0, p + delta))
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

  function toggleMute() {
    const next = !muted
    setMuted(next)
    const v = videoRef.current
    if (v) { v.muted = next; v.volume = next ? 0 : 1 }
    try {
      const w = document.querySelector('webview') as any
      w?.executeJavaScript?.(`document.querySelectorAll('video').forEach(v => { v.muted = ${next}; v.volume = ${next ? 0 : 1} })`)
    } catch {}
  }

  function togglePlay() {
    const v = videoRef.current
    if (v && !isPlayerEmbedUrl(streamUrl)) {
      v.paused ? v.play().catch(() => {}) : v.pause()
      return
    }
    try {
      const w = document.querySelector('webview') as any
      w?.executeJavaScript?.(`(() => {
        const v = document.querySelector('video')
        if (!v) return false
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); return true }
        v.pause(); return false
      })()`).then((playingNow: boolean) => { if (typeof playingNow === 'boolean') setPlaying(playingNow) }).catch(() => {})
    } catch {}
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

  function hideChrome() {
    if (timer.current) clearTimeout(timer.current)
    setShowUI(false)
    setSrcOpen(false)
  }
  function onMouseMove() {
    setShowUI(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => hideChrome(), 1400)
  }

  useEffect(() => {
    if (!loaded || error) return
    const t = setTimeout(() => hideChrome(), 900)
    return () => clearTimeout(t)
  }, [loaded, streamUrl])

  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>
    const bump = () => {
      clearTimeout(idle)
      idle = setTimeout(() => setStillWatching('idle'), 60 * 60 * 1000)
    }
    bump()
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    return () => {
      clearTimeout(idle)
      window.removeEventListener('mousemove', bump)
      window.removeEventListener('keydown', bump)
    }
  }, [selectedMedia?.id, selectedMedia?.episode])

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

  async function saveProgress(forceDone = false) {
    if (!selectedMedia || selectedMedia.type === 'iptv') return
    const wall = Math.max(0, (Date.now() - startedAt.current) / 1000)
    let p = Math.max(progress, bestProgress.current)
    if (Date.now() - lastVideoAt.current > 3000) p = Math.max(p, wall)
    let d = Math.max(Number.isFinite(dur) ? dur : 0, bestDuration.current, expectedSec || 0)
    try {
      const w = document.querySelector('webview') as any
      const got = await w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v) return null; return { p: v.currentTime || 0, d: v.duration || 0 } })()`)
      if (got) {
        const cur = Number(got.p) || 0
        const vd = Number(got.d)
        if (cur >= bestProgress.current - 15) p = Math.max(p, cur)
        if (Number.isFinite(vd) && vd > 60) d = Math.max(d, vd)
      }
    } catch {}
    p = Math.max(p, bestProgress.current)
    if (p > 0) bestProgress.current = Math.max(bestProgress.current, p)
    if (d > 0) bestDuration.current = Math.max(bestDuration.current, d)
    const prev = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia.id) && Number(h.season || 0) === Number(selectedMedia.season || 0) && Number(h.episode || 0) === Number(selectedMedia.episode || 0))
    d = Math.max(d, Number(prev?.duration || 0), bestDuration.current)
    p = Math.max(p, Number(prev?.progress || 0) < p ? p : (p >= (Number(prev?.progress || 0) - 15) ? p : Number(prev?.progress || 0)))
    const reallyDone = !!(forceDone || (d >= 10 * 60 && p / d >= 0.95))
    upsertHistory({
      id: `${selectedMedia.id}-${selectedMedia.type}-${selectedMedia.season || 0}-${selectedMedia.episode || 0}`,
      mediaId: selectedMedia.id,
      mediaType: selectedMedia.type === 'movie' ? 'movie' : 'tv',
      title: String((selectedMedia as any).title || (selectedMedia as any).name || prev?.title || selectedMedia.id),
      posterPath: (selectedMedia as any).poster_path || prev?.posterPath || null,
      progress: p,
      duration: d,
      season: selectedMedia.season,
      episode: selectedMedia.episode,
      watchedAt: new Date().toISOString(),
      profileId: useStore.getState().currentProfile?.id || 'default',
      completed: reallyDone,
    })
    if (reallyDone) {
      const anime = isAnimeItem(selectedMedia)
      syncFinished({
        title: String((selectedMedia as any).title || (selectedMedia as any).name || prev?.title || ''),
        tmdbId: selectedMedia.id,
        type: anime ? 'anime' : selectedMedia.type === 'movie' ? 'movie' : 'tv',
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        item: selectedMedia,
      }).catch(() => {})
    }
    try { localStorage.setItem(`mfy-ep-${selectedMedia.id}-${selectedMedia.season || 0}-${selectedMedia.episode || 0}`, JSON.stringify({ p, d, completed: reallyDone, at: Date.now() })) } catch {}
    try {
      await (window as any).electronAPI?.saveProgressRow?.({
        mediaId: String(selectedMedia.id),
        mediaType: selectedMedia.type === 'movie' ? 'movie' : 'tv',
        season: selectedMedia.season || 0,
        episode: selectedMedia.episode || 0,
        progress: p,
        duration: d,
        title: String((selectedMedia as any).title || (selectedMedia as any).name || selectedMedia.id),
        posterPath: (selectedMedia as any).poster_path || prev?.posterPath || null,
        watchedAt: new Date().toISOString(),
        completed: reallyDone,
      })
    } catch {}
  }

  const ratedRef = useRef(false)
  function leavePlayer(page: 'detail' | 'home' | 'sports' | 'anime' | 'movies' | 'tv') {
    saveProgress().catch(() => {})
    try { (window as any).electronAPI?.exitFullscreen?.() } catch {}
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
    const sessionSec = (Date.now() - startedAt.current) / 1000
    setShowRate(false)
    setCurrentStreamUrl('')
    setCurrentPage(page)
  }

  function goBack() {
    const sport = selectedMedia?.type === 'iptv' || /metegol|streamed|sport/i.test(streamUrl || '')
    if (sport) { leavePlayer('sports'); return }
    if (selectedMedia) { leavePlayer('detail'); return }
    leavePlayer('anime')
  }

  function finishRate(score?: number, note?: string) {
    saveProgress(true).catch(() => {})
    if (selectedMedia && !nextUp && selectedMedia.type !== 'movie') {
      upsertHistory({
        id: `${selectedMedia.id}-${selectedMedia.type}-series`,
        mediaId: selectedMedia.id,
        mediaType: 'tv',
        title: String((selectedMedia as any).title || selectedMedia.id),
        posterPath: (selectedMedia as any).poster_path || null,
        progress: expectedSec || 1,
        duration: expectedSec || 1,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        watchedAt: new Date().toISOString(),
        profileId: useStore.getState().currentProfile?.id || 'default',
        completed: true,
        seriesCompleted: true,
      } as any)
    }
    if (score && selectedMedia) {
      const anime = isAnimeItem(selectedMedia)
      const print = /manga|novel|book/i.test(String(selectedMedia.type))
      const type = anime ? 'anime' : print ? (String(selectedMedia.type).includes('novel') ? 'novel' : 'manga') : selectedMedia.type === 'movie' ? 'movie' : 'tv'
      const st = useStore.getState()
      const name = String((selectedMedia as any).title || (selectedMedia as any).name || selectedMedia.id)
      syncRating({
        title: name,
        type: type as any,
        tmdbId: selectedMedia.id,
        score,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        serializdOn: !!st.serializdSyncEnabled && type === 'tv',
        note,
      }).catch(() => {})
    }
    setShowRate(false)
    ratedRef.current = true
    if (nextUp && selectedMedia?.type !== 'movie') {
      playNextEpisode()
      ratedRef.current = false
      return
    }
    const dest = (window as any).__mfyLeavePage || (selectedMedia?.id ? 'detail' : 'home')
    setCurrentStreamUrl('')
    setCurrentPage(dest)
  }

  const title = meta?.title || String((selectedMedia as any)?.title || (selectedMedia as any)?.name || '') || (selectedMedia ? `${selectedMedia.type === 'movie' ? 'Movie' : 'Series'} ${selectedMedia.id}` : 'MFY Player')
  const franchiseLogos = (() => {
    const t = title.toLowerCase()
    const all = [
      { k: /spider-?man|avengers|iron man|marvel|deadpool|x-men|guardians of the galaxy|doctor strange|black panther|thor /, src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/320px-Marvel_Logo.svg.png' },
      { k: /batman|superman|joker|wonder woman|aquaman|flash|dc comics|justice league/, src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DC_Comics_logo.svg/200px-DC_Comics_logo.svg.png' },
      { k: /star wars|mandalorian|andor|ahsoka/, src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/320px-Star_Wars_Logo.svg.png' },
      { k: /harry potter|fantastic beasts/, src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Harry_Potter_wordmark.svg/320px-Harry_Potter_wordmark.svg.png' },
      { k: /one piece/, src: 'https://upload.wikimedia.org/wikipedia/en/2/2d/One_Piece_Logo.png' },
    ]
    return all.filter((x) => x.k.test(t)).map((x) => x.src)
  })()

  return (
    <>
    {together && (
      <TogetherPanel streamUrl={streamUrl} imdbOrId={String((selectedMedia as any)?.imdb || selectedMedia?.id || '')} type={selectedMedia?.type === 'movie' ? 'movie' : 'series'} onClose={() => setTogether(false)} onSplitSports={() => { setTogether(false); setCurrentPage('sports') }} />
    )}
    {showNext && nextUp && (
      <div className="nf-next">
        {nextUp.still
          ? <img src={`${STILL_URL || POSTER_URL}${nextUp.still}`} alt="" />
          : <div className="ph" />}
        <div>
          <p className="kicker">Next episode</p>
          <p className="name">{nextUp.name || `Episode ${nextUp.episode}`}</p>
          <p className="meta">S{nextUp.season} E{nextUp.episode}</p>
          {nextUp.overview && <p className="ov">{nextUp.overview}</p>}
          <div className="row">
            <button type="button" onClick={() => setShowNext(false)}>Not now</button>
            <button type="button" className="go" onClick={playNextEpisode}>Play next</button>
          </div>
        </div>
      </div>
    )}
    {stillWatching && (
      <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center">
        <div className="rounded-3xl bg-[#120a12] border border-white/15 px-10 py-8 text-center max-w-md">
          <div className="text-[#e50914] text-[10px] tracking-[0.35em] mb-3">MFY</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Are you still watching?</h2>
          <p className="text-sm text-white/50 mb-6">Playback paused so it does not keep going.</p>
          <div className="flex justify-center gap-3">
            <button type="button" className="h-11 px-6 rounded-full bg-white text-black text-sm font-semibold" onClick={() => {
              const kind = stillWatching
              autoNextCount.current = 0
              setStillWatching(null)
              setAutoNextBusy(false)
              if (kind === 'next') handleEnded()
            }}>Continue</button>
            <button type="button" className="h-11 px-6 rounded-full bg-white/10 text-white text-sm" onClick={() => { setStillWatching(null); leavePlayer('detail') }}>Stop</button>
          </div>
        </div>
      </div>
    )}
    {showRate && (
        <RateModal title={title} kind={isAnimeItem(selectedMedia) ? 'anime' : (selectedMedia?.type === 'movie' ? 'movie' : 'tv')} onSubmit={(s, n) => finishRate(s, n)} onSkip={() => finishRate()} />
      )}
        <div className="mfy-player" onMouseMove={onMouseMove} style={{ background: '#000', minHeight: '100vh', cursor: showUI ? 'default' : 'none' }}>
      <div className="player-stage" style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh', overflow: 'hidden' }}
        onMouseMove={onMouseMove}
        onClick={(e) => { if ((e.target as HTMLElement).closest('button, input, a, .mfy-bar')) return; togglePlay() }}
      >
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
          <filter id="mfy-sharpen">
            <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.4 0 -0.4 2.6 -0.4 0 -0.4 0" />
          </filter>
          <filter id="mfy-anime">
            <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
          </filter>
        </svg>
        {(gate || (!loaded && !error)) && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: meta?.backdrop
              ? `center/cover url(${BACKDROP_URL}${meta.backdrop})`
              : '#0b0710',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(28px)', background: 'rgba(8,6,12,0.55)' }} />
            {franchiseLogos.map((src) => (
              <img key={src} src={src} alt="" style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', height: 36, opacity: 0.9, zIndex: 2 }} />
            ))}
            <div style={{
              position: 'relative', zIndex: 3, display: 'flex', gap: 16, alignItems: 'center',
              background: 'rgba(16,12,20,0.92)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: 14, maxWidth: 560, width: 'min(560px, 92vw)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            }}>
              {meta?.poster && (
                <img src={`${POSTER_URL}${meta.poster}`} alt="" style={{ width: 92, height: 138, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.4, color: '#e50914', fontWeight: 700, marginBottom: 4 }}>
                  {selectedMedia?.type === 'movie' ? 'MOVIE' : isAnimeItem(selectedMedia) ? 'ANIME' : 'SERIES'}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {meta?.overview || 'Ready when you are.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => setGate(false)} style={{ background: '#e50914', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                    ▶ Play Now
                  </button>
                  <button type="button" onClick={() => leavePlayer('detail')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Later
                  </button>
                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 6 }}>
                    auto-playing… {countdown}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {error && <div className="player-error" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', padding: 24, textAlign: 'center' }}>{error}</div>}
        {loaded && !error && isPlayerEmbedUrl(streamUrl) && !(window as any).electronAPI && (
          <iframe
            ref={iframeRef}
            key={streamUrl}
            src={streamUrl}
            title={title || 'Player'}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            onError={() => tryNextSource()}
            style={{ width: '100%', height: '100%', border: 0, background: '#000', filter: `brightness(${bright})` }}
          />
        )}
        {loaded && !error && isPlayerEmbedUrl(streamUrl) && (window as any).electronAPI && createElement('webview', {
          key: streamUrl,
          src: streamUrl,
          partition: 'persist:mfy',
          style: { width: '100%', height: '100%', background: '#000' },
          allowpopups: 'false',
          useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        })}
        {loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <video ref={videoRef} playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: fit === 'full' ? 'contain' : fit, background: '#000', filter: `${loadPlaybackPrefs().upscale === 'anime' ? 'url(#mfy-anime) contrast(1.08) saturate(1.12) ' : loadPlaybackPrefs().upscale === 'sharpen' ? 'url(#mfy-sharpen) contrast(1.05) ' : ''}brightness(${bright})` }} />
        )}
        {cueText && (
          <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: 96, zIndex: 30, textAlign: 'center', pointerEvents: 'none', fontSize: Math.round(22 * subSize + 10), fontWeight: 700, color: subColor, lineHeight: 1.35, textShadow: '0 2px 8px #000', background: subBg ? 'rgba(0,0,0,0.55)' : 'transparent', padding: '4px 8px', whiteSpace: 'pre-wrap' }}>
            {cueText}
          </div>
        )}
        <IntroSkip />
        {showUI && loaded && !error && (
          <div className="nf-top">
            <button type="button" onClick={goBack}>←</button>
          </div>
        )}

        {showUI && loaded && !error && (
          <div className="mfy-bar nf-chrome" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const prefs = loadPlaybackPrefs()
              const total = Math.max(expectedSec || 0, Number.isFinite(dur) ? dur : 0, bestDuration.current || 0, progress || 0)
              const left = Math.max(0, total - progress)
              const pct = total > 0 ? Math.min(100, (progress / total) * 100) : 0
              const epBit = selectedMedia && selectedMedia.type !== 'movie' && selectedMedia.type !== 'iptv'
                ? `S${selectedMedia.season || 1} E${selectedMedia.episode || 1}${epName ? ` ${epName}` : ''}`
                : ''
              const sources = selectedMedia && selectedMedia.type !== 'iptv'
                ? getFallbackSources(selectedMedia.type === 'movie' ? 'movie' : 'tv', selectedMedia.id, selectedMedia.season, selectedMedia.episode)
                : []
              return (
                <>
                  <div className="nf-scrub">
                    <div className="nf-scrub-hit" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (total > 0) seek((e.clientX - r.left) / r.width * total) }}>
                      <b style={{ width: `${pct}%` }} />
                      <i style={{ left: `${pct}%` }} />
                    </div>
                    <span>{fmt(left)}</span>
                  </div>
                  <div className="nf-row">
                    <div className="nf-left">
                      <button type="button" className="nf-play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <Pause size={26} /> : <Play size={26} fill="currentColor" />}</button>
                      <button type="button" className="nf-jump" onClick={() => seekBy(-prefs.seekBack)} aria-label="Rewind"><span>{prefs.seekBack}</span></button>
                      <button type="button" className="nf-jump fwd" onClick={() => seekBy(prefs.seekFwd)} aria-label="Forward"><span>{prefs.seekFwd}</span></button>
                      <button type="button" className="nf-ico" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
                    </div>
                    <div className="nf-ep">{title}{epBit ? `  ${epBit}` : ''}</div>
                    <div className="nf-right">
                      <button type="button" className="nf-ico" onClick={() => { setHelpOpen((v) => !v); setSrcOpen(false) }} aria-label="Help">?</button>
                      {selectedMedia && selectedMedia.type !== 'movie' && selectedMedia.type !== 'iptv' && (
                        <button type="button" className="nf-ico" title="Next episode" onClick={playNextEpisode}>▶▶</button>
                      )}
                      <button type="button" className="nf-ico" title="Picture in picture" onClick={() => togglePip(videoRef.current)}>▢</button>
                      <button type="button" className="nf-ico" title="Sources and subtitles" onClick={() => { setSrcOpen((v) => !v); setHelpOpen(false) }}>···</button>
                      <button type="button" className="nf-ico" onClick={toggleFullscreen} aria-label="Fullscreen">{fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</button>
                    </div>
                  </div>
                  {helpOpen && (
                    <div className="nf-pop">Space plays and pauses. Arrows seek {prefs.seekBack}s and {prefs.seekFwd}s. F is fullscreen. Subtitles stay up {prefs.subHold || 0}s longer.</div>
                  )}
                  {srcOpen && (
                    <div className="nf-pop nf-more">
                      <p>Sources</p>
                      {sources.map((s) => (
                        <button key={s.source} type="button" className={s.source === playerSource ? 'on' : ''} onClick={() => { setPlayerSource(s.source); setCurrentStreamUrl(s.url); setStreamUrl(s.url); setLoaded(true); setSrcOpen(false) }}>{sourceNames[s.source] || s.source}</button>
                      ))}
                      <p>Subtitles</p>
                      <button type="button" onClick={() => { setSubtitleEnabled(false); setCueText(''); setSrcOpen(false) }}>Off</button>
                      {subList.map((s) => (
                        <button key={s.url} type="button" onClick={() => applySub(s)}>{(s.lang || '').toUpperCase()} · {s.name}</button>
                      ))}
                      <div className="nf-tools">
                        <button type="button" onClick={() => { const n = +((subtitleOffset || 0) - 0.5).toFixed(1); setSubtitleOffset(n); savePlaybackPrefs({ subDelay: n }) }}>Delay −</button>
                        <button type="button" onClick={() => { const n = +((subtitleOffset || 0) + 0.5).toFixed(1); setSubtitleOffset(n); savePlaybackPrefs({ subDelay: n }) }}>Delay +</button>
                        <button type="button" onClick={() => savePlaybackPrefs({ subHold: +Math.min(8, loadPlaybackPrefs().subHold + 0.5).toFixed(1) })}>Hold +</button>
                        <button type="button" onClick={() => setFit((f) => f === 'contain' ? 'cover' : f === 'cover' ? 'fill' : 'contain')}>{fit === 'cover' ? 'Crop' : fit === 'fill' ? 'Fill' : 'Fit'}</button>
                        <button type="button" onClick={() => { const cur = loadPlaybackPrefs().upscale; savePlaybackPrefs({ upscale: cur === 'off' ? 'sharpen' : cur === 'sharpen' ? 'anime' : 'off' }) }}>{loadPlaybackPrefs().upscale === 'off' ? 'Sharpen' : loadPlaybackPrefs().upscale === 'sharpen' ? 'Anime' : 'Normal'}</button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
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