import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2, Maximize, Minimize, Subtitles, ArrowLeft, Cast, RefreshCw, Zap } from 'lucide-react'
import { cn, formatDate, formatRuntime, getRatingColor } from '../lib/utils'
import { tmdb, POSTER_URL, BACKDROP_URL } from '../api/tmdb'
import { vidyUrl, getPlayerUrl, isPlayerEmbed, getFallbackSources, PlayerSource } from '../api/vidy'
import { mediafusionStreams } from '../api/mediafusion'
import { addonStreams, isOnePiece, STREAM_HOST, onePaceStreams } from '../api/stremioAddons'
import { ANIME_SOURCES, MOVIE_TV_SOURCES } from '../api/vidy'
import { useStore } from '../store'
import RateModal from '../components/RateModal'
import TogetherPanel from '../components/TogetherPanel'
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
  const [subBg, setSubBg] = useState(false)
  const [fit, setFit] = useState<'contain' | 'cover' | 'fill'>('contain')
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
  const [showRate, setShowRate] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [gate, setGate] = useState(true)
  const [together, setTogether] = useState(false)
  const [meta, setMeta] = useState<{ title: string; overview: string; poster: string; backdrop: string } | null>(null)
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
    if (src === 'moviebox') {
      const name = String((selectedMedia as any).title || (selectedMedia as any).name || title || '')
      const q = name || String(selectedMedia.id)
      setStreamUrl(`https://moviebox.ph/web/searchResult?keyword=${encodeURIComponent(q)}`)
      setLoaded(true)
      setLoading(false)
      setError('')
      return
    }
    if (src === 'animepahe') {
      setStreamUrl('https://animepahe.ru/')
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
        const q = rows.find((r: any) => /^https?:/i.test(r.url)) || rows[0]
        const playable = rows.find((r: any) => /^https?:/i.test(r.url) && !/pengu\.uk\/direct|attachment|download/i.test(r.url))
        const q = playable || (src === 'pengu' ? null : rows[0])
        if (!q || /pengu\.uk\/direct/i.test(q.url || '')) {
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
    const resume = () => {
      apply()
      const at = Number((selectedMedia as any)?.resumeAt || useStore.getState().watchHistory.find((h) => String(h.mediaId) === String(selectedMedia?.id) && h.season === selectedMedia?.season && h.episode === selectedMedia?.episode)?.progress || 0)
      try {
        w.executeJavaScript(`(() => {
          const kick = () => {
            document.querySelectorAll('video').forEach((v) => {
              v.muted = false; v.defaultMuted = false; v.volume = 1;
              const p = v.play(); if (p && p.catch) p.catch(() => {})
            })
            document.querySelectorAll('button, [class], [aria-label]').forEach((el) => {
              const t = ((el.getAttribute && el.getAttribute('aria-label')) || el.textContent || el.className || '').toString().toLowerCase()
              if (/unmute|sound on|volume/.test(t) && /mute/.test(t)) el.click()
            })
          }
          kick(); setTimeout(kick, 400); setTimeout(kick, 1200); setTimeout(kick, 2500);
          ${at > 8 ? `const v = document.querySelector('video'); if (v && v.currentTime < ${at - 2}) v.currentTime = ${at};` : ''}
        })()`)
      } catch {}
    }
    w.addEventListener('dom-ready', resume)
    setTimeout(resume, 1500)
    return () => { try { w.removeEventListener('dom-ready', resume) } catch {} }
  }, [subSize, subBg, streamUrl])

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
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  useEffect(() => {
    const id = setInterval(() => { saveProgress().catch(() => {}) }, 20000)
    return () => clearInterval(id)
  }, [selectedMedia?.id, selectedMedia?.episode, playerSource])

  useEffect(() => {
    setShowUI(true)
    const id = setTimeout(() => setShowUI(false), 2500)
    return () => clearTimeout(id)
  }, [streamUrl])

  async function handleEnded() {
    saveProgress(true).catch(() => {})
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
    timer.current = setTimeout(() => setShowUI(false), 2200)
  }

  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>
    const bump = () => {
      clearTimeout(idle)
      idle = setTimeout(() => setStillWatching('idle'), 5 * 60 * 1000)
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
      if (got && Number(got.d) > 1) { p = Number(got.p); d = Number(got.d) }
    } catch {}
    if (forceDone && d > 30) p = d
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
    })
  }

  function leavePlayer(page: 'detail' | 'home' | 'sports' | 'anime' | 'movies' | 'tv') {
    saveProgress().catch(() => {})
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
    leavePlayer(selectedMedia?.id ? 'detail' : 'home')
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
        <div className="mfy-player" onMouseMove={onMouseMove} style={{ background: '#000', minHeight: '100vh' }}>
      <button type="button" onClick={goBack} style={{ position: 'fixed', top: 12, left: 12, zIndex: 120, background: 'rgba(0,0,0,0.75)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Exit</button>
      <button type="button" onClick={() => setTogether(true)} style={{ position: 'fixed', top: 12, left: 84, zIndex: 120, background: 'rgba(0,0,0,0.75)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Together</button>
      <div className={cn('player-topbar', showUI ? 'visible' : 'hidden')} style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 90, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-2">
        <button onClick={goBack} className="player-back flex items-center gap-2 text-white/80 hover:text-white" style={{ background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" onClick={() => setShowRate(true)} style={{ background: '#FF1493', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}>Mark watched</button>
        </div>
        <div className="player-title text-white font-medium truncate" style={{ maxWidth: 400 }}>{title}</div>
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
                {(isOnePiece(String((selectedMedia as any)?.title || '')) ? (['onepace'] as PlayerSource[]) : (isAnimeItem(selectedMedia) ? ANIME_SOURCES : MOVIE_TV_SOURCES)).map((s) => (
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
            <button type="button" onClick={tryNextSource} style={{ background: '#1a1016', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 999, padding: '7px 12px', color: '#fff', fontSize: 11, cursor: 'pointer' }}>Next</button>
          </div>
          <button className="player-icon-button" onClick={toggleFullscreen} style={{ background: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8, border: 'none', cursor: 'pointer', color: 'white' }}><Maximize size={18} /></button>
        </div>
      </div>

      <div className="player-stage" onClick={togglePlay} style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '100vh' }}>
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
            style={{ width: '100%', height: '100%', background: '#000', objectFit: fit }}
            allowpopups="false"
            allowfullscreen="true"
            useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            webpreferences="allowRunningInsecureContent, javascript=yes, autoplayPolicy=no-user-gesture-required"
          />
        )}
        {loaded && !error && !isPlayerEmbedUrl(streamUrl) && (
          <video ref={videoRef} playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: fit, background: '#000' }} />
        )}

        {loaded && !error && isPlayerEmbedUrl(streamUrl) && (
          <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 90, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
            {srcOpen && (
              <div style={{ position: 'absolute', bottom: 42, right: 0, background: '#120a12', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 8, minWidth: 160 }}>
                {((isOnePiece(String((selectedMedia as any)?.title||'')) ? (['onepace'] as PlayerSource[]) : (isAnimeItem(selectedMedia) ? ANIME_SOURCES : MOVIE_TV_SOURCES))).map((s) => (
                  <button key={s} type="button" onClick={() => { setPlayerSource(s); failTried.current = []; setSrcOpen(false); try { localStorage.setItem('mfy-player-engine', s) } catch {} }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: playerSource === s ? '#FF1493' : 'transparent', border: 'none', borderRadius: 8, padding: '8px 10px', color: 'white', fontSize: 12, cursor: 'pointer' }}>
                    {sourceNames[s] || s}
                  </button>
                ))}
                <button type="button" onClick={() => setSubSize((n) => Math.max(0.4, +(n - 0.1).toFixed(2)))} style={{ color: '#fff', background: 'transparent', border: 'none', padding: 6 }}>Subs −</button>
                <button type="button" onClick={() => setSubSize((n) => Math.min(1.4, +(n + 0.1).toFixed(2)))} style={{ color: '#fff', background: 'transparent', border: 'none', padding: 6 }}>Subs +</button>
                <button type="button" onClick={() => setSubBg((v) => !v)} style={{ color: '#fff', background: 'transparent', border: 'none', padding: 6 }}>{subBg ? 'Sub box on' : 'Sub box off'}</button>
              </div>
            )}
            <button type="button" title="Sources" onClick={() => setSrcOpen((v) => !v)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer' }}>⋯</button>
            <button type="button" title="Fit" onClick={() => setFit((f) => f === 'contain' ? 'cover' : f === 'cover' ? 'fill' : 'contain')} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 10 }}>{fit === 'cover' ? 'Crop' : fit === 'fill' ? 'Fill' : 'Fit'}</button>
            <button type="button" title="Fullscreen" onClick={toggleFullscreen} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer' }}>{fullscreen ? '✕' : '⛶'}</button>
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