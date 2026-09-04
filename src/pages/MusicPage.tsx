import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Search, Heart, SkipBack, SkipForward, Shuffle, Repeat, Plus } from 'lucide-react'

type Track = { id: string; title: string; artist: string; album?: string; image?: string; url?: string; yt?: string }

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to', 'https://vid.puffyan.us']
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de']

async function jsonGet(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 14000 })
    return r?.json || {}
  }
  return (await fetch(url)).json()
}

async function ytAudio(videoId: string): Promise<string> {
  for (const h of INVIDIOUS) {
    try {
      const d = await jsonGet(`${h}/api/v1/videos/${videoId}`)
      const audio = (d.adaptiveFormats || d.adaptive_formats || []).find((f: any) => String(f.type || f.mimeType || '').includes('audio'))
      if (audio?.url) return audio.url
      return `${h}/latest_version?id=${videoId}&itag=140`
    } catch {}
  }
  for (const h of PIPED) {
    try {
      const d = await jsonGet(`${h}/streams/${videoId}`)
      const a = (d.audioStreams || []).sort((x: any, y: any) => (y.bitrate || 0) - (x.bitrate || 0))[0]
      if (a?.url) return a.url
    } catch {}
  }
  return ''
}

async function ytSearch(term: string): Promise<Track[]> {
  for (const h of INVIDIOUS) {
    try {
      const d = await jsonGet(`${h}/api/v1/search?q=${encodeURIComponent(term + ' official audio')}&type=video`)
      const rows = Array.isArray(d) ? d : []
      if (!rows.length) continue
      return rows.slice(0, 20).map((v: any) => ({
        id: 'yt-' + v.videoId,
        title: v.title,
        artist: v.author,
        image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        yt: v.videoId,
      }))
    } catch {}
  }
  for (const h of PIPED) {
    try {
      const d = await jsonGet(`${h}/search?q=${encodeURIComponent(term)}&filter=music_songs`)
      const items = d.items || d || []
      return (Array.isArray(items) ? items : []).slice(0, 20).map((v: any) => ({
        id: 'yt-' + (v.url || '').replace('/watch?v=', ''),
        title: v.title,
        artist: v.uploaderName || v.uploader,
        image: v.thumbnail,
        yt: String(v.url || '').replace('/watch?v=', ''),
      }))
    } catch {}
  }
  return []
}

async function searchTracks(term: string): Promise<Track[]> {
  const q = term || 'top hits'
  const [meta, yt] = await Promise.all([
    jsonGet(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=24`).catch(() => ({})),
    ytSearch(q),
  ])
  const out: Track[] = []
  for (const s of meta.results || []) {
    out.push({
      id: 'it-' + s.trackId,
      title: s.trackName,
      artist: s.artistName,
      album: s.collectionName,
      image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    })
  }
  try {
    const d = await jsonGet(`https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=mfy`)
    for (const s of d.data || []) {
      out.push({
        id: 'au-' + s.id,
        title: s.title,
        artist: s.user?.name,
        image: s.artwork?.['480x480'] || s.artwork?.['150x150'],
        url: `https://discoveryprovider.audius.co/v1/tracks/${s.id}/stream?app_name=mfy`,
      })
    }
  } catch {}
  const seen = new Set<string>()
  return [...out, ...yt].filter((t) => {
    const k = `${t.title}|${t.artist}`.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function fmt(n: number) {
  if (!Number.isFinite(n) || n < 0) return '0:00'
  const m = Math.floor(n / 60)
  const s = Math.floor(n % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MusicPage() {
  const [tab, setTab] = useState('Dashboard')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [charts, setCharts] = useState<Track[]>([])
  const [queue, setQueue] = useState<Track[]>([])
  const [favs, setFavs] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-music-favs') || '[]') } catch { return [] }
  })
  const [now, setNow] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tcur, setTcur] = useState(0)
  const [tdur, setTdur] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    searchTracks('top hits 2025').then((rows) => { setTracks(rows); setCharts(rows) })
  }, [])

  function persistFavs(next: Track[]) {
    setFavs(next)
    try { localStorage.setItem('mfy-music-favs', JSON.stringify(next.slice(0, 80))) } catch {}
  }

  async function resolve(t: Track): Promise<string> {
    if (t.url && /audius|latest_version|googlevideo|audio/i.test(t.url)) return t.url
    if (t.yt) {
      const u = await ytAudio(t.yt)
      if (u) return u
    }
    const hits = await ytSearch(`${t.title} ${t.artist}`)
    const id = hits[0]?.yt
    if (id) return ytAudio(id)
    return t.url || ''
  }

  async function play(t: Track, list?: Track[]) {
    setNow(t)
    setBusy(true)
    const base = list || (queue.length ? queue : tracks)
    setQueue([t, ...base.filter((x) => x.id !== t.id)].slice(0, 50))
    const el = audioRef.current
    try {
      const src = await resolve(t)
      if (!el || !src) { setBusy(false); return }
      el.src = src
      await el.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
    setBusy(false)
  }

  function skip(dir: number) {
    const list = queue.length ? queue : tracks
    if (!list.length) return
    if (shuffle) {
      play(list[Math.floor(Math.random() * list.length)], list)
      return
    }
    const i = Math.max(0, list.findIndex((x) => x.id === now?.id))
    play(list[(i + dir + list.length) % list.length], list)
  }

  const shown = tab === 'Favorites' ? favs : tab === 'Queue' ? queue : tab === 'Charts' ? charts : tracks

  return (
    <div className="flex min-h-full bg-[#0d0a0c] text-white">
      <aside className="w-52 flex-shrink-0 bg-black p-4">
        <p className="text-[10px] tracking-[0.28em] text-[#FF1493] font-bold">MFY MUSIC</p>
        <p className="text-[10px] text-white/30 mb-5">Nuclear engine</p>
        {['Dashboard', 'Search', 'Charts', 'Queue', 'Favorites'].map((n) => (
          <button key={n} type="button" onClick={() => setTab(n)} className={`w-full text-left h-10 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-[#FF1493]/25' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto pb-28">
        <form className="flex gap-2 mb-6" onSubmit={(e) => { e.preventDefault(); searchTracks(q || 'top hits').then(setTracks); setTab('Search') }}>
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black">
            <Search className="w-4 h-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any song or artist" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <div className="flex items-end gap-5 mb-8">
          <div className="w-40 h-40 rounded-xl overflow-hidden bg-white/10 shrink-0 shadow-2xl">
            {now?.image && <img src={now.image} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#FF1493] font-bold">{busy ? 'LOADING STREAM' : 'NOW PLAYING'}</p>
            <h1 className="text-4xl font-black mt-1">{now?.title || 'MFY Music'}</h1>
            <p className="text-white/50 mt-1">{now?.artist || 'YouTube audio · Audius · Nuclear-style sources'}</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {shown.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 px-3 h-14 rounded-lg hover:bg-white/5 ${now?.id === t.id ? 'bg-[#FF1493]/15' : ''}`}>
              <span className="w-6 text-xs text-white/30">{i + 1}</span>
              <button type="button" onClick={() => play(t, shown)} className="w-10 h-10 rounded overflow-hidden bg-white/10 shrink-0">
                {t.image ? <img src={t.image} alt="" className="w-full h-full object-cover" /> : <Play size={14} className="m-auto" />}
              </button>
              <button type="button" className="flex-1 text-left min-w-0" onClick={() => play(t, shown)}>
                <p className="text-sm truncate">{t.title}</p>
                <p className="text-xs text-white/40 truncate">{t.artist}{t.album ? ` · ${t.album}` : ''}</p>
              </button>
              <button type="button" onClick={() => persistFavs(favs.some((f) => f.id === t.id) ? favs.filter((f) => f.id !== t.id) : [t, ...favs])} className={favs.some((f) => f.id === t.id) ? 'text-[#FF1493]' : 'text-white/30'}>
                <Heart size={14} fill={favs.some((f) => f.id === t.id) ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="text-white/30" onClick={() => setQueue((qq) => [...qq, t])}><Plus size={14} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-[76px] bg-[#0a0a0d]/95 border-t border-white/10 flex items-center px-5 gap-4 z-20">
        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden">{now?.image && <img src={now.image} alt="" className="w-full h-full object-cover" />}</div>
        <div className="w-48 min-w-0">
          <p className="text-sm truncate">{now?.title || 'Nothing playing'}</p>
          <p className="text-xs text-white/40 truncate">{now?.artist || ''}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center gap-4 mb-1">
            <button type="button" className={shuffle ? 'text-[#FF1493]' : 'text-white/50'} onClick={() => setShuffle((v) => !v)}><Shuffle size={14} /></button>
            <button type="button" onClick={() => skip(-1)}><SkipBack size={18} /></button>
            <button type="button" className="w-10 h-10 rounded-full bg-[#FF1493] grid place-items-center" onClick={() => {
              const el = audioRef.current
              if (!el) return
              if (playing) { el.pause(); setPlaying(false) } else { el.play(); setPlaying(true) }
            }}>{playing ? <Pause size={16} /> : <Play size={16} fill="white" />}</button>
            <button type="button" onClick={() => skip(1)}><SkipForward size={18} /></button>
            <button type="button" className={repeat ? 'text-[#FF1493]' : 'text-white/50'} onClick={() => setRepeat((v) => !v)}><Repeat size={14} /></button>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span>{fmt(tcur)}</span>
            <input type="range" min={0} max={tdur || 1} value={tcur} className="flex-1 accent-[#FF1493]" onChange={(e) => {
              const v = Number(e.target.value)
              if (audioRef.current) audioRef.current.currentTime = v
              setTcur(v)
            }} />
            <span>{fmt(tdur)}</span>
          </div>
        </div>
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => setTcur((e.target as HTMLAudioElement).currentTime)}
          onLoadedMetadata={(e) => setTdur((e.target as HTMLAudioElement).duration || 0)}
          onEnded={() => { if (repeat && now) play(now); else skip(1) }}
        />
      </div>
    </div>
  )
}
