import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Search, Heart, SkipBack, SkipForward, ListMusic } from 'lucide-react'

type Track = { id: string; title: string; artist: string; album?: string; image?: string; url?: string; videoId?: string }

const NAV = ['Dashboard', 'Search', 'Queue', 'Favorites']
const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

async function jsonGet(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 12000 })
    return r?.json || {}
  }
  return (await fetch(url)).json()
}

async function searchTracks(term: string): Promise<Track[]> {
  const q = term || 'top hits'
  const out: Track[] = []
  try {
    const d = await jsonGet(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=24`)
    for (const s of d.results || []) {
      out.push({
        id: 'it-' + s.trackId,
        title: s.trackName,
        artist: s.artistName,
        album: s.collectionName,
        image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
        url: s.previewUrl,
      })
    }
  } catch {}
  try {
    const d = await jsonGet(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=24`)
    for (const s of d.data || []) {
      out.push({
        id: 'dz-' + s.id,
        title: s.title,
        artist: s.artist?.name,
        album: s.album?.title,
        image: s.album?.cover_medium,
        url: s.preview,
      })
    }
  } catch {}
  try {
    for (const h of INVIDIOUS) {
      const d = await jsonGet(`${h}/api/v1/search?q=${encodeURIComponent(q + ' official audio')}&type=video`)
      const rows = Array.isArray(d) ? d : []
      if (!rows.length) continue
      for (const v of rows.slice(0, 16)) {
        out.push({
          id: 'yt-' + v.videoId,
          title: v.title,
          artist: v.author,
          image: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          videoId: v.videoId,
          url: `${h}/latest_version?id=${v.videoId}&itag=140`,
        })
      }
      break
    }
  } catch {}
  const seen = new Set<string>()
  return out.filter((t) => {
    const k = (t.title + t.artist).toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export default function MusicPage() {
  const [tab, setTab] = useState('Dashboard')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [queue, setQueue] = useState<Track[]>([])
  const [favs, setFavs] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-music-favs') || '[]') } catch { return [] }
  })
  const [now, setNow] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => { searchTracks('top hits 2025').then(setTracks) }, [])

  function persistFavs(next: Track[]) {
    setFavs(next)
    try { localStorage.setItem('mfy-music-favs', JSON.stringify(next.slice(0, 80))) } catch {}
  }

  function play(t: Track) {
    setNow(t)
    setQueue((q0) => [t, ...q0.filter((x) => x.id !== t.id)].slice(0, 40))
    const el = audioRef.current
    if (!el) return
    el.src = t.url || ''
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  function skip(dir: number) {
    if (!now) return
    const list = queue.length ? queue : tracks
    const i = list.findIndex((x) => x.id === now.id)
    const n = list[(i + dir + list.length) % list.length]
    if (n) play(n)
  }

  const shown = tab === 'Favorites' ? favs : tab === 'Queue' ? queue : tracks

  return (
    <div className="flex min-h-full bg-[#1a0b12] text-white">
      <aside className="w-52 flex-shrink-0 bg-black/70 p-4">
        <p className="text-[10px] tracking-[0.28em] text-[#FF1493] font-bold mb-1">MFY MUSIC</p>
        <p className="text-[10px] text-white/30 mb-5">Nuclear layout</p>
        {NAV.map((n) => (
          <button key={n} type="button" onClick={() => setTab(n)} className={`w-full text-left h-10 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-[#FF1493]/25 text-white' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto pb-28">
        <form className="flex gap-2 mb-6" onSubmit={(e) => { e.preventDefault(); searchTracks(q || 'top hits').then(setTracks); setTab('Search') }}>
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black">
            <Search className="w-4 h-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists, albums, tracks" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <div className="flex items-end gap-5 mb-8">
          <div className="w-36 h-36 rounded-lg overflow-hidden bg-white/10 shrink-0">
            {now?.image && <img src={now.image} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] text-[#FF1493] font-bold">NOW PLAYING</p>
            <h1 className="text-3xl font-black">{now?.title || 'MFY Music'}</h1>
            <p className="text-white/50">{now?.artist || 'Search and play from free sources'}</p>
          </div>
        </div>
        <div className="space-y-1">
          {shown.map((t, i) => (
            <div key={t.id} className={`flex items-center gap-3 px-3 h-14 rounded-lg hover:bg-white/5 ${now?.id === t.id ? 'bg-[#FF1493]/15' : ''}`}>
              <span className="w-6 text-xs text-white/30">{i + 1}</span>
              <button type="button" onClick={() => play(t)} className="w-10 h-10 rounded overflow-hidden bg-white/10 shrink-0">
                {t.image ? <img src={t.image} alt="" className="w-full h-full object-cover" /> : <Play size={14} className="m-auto" />}
              </button>
              <button type="button" className="flex-1 text-left min-w-0" onClick={() => play(t)}>
                <p className="text-sm truncate">{t.title}</p>
                <p className="text-xs text-white/40 truncate">{t.artist}</p>
              </button>
              <button type="button" onClick={() => persistFavs(favs.some((f) => f.id === t.id) ? favs.filter((f) => f.id !== t.id) : [t, ...favs])} className={favs.some((f) => f.id === t.id) ? 'text-[#FF1493]' : 'text-white/30'}>
                <Heart size={14} fill={favs.some((f) => f.id === t.id) ? 'currentColor' : 'none'} />
              </button>
              <button type="button" className="text-white/30" onClick={() => setQueue((qq) => [...qq, t])}><ListMusic size={14} /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-black/90 border-t border-white/10 flex items-center px-5 gap-4 z-20">
        <div className="w-12 h-12 rounded bg-white/10 overflow-hidden">{now?.image && <img src={now.image} alt="" className="w-full h-full object-cover" />}</div>
        <div className="w-44 min-w-0">
          <p className="text-sm truncate">{now?.title || 'Nothing playing'}</p>
          <p className="text-xs text-white/40 truncate">{now?.artist || ''}</p>
        </div>
        <div className="flex-1 flex items-center justify-center gap-4">
          <button type="button" onClick={() => skip(-1)}><SkipBack size={18} /></button>
          <button type="button" className="w-11 h-11 rounded-full bg-[#FF1493] grid place-items-center" onClick={() => {
            const el = audioRef.current
            if (!el) return
            if (playing) { el.pause(); setPlaying(false) } else { el.play(); setPlaying(true) }
          }}>{playing ? <Pause size={16} /> : <Play size={16} fill="white" />}</button>
          <button type="button" onClick={() => skip(1)}><SkipForward size={18} /></button>
        </div>
        <audio ref={audioRef} onEnded={() => skip(1)} />
      </div>
    </div>
  )
}
