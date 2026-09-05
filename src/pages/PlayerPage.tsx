import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2, Maximize, Minimize, Subtitles, ArrowLeft, Cast, RefreshCw, Zap } from 'lucide-react'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { vidyUrl, getPlayerUrl, isPlayerEmbed, getFallbackSources, PlayerSource } from '../api/vidy'
import { mediafusionStreams } from '../api/mediafusion'
import { addonStreams, isOnePiece, STREAM_HOST, onePaceStreams } from '../api/stremioAddons'
import { ANIME_SOURCES, MOVIE_TV_SOURCES, ALL_PLAY_SOURCES } from '../api/vidy'
import { useStore } from '../store'
import RateModal from '../components/RateModal'
import TogetherPanel from '../components/TogetherPanel'
import { syncRating, isAnimeItem } from '../lib/trackers'
import { markSource } from '../lib/playerStatus'
import { searchStremioSubtitles } from '../api/subtitles'

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
  const [subBg, setSubBg] = useState(false)
  const [subList, setSubList] = useState<{ url: string; name: string; lang: string; format: string }[]>([])
  const [subOpen, setSubOpen] = useState(false)
  const [fit, setFit] = useState<'contain' | 'cover' | 'fill' | 'full'>('contain')
  const [picks, setPicks] = useState<{ title: string; url: string; quality: string }[]>([])
  const [srcOpen, setSrcOpen] = useState(false)

  const sourceNames: Record<string, string> = {
    playtorrio: 'PlayTorrio', simplstream: 'SimplStream', vidy: 'Vidy',
    zangetsu: 'Zangetsu', miruro: 'Miruro', mangayomi: 'Mangayomi',
    mediafusion: 'MediaFusion', flix: 'Flix', nyaa: 'Nyaa', animeflv: 'AnimeFLV',
    onepace: 'One Pace', streamsppv: 'StreamsPPV', sportsstreams: 'Sports Streams', moviebox: 'MovieBox', vixsrc: 'Vixsrc', vidnest: 'Vidnest', animepahe: 'AnimePahe', pengu: 'Pengu',
  }
  const trackRef = useRef<HTMLTrackElement>(null)

  const [autoNextBusy, setAutoNextBusy] = useState(false)
  const [stillWatching, setStillWatching] = useState<null | 'idle' | 'next'>(null)
  const autoNextCount = useRef(0)
  const startedAt = useRef(Date.now())
  const [showRate, setShowRate] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [gate, setGate] = useState(true)
  const [together, setTogether] = useState(false)
  const [meta, setMeta] = useState<{ title: string; overview: string; poster: string; backdrop: string } | null>(null)
  const [nextUp, setNextUp] = useState<{ season: number; episode: number; name: string; still?: string } | null>(null)
  const [showNext, setShowNext] = useState(false)
  const [expectedSec, setExpectedSec] = useState(0)
  const failTried = useRef<string[]>([])
  const [playerSource, setPlayerSource] = useState<PlayerSource>(() => {
    try {
      const s = (localStorage.getItem('mfy-player-engine') as PlayerSource) || 'playtorrio'
      if (s === 'pengu') return 'playtorrio'
      return s
    } catch { return 'playtorrio' }
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
    const title = String((selectedMedia as any).title || (selectedMedia as any).name || '')
    let src: PlayerSource = playerSource
    if (isOnePiece(title)) src = 'onepace'
    else if (anime && !(ANIME_SOURCES as string[]).includes(src) && src !== 'onepace') src = 'zangetsu'
    else if (!anime && !(MOVIE_TV_SOURCES as string[]).includes(src)) src = 'playtorrio'
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
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.key === 'ArrowRight') seekBy(5)
      if (e.key === 'ArrowLeft') seekBy(-5)
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
          html, body { width:100% !important; height:100% !important; margin:0 !important; background:#000 !important; overflow:hidden !important; }
          video, iframe { width:100vw !important; height:100vh !important; max-width:none !important; max-height:none !important; object-fit:${fit === 'full' ? 'contain' : fit} !important; background:#000 !important; }
          video::cue, ::cue { font-size: ${subSize}em !important; line-height: 1.25; background: ${subBg ? 'rgba(0,0,0,0.55)' : 'transparent'} !important; background-color: ${subBg ? 'rgba(0,0,0,0.55)' : 'transparent'} !important; text-shadow: none !important; -webkit-text-stroke: 0 !important; color: #fff !important; }
          video::-webkit-media-controls, video::-webkit-media-controls-enclosure, .vjs-control-bar, .jw-controlbar { display: none !important; opacity: 0 !important; height: 0 !important; }
        `)
        w.executeJavaScript(`document.querySelectorAll('video').forEach(v=>{
          v.style.objectFit='${fit === 'full' ? 'contain' : fit}';
          v.style.width='100vw'; v.style.height='100vh';
          try {
            const tracks = v.textTracks || []
            for (let i = 0; i < tracks.length; i++) tracks[i].mode = i === 0 ? 'showing' : 'hidden'
          } catch {}
        })`)
        w.executeJavaScript(`document.querySelectorAll('video').forEach(v=>{ v.muted=false; v.volume=1; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); })`)
      } catch {}
    }
    w.addEventListener('dom-ready', apply)
    return () => { try { w.removeEventListener('dom-ready', apply) } catch {} }
  }, [subSize, subBg, streamUrl, fit])

  useEffect(() => {
    const w = document.querySelector('webview') as any
    if (!w?.executeJavaScript) return
    const row = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && h.season === selectedMedia?.season && h.episode === selectedMedia?.episode)
    const at = Number((selectedMedia as any)?.resumeAt || row?.progress || 0)
    const cap = expectedSec > 60 ? expectedSec * 0.85 : Number(row?.duration || 0) * 0.85
    const done = !!(row as any)?.completed || (cap > 60 && at >= cap)
    if (!(at > 12) || done) return
    const seekTo = cap > 0 ? Math.min(at, cap) : at
    const id = setTimeout(() => {
      try {
        w.executeJavaScript(`(() => { const v = document.querySelector('video'); if (v && v.currentTime < 8) v.currentTime = ${seekTo}; })()`)
      } catch {}
    }, 1800)
    return () => clearTimeout(id)
  }, [streamUrl, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, expectedSec])

  useEffect(() => {
    const id = setInterval(() => { saveProgress(false).catch(() => {}) }, 20000)
    return () => clearInterval(id)
  }, [selectedMedia?.id, selectedMedia?.episode, streamUrl])

  useEffect(() => {
    const v = videoRef.current
    if (!v || !streamUrl) return
    if (isPlayerEmbedUrl(streamUrl)) return
    v.src = streamUrl
    v.load()
    v.play().catch(() => {})
    const onMeta = () => {
      const at = Number((selectedMedia as any)?.resumeAt || useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id))?.progress || 0)
      if (at > 8 && v.currentTime < 5) v.currentTime = at
    }
    const onTime = () => { setProgress(v.currentTime || 0); setDur(Number.isFinite(v.duration) ? v.duration : 0) }
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
    const id = setInterval(() => { saveProgress().catch(() => {}) }, 8000)
    return () => clearInterval(id)
  }, [selectedMedia?.id, selectedMedia?.episode, playerSource])

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const w = document.querySelector('webview') as any
        const got = await w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v) return null; return { p: v.currentTime || 0, d: v.duration || 0, paused: !!v.paused } })()`)
        if (got) {
          if (Number(got.p) >= 0) setProgress(Number(got.p))
          if (Number.isFinite(Number(got.d)) && Number(got.d) > 1) setDur(Number(got.d))
          setPlaying(!got.paused)
        }
      } catch {}
    }, 400)
    return () => clearInterval(id)
  }, [streamUrl])

  useEffect(() => {
    startedAt.current = Date.now()
    setShowUI(true)
    const id = setTimeout(() => setShowUI(false), 2500)
    return () => clearTimeout(id)
  }, [streamUrl])

  useEffect(() => {
    setShowNext(false)
    setNextUp(null)
    if (!selectedMedia || selectedMedia.type === 'movie' || selectedMedia.type === 'iptv') return
    const id = Number(selectedMedia.id)
    const season = selectedMedia.season || 1
    const ep = selectedMedia.episode || 1
    ;(async () => {
      const s = await tmdb.getSeasonDetail(id, season).catch(() => null)
      const hit = (s?.episodes || []).find((e: any) => e.episode_number === ep + 1)
      if (hit) {
        setNextUp({ season, episode: hit.episode_number, name: hit.name, still: hit.still_path })
        return
      }
      const d = await tmdb.getTVDetail(id).catch(() => null)
      const ns = (d?.seasons || []).find((x: any) => x.season_number === season + 1 && x.episode_count > 0)
      if (!ns) return
      const s2 = await tmdb.getSeasonDetail(id, ns.season_number).catch(() => null)
      const first = s2?.episodes?.[0]
      if (first) setNextUp({ season: ns.season_number, episode: first.episode_number, name: first.name, still: first.still_path })
    })()
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

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
    })()
  }, [selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  async function applySub(item: { url: string; name: string; format: string }) {
    setSubtitleLabel(item.name)
    setSubtitleEnabled(true)
    setSubOpen(false)
    try {
      const api = (window as any).electronAPI
      const raw = api?.fetchText ? (await api.fetchText(item.url, 15000))?.text : await (await fetch(item.url)).text()
      if (!raw) return
      let vtt = raw
      if (!/^WEBVTT/m.test(raw)) {
        vtt = 'WEBVTT\n\n' + raw.replace(/\r/g, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
      }
      const w = document.querySelector('webview') as any
      const payload = JSON.stringify(vtt)
      await w?.executeJavaScript?.(`(() => {
        const v = document.querySelector('video'); if (!v) return false;
        [...v.querySelectorAll('track[data-mfy]')].forEach((t) => t.remove());
        const blob = new Blob([${payload}], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const t = document.createElement('track');
        t.kind = 'subtitles'; t.label = 'MFY'; t.srclang = 'en'; t.default = true; t.dataset.mfy = '1'; t.src = url;
        v.appendChild(t);
        t.addEventListener('load', () => { try { v.textTracks[v.textTracks.length-1].mode = 'showing' } catch(e) {} });
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
    const id = setInterval(async () => {
      if (!nextUp) return
      let p = progress
      let d = dur
      try {
        const w = document.querySelector('webview') as any
        const got = await w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v) return null; return { p: v.currentTime || 0, d: v.duration || 0 } })()`)
        if (got && Number(got.d) > 30) { p = Number(got.p); d = Number(got.d) }
      } catch {}
      const sessionSec = (Date.now() - startedAt.current) / 1000
      const truth = expectedSec > 0 ? Math.max(d, expectedSec) : d
      if (expectedSec > 180 && p < expectedSec * 0.85) return
      if (sessionSec > 120 && truth > 120 && p > 60 && truth - p <= 30 && truth - p >= 0) setShowNext(true)
    }, 2000)
    return () => clearInterval(id)
  }, [nextUp, progress, dur])

  function playNextEpisode() {
    if (!selectedMedia || selectedMedia.type === 'movie') return
    const season = nextUp?.season || selectedMedia.season || 1
    const episode = nextUp?.episode || (selectedMedia.episode || 1) + 1
    setShowNext(false)
    setGate(true)
    setLoaded(false)
    setSelectedMedia({
      ...selectedMedia,
      type: 'tv',
      season,
      episode,
      title: (selectedMedia as any).title,
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
        const season = await tmdb.getSeasonDetail(selectedMedia.id as number, curSeason).catch(() => null)
        const eps = season?.episodes || []
        const next = eps.find((e: any) => e.episode_number === curEpisode + 1)
        if (next) {
          setGate(true)
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
    seekBy(t - (progress || 0))
  }

  function seekBy(delta: number) {
    if (!Number.isFinite(delta) || !delta) return
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
    timer.current = setTimeout(() => hideChrome(), 1800)
  }

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
    let p = progress
    let d = dur
    try {
      const w = document.querySelector('webview') as any
      const got = await w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (!v) return null; return { p: v.currentTime || 0, d: v.duration || 0 } })()`)
      if (got && Number(got.p) > 1) { p = Number(got.p); if (Number.isFinite(Number(got.d)) && Number(got.d) > 1) d = Number(got.d) }
    } catch {}
    const sessionSec = (Date.now() - startedAt.current) / 1000
    const truth = expectedSec > 8 * 60 ? expectedSec : (d > 8 * 60 ? d : expectedSec || d)
    if (d > 0 && expectedSec > 8 * 60 && d < expectedSec * 0.7) d = expectedSec
    if (p > truth && truth > 0) p = Math.min(p, truth)
    const realDur = Number.isFinite(truth) && truth >= 8 * 60
    if (!realDur || sessionSec < 8) {
      upsertHistory({
        id: `${selectedMedia.id}-${selectedMedia.type}-${selectedMedia.season || 0}-${selectedMedia.episode || 0}`,
        mediaId: selectedMedia.id,
        mediaType: selectedMedia.type === 'movie' ? 'movie' : 'tv',
        title: String((selectedMedia as any).title || (selectedMedia as any).name || selectedMedia.id),
        posterPath: (selectedMedia as any).poster_path || null,
        progress: Math.min(p, sessionSec + 2),
        duration: truth || expectedSec || 0,
        season: selectedMedia.season,
        episode: selectedMedia.episode,
        watchedAt: new Date().toISOString(),
        profileId: useStore.getState().currentProfile?.id || 'default',
        completed: false,
      })
      return
    }
    const reallyDone = forceDone || (realDur && sessionSec > 90 && p / truth >= 0.92)
    if (reallyDone && selectedMedia.type !== 'movie') {
      const base = {
        mediaId: String(selectedMedia.id),
        mediaType: 'tv' as const,
        title: String((selectedMedia as any).title || (selectedMedia as any).name || selectedMedia.id),
        posterPath: (selectedMedia as any).poster_path || null,
        watchedAt: new Date().toISOString(),
        profileId: useStore.getState().currentProfile?.id || 'default',
      }
      upsertHistory({
        ...base,
        id: `${selectedMedia.id}-tv-${selectedMedia.season || 1}-${selectedMedia.episode || 1}`,
        progress: Math.max(d, p, 1),
        duration: Math.max(d, 1),
        season: selectedMedia.season || 1,
        episode: selectedMedia.episode || 1,
        completed: true,
      })
      if (nextUp) {
        upsertHistory({
          ...base,
          id: `${selectedMedia.id}-tv-${nextUp.season}-${nextUp.episode}`,
          progress: 1,
          duration: 0,
          season: nextUp.season,
          episode: nextUp.episode,
          completed: false,
        })
      }
      return
    }
    if (reallyDone && d > 30) p = d
    const prev = useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia.id))
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
  }

  const ratedRef = useRef(false)
  function leavePlayer(page: 'detail' | 'home' | 'sports' | 'anime' | 'movies' | 'tv') {
    saveProgress().catch(() => {})
    try { (window as any).electronAPI?.exitFullscreen?.() } catch {}
    try { if (document.fullscreenElement) document.exitFullscreen() } catch {}
    const sessionSec = (Date.now() - startedAt.current) / 1000
    if (!ratedRef.current && sessionSec > 90 && selectedMedia && selectedMedia.type !== 'iptv') {
      setShowRate(true)
      ;(window as any).__mfyLeavePage = page
      return
    }
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
    if (selectedMedia && isAnimeItem(selectedMedia)) {
      const name = String((selectedMedia as any).title || (selectedMedia as any).name || selectedMedia.id)
      const url = `https://anisync.qzz.io/?title=${encodeURIComponent(name)}&ep=${selectedMedia.episode || 1}`
      try {
        const api = (window as any).electronAPI
        if (api?.openExternal) api.openExternal(url)
        else window.open(url, '_blank')
      } catch {}
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
      <div style={{ position: 'fixed', left: 24, bottom: 88, zIndex: 80, width: 420, maxWidth: 'calc(100vw - 48px)', background: 'rgba(12,8,14,0.94)', border: '1px solid rgba(255,20,147,0.35)', borderRadius: 16, padding: 12, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}>
        {nextUp.still ? <img src={`${POSTER_URL.replace('/w500','/w300')}${nextUp.still}`} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 120, height: 68, borderRadius: 10, background: '#1a1016' }} />}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 11, color: '#FF1493', fontWeight: 700, marginBottom: 2 }}>Next on {(selectedMedia as any)?.title || 'this show'}</p>
          <p style={{ fontSize: 14, color: '#fff', fontWeight: 650 }}>{nextUp.name} (S{nextUp.season}E{nextUp.episode})</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => setShowNext(false)} style={{ background: 'transparent', border: 'none', color: '#fff', opacity: 0.7, cursor: 'pointer' }}>Dismiss</button>
            <button type="button" onClick={playNextEpisode} style={{ background: '#FF1493', border: 'none', color: '#fff', borderRadius: 999, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Watch now</button>
          </div>
        </div>
      </div>
    )}
    {stillWatching && (
      <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center">
        <div className="rounded-3xl bg-[#120a12] border border-white/15 px-10 py-8 text-center max-w-md">
          <div className="text-[#FF1493] text-[10px] tracking-[0.35em] mb-3">MFY</div>
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
      <button type="button" onClick={goBack} title="Exit player"
        style={{ position: 'fixed', top: 14, left: 14, zIndex: 400, background: '#FF1493', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', cursor: 'pointer', fontWeight: 800, fontSize: 12, letterSpacing: 0.4, boxShadow: '0 6px 20px rgba(255,20,147,0.35)', opacity: showUI ? 1 : 0.92 }}>
        ← Exit
      </button>
      {showUI && <div className="player-topbar visible" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90, padding: '12px 16px 12px 108px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2">
        <button type="button" onClick={() => setShowRate(true)} style={{ background: '#FF1493', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}>Mark watched</button>
        </div>
        <div className="player-title text-white font-medium truncate" style={{ maxWidth: 420 }}>
          {title}
          {selectedMedia && selectedMedia.type !== 'movie' && selectedMedia.type !== 'iptv' ? (
            <span style={{ marginLeft: 10, color: '#FF1493', fontWeight: 800 }}>S{selectedMedia.season || 1}E{selectedMedia.episode || 1}</span>
          ) : null}
        </div>
        <div className="player-top-actions flex items-center gap-2">
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSrcOpen((v) => !v)}
              style={{ background: '#1a1016', border: '1px solid #FF1493', borderRadius: 999, padding: '7px 14px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {sourceNames[playerSource] || playerSource} ▾
            </button>
            {srcOpen && (
              <div style={{ position: 'absolute', right: 0, top: 40, width: 220, background: '#12080d', border: '1px solid rgba(255,20,147,0.45)', borderRadius: 16, padding: 8, zIndex: 80, boxShadow: '0 16px 40px rgba(0,0,0,0.55)' }}>
                {(isOnePiece(String((selectedMedia as any)?.title || '')) ? (['onepace', ...ALL_PLAY_SOURCES] as PlayerSource[]) : ALL_PLAY_SOURCES).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setPlayerSource(s)
                      setSrcOpen(false)
                      try { localStorage.setItem('mfy-player-engine', s) } catch {}
                    }}
                    style={{
                      width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                      background: playerSource === s ? '#FF1493' : 'transparent',
                      color: '#fff', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600, marginBottom: 4,
                    }}
                  >
                    {sourceNames[s] || s}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={tryNextSource} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>Next source</button>
            {selectedMedia && selectedMedia.type !== 'movie' && selectedMedia.type !== 'iptv' ? (
              <button type="button" onClick={playNextEpisode} style={{ background: '#FF1493', border: 'none', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                Next ep {nextUp ? `S${nextUp.season}E${nextUp.episode}` : `E${(selectedMedia.episode || 1) + 1}`}
              </button>
            ) : null}
            <button type="button" onClick={() => seekBy(90)} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>Skip intro</button>
            <button type="button" onClick={() => setFit((f) => f === 'contain' ? 'cover' : f === 'cover' ? 'fill' : 'contain')} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>{fit === 'cover' ? 'Crop' : fit === 'fill' ? 'Fill' : 'Fit'}</button>
            <button type="button" onClick={() => {
              try { (window as any).electronAPI?.openVlc?.(streamUrl) || (window as any).electronAPI?.openExternal?.(streamUrl) } catch {}
            }} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>VLC</button>
            <div className="relative">
              <button type="button" onClick={() => setSubOpen((v) => !v)} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                Subs {subtitleLabel ? `· ${subtitleLabel.slice(0, 10)}` : ''}
              </button>
              {subOpen && (
                <div style={{ position: 'absolute', right: 0, top: 36, width: 260, maxHeight: 280, overflow: 'auto', background: '#12080d', border: '1px solid rgba(255,20,147,0.4)', borderRadius: 12, padding: 8, zIndex: 90 }}>
                  <p style={{ fontSize: 10, color: '#FF1493', marginBottom: 6 }}>OpenSubtitles · formats</p>
                  {subList.length === 0 && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>No tracks yet</p>}
                  {subList.map((s) => (
                    <button key={s.url} type="button" onClick={() => applySub(s)} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', padding: '7px 8px', fontSize: 12, cursor: 'pointer' }}>
                      {(s.lang || '').toUpperCase()} · {s.format} · {s.name}
                    </button>
                  ))}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button type="button" onClick={() => setSubSize((n) => Math.max(0.4, +(n - 0.1).toFixed(2)))} style={{ flex: 1, background: '#1a1016', border: 'none', color: '#fff', padding: 6, fontSize: 11, cursor: 'pointer' }}>Smaller</button>
                    <button type="button" onClick={() => setSubSize((n) => Math.min(1.6, +(n + 0.1).toFixed(2)))} style={{ flex: 1, background: '#1a1016', border: 'none', color: '#fff', padding: 6, fontSize: 11, cursor: 'pointer' }}>Bigger</button>
                    <button type="button" onClick={() => setSubBg((v) => !v)} style={{ flex: 1, background: '#1a1016', border: 'none', color: '#fff', padding: 6, fontSize: 11, cursor: 'pointer' }}>{subBg ? 'Box' : 'Clean'}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <button className="player-icon-button" onClick={toggleFullscreen} style={{ background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}><Maximize size={18} /></button>
        </div>
      </div>}

      <div className="player-stage" style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh', overflow: 'hidden' }}
        onMouseMove={onMouseMove}
        onClick={(e) => { if ((e.target as HTMLElement).closest('button, input, a, .mfy-bar')) return; togglePlay() }}
      >
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
                <div style={{ fontSize: 10, letterSpacing: 1.4, color: '#FF1493', fontWeight: 700, marginBottom: 4 }}>
                  {selectedMedia?.type === 'movie' ? 'MOVIE' : isAnimeItem(selectedMedia) ? 'ANIME' : 'SERIES'}
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {meta?.overview || 'Ready when you are.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <button type="button" onClick={() => setGate(false)} style={{ background: '#FF1493', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
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
        {loaded && !error && isPlayerEmbedUrl(streamUrl) && (
          // @ts-expect-error Electron webview
          <webview
            key={streamUrl}
            src={streamUrl}
            partition="persist:mfy"
            style={{
              width: '100%',
              height: '100%',
              background: '#000',
              transform: fit === 'cover' ? 'scale(1.28)' : fit === 'fill' ? 'scaleX(1.12) scaleY(1.18)' : 'scale(1)',
              transformOrigin: 'center center',
              pointerEvents: 'auto',
            }}
            allowpopups="false"
            allowfullscreen="true"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            webpreferences="allowRunningInsecureContent, javascript=yes, autoplayPolicy=no-user-gesture-required"
          />
        )}
        {loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <video ref={videoRef} playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: fit, background: '#000' }} />
        )}

        {showUI && loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <div className="mfy-bar" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 300, padding: '18px 22px 20px', background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)', pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            {(() => {
              const total = expectedSec > 0 ? Math.max(expectedSec, Number.isFinite(dur) ? dur : 0) : (Number.isFinite(dur) ? dur : 0)
              const left = Math.max(0, total - progress)
              const pct = total > 0 ? Math.min(100, (progress / total) * 100) : 0
              return (
                <>
                  <div onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (total > 0) seek((e.clientX - r.left) / r.width * total) }}
                    style={{ cursor: 'pointer', height: 5, background: 'rgba(255,255,255,0.18)', borderRadius: 99, marginBottom: 12 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#FF1493', borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => seekBy(-5)} title="-5s" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#fff', cursor: 'pointer' }}><SkipBack size={18} /></button>
                      <button type="button" onClick={togglePlay} style={{ background: '#FF1493', border: 'none', borderRadius: '50%', padding: 10, color: '#fff', cursor: 'pointer' }}>{playing ? <Pause size={22} /> : <Play size={22} />}</button>
                      <button type="button" onClick={() => seekBy(5)} title="+5s" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#fff', cursor: 'pointer' }}><SkipForward size={18} /></button>
                      <button type="button" onClick={() => seekBy(90)} title="Skip intro" style={{ background: '#FF1493', border: 'none', borderRadius: 8, padding: '8px 10px', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>Skip intro</button>
                      <span style={{ color: '#fff', fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {fmt(progress)} / {fmt(total || dur)}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        −{fmt(left)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="button" onClick={() => setSubSize((n) => Math.max(0.4, +(n - 0.1).toFixed(2)))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>CC−</button>
                      <button type="button" onClick={() => setSubSize((n) => Math.min(1.4, +(n + 0.1).toFixed(2)))} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>CC+</button>
                      <button type="button" onClick={() => setFit((f) => f === 'contain' ? 'cover' : f === 'cover' ? 'fill' : 'contain')} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{fit === 'cover' ? 'Crop' : fit === 'fill' ? 'Fill' : 'Fit'}</button>
                      <button type="button" onClick={toggleFullscreen} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#fff', cursor: 'pointer' }}>{fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}</button>
                    </div>
                  </div>
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