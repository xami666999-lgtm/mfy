import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Search, Heart, SkipBack, SkipForward, Shuffle, Repeat, Plus, Volume2, ChevronLeft, ChevronRight } from 'lucide-react'

type Track = { id: string; title: string; artist: string; album?: string; image?: string; url?: string; yt?: string }

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to', 'https://vid.puffyan.us']
const PIPED = ['https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de']

async function jsonGet(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 14000 })
    return r?.json || {}
  }
  try { return (await fetch(url)).json() } catch { return {} }
}

async function ytAudio(videoId: string): Promise<string> {
  for (const h of INVIDIOUS) {
    try {
      const d = await jsonGet(`${h}/api/v1/videos/${videoId}`)
      const audio = (d.adaptiveFormats || d.adaptive_formats || []).find((f: any) => String(f.type || f.mimeType || '').includes('audio'))
      if (audio?.url) return audio.url
      if (d.videoId) return `${h}/latest_version?id=${videoId}&itag=140`
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
      return rows.slice(0, 16).map((v: any) => ({
        id: 'yt-' + v.videoId,
        title: v.title,
        artist: v.author,
        image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        yt: v.videoId,
      }))
    } catch {}
  }
  return []
}

function uniq(list: Track[]) {
  const seen = new Set<string>()
  return list.filter((t) => {
    const k = `${t.title}|${t.artist}`.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

async function searchTracks(term: string): Promise<Track[]> {
  const q = term || 'top hits'
  const [it, yt] = await Promise.all([
    jsonGet(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=24`),
    ytSearch(q),
  ])
  const out: Track[] = []
  for (const s of it.results || []) {
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
  return uniq([...out, ...yt])
}

async function loadDashboard() {
  const [songs, albums, chart, trending] = await Promise.all([
    jsonGet('https://itunes.apple.com/search?term=top+hits+2026&entity=song&limit=12'),
    jsonGet('https://itunes.apple.com/us/rss/topalbums/limit=18/json'),
    jsonGet('https://api.deezer.com/chart/0/albums'),
    jsonGet('https://discoveryprovider.audius.co/v1/tracks/trending?app_name=mfy'),
  ])
  const featured: Track[] = (songs.results || []).map((s: any) => ({
    id: 'it-' + s.trackId,
    title: s.trackName,
    artist: s.artistName,
    album: s.collectionName,
    image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
  }))
  const topAlbums: Track[] = [
    ...(albums.feed?.entry || []).map((e: any, i: number) => ({
      id: 'al-' + i + (e.id?.label || ''),
      title: e['im:name']?.label,
      artist: e['im:artist']?.label,
      image: e['im:image']?.[2]?.label,
    })),
    ...(chart.data || []).map((a: any) => ({
      id: 'dz-' + a.id,
      title: a.title,
      artist: a.artist?.name,
      image: a.cover_medium,
    })),
  ]
  const releases: Track[] = (trending.data || []).map((s: any) => ({
    id: 'au-' + s.id,
    title: s.title,
    artist: s.user?.name,
    image: s.artwork?.['480x480'] || s.artwork?.['150x150'],
    url: `https://discoveryprovider.audius.co/v1/tracks/${s.id}/stream?app_name=mfy`,
  }))
  return { featured: uniq(featured), topAlbums: uniq(topAlbums).slice(0, 18), releases: uniq(releases).slice(0, 18) }
}

function fmt(n: number) {
  if (!Number.isFinite(n) || n < 0) return '0:00'
  const m = Math.floor(n / 60)
  const s = Math.floor(n % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Shelf({ title, badge, items, onPlay }: { title: string; badge?: string; items: Track[]; onPlay: (t: Track, list: Track[]) => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  return (
    <section className="mb-7">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF1493]/20 text-[#FF1493]">{badge}</span>}
        <div className="ml-auto flex gap-1">
          <button type="button" className="w-7 h-7 rounded-full bg-white/10 grid place-items-center" onClick={() => ref.current?.scrollBy({ left: -360, behavior: 'smooth' })}><ChevronLeft size={14} /></button>
          <button type="button" className="w-7 h-7 rounded-full bg-white/10 grid place-items-center" onClick={() => ref.current?.scrollBy({ left: 360, behavior: 'smooth' })}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-2 scroll-row">
        {items.map((t) => (
          <button key={t.id} type="button" onClick={() => onPlay(t, items)} className="shrink-0 w-36 text-left group">
            <div className="w-36 h-36 rounded-xl overflow-hidden bg-white/10 relative">
              {t.image && <img src={t.image} alt="" className="w-full h-full object-cover" />}
              <span className="absolute inset-0 hidden group-hover:grid place-items-center bg-black/40"><Play size={22} fill="white" /></span>
            </div>
            <p className="text-xs font-semibold mt-2 line-clamp-1">{t.title}</p>
            <p className="text-[11px] text-white/40 line-clamp-1">{t.artist}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

export default function MusicPage() {
  const [tab, setTab] = useState('Dashboard')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [featured, setFeatured] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Track[]>([])
  const [releases, setReleases] = useState<Track[]>([])
  const [queue, setQueue] = useState<Track[]>([])
  const [favs, setFavs] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-music-favs') || '[]') } catch { return [] }
  })
  const [now, setNow] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [busy, setBusy] = useState(false)
  const [vol, setVol] = useState(0.9)
  const [tcur, setTcur] = useState(0)
  const [tdur, setTdur] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    loadDashboard().then((d) => {
      setFeatured(d.featured)
      setAlbums(d.topAlbums)
      setReleases(d.releases)
      setTracks(d.featured)
    })
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
    setQueue([t, ...base.filter((x) => x.id !== t.id)].slice(0, 40))
    const el = audioRef.current
    try {
      const src = await resolve(t)
      if (!el || !src) { setBusy(false); return }
      el.src = src
      el.volume = vol
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

  const shown = tab === 'Favorites' ? favs : tab === 'Search' ? tracks : tab === 'Charts' ? albums : featured

  return (
    <div className="flex min-h-full bg-[#0d0a0c] text-white">
      <aside className="w-44 flex-shrink-0 bg-black p-4">
        <p className="text-[10px] tracking-[0.28em] text-[#FF1493] font-bold">MFY MUSIC</p>
        <p className="text-[10px] text-white/30 mb-5">Muffon layout</p>
        {['Dashboard', 'Search', 'Charts', 'Favorites'].map((n) => (
          <button key={n} type="button" onClick={() => setTab(n)} className={`w-full text-left h-10 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-[#FF1493] text-white' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>

      <div className="flex-1 min-w-0 p-5 overflow-y-auto pb-28">
        <form className="mb-5" onSubmit={(e) => { e.preventDefault(); searchTracks(q || 'top hits').then(setTracks); setTab('Search') }}>
          <div className="flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black">
            <Search className="w-4 h-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any song or artist" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>

        {tab === 'Dashboard' ? (
          <>
            <h1 className="text-2xl font-black mb-4">Dashboard</h1>
            <Shelf title="Featured" items={featured} onPlay={play} />
            <Shelf title="Top Albums" badge="iTunes · Deezer" items={albums} onPlay={(t) => searchTracks(`${t.title} ${t.artist}`).then((rows) => { setTracks(rows); setTab('Search'); if (rows[0]) play(rows[0], rows) })} />
            <Shelf title="New Releases" badge="Audius" items={releases} onPlay={play} />
          </>
        ) : (
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
                <button type="button" className="text-white/30" onClick={() => setQueue((qq) => [t, ...qq.filter((x) => x.id !== t.id)])}><Plus size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="w-64 flex-shrink-0 bg-black/70 border-l border-white/10 p-3 hidden lg:block overflow-y-auto pb-28">
        <p className="text-[11px] tracking-widest text-[#FF1493] font-bold mb-3">QUEUE</p>
        {(queue.length ? queue : featured.slice(0, 10)).map((t) => (
          <button key={t.id} type="button" onClick={() => play(t, queue.length ? queue : featured)} className={`w-full flex items-center gap-2 p-2 rounded-lg mb-1 text-left ${now?.id === t.id ? 'bg-[#FF1493]/20' : 'hover:bg-white/5'}`}>
            <div className="w-10 h-10 rounded bg-white/10 overflow-hidden shrink-0">{t.image && <img src={t.image} alt="" className="w-full h-full object-cover" />}</div>
            <div className="min-w-0">
              <p className="text-xs truncate">{t.title}</p>
              <p className="text-[10px] text-white/40 truncate">{t.artist}</p>
            </div>
          </button>
        ))}
      </aside>

      <div className="fixed bottom-0 left-0 right-0 h-[76px] bg-[#0a0a0d]/95 border-t border-white/10 flex items-center px-5 gap-4 z-20">
        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden">{now?.image && <img src={now.image} alt="" className="w-full h-full object-cover" />}</div>
        <div className="w-44 min-w-0">
          <p className="text-sm truncate">{now?.title || (busy ? 'Loading…' : 'Nothing playing')}</p>
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
        <div className="hidden md:flex items-center gap-2 w-32">
          <Volume2 size={14} className="text-white/50" />
          <input type="range" min={0} max={1} step={0.05} value={vol} className="flex-1 accent-[#FF1493]" onChange={(e) => {
            const v = Number(e.target.value)
            setVol(v)
            if (audioRef.current) audioRef.current.volume = v
          }} />
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
