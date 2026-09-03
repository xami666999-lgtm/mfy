import { useEffect, useState } from 'react'
import { Play, Search, Heart, SkipBack, SkipForward } from 'lucide-react'

type Track = { id: string; title: string; artist: string; album?: string; image?: string; url?: string }

const NAV = ['Home', 'Search', 'Your Library', 'Liked']
const CHIPS = ['Top hits', 'Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic', 'Anime openings']

function art(url?: string) {
  if (!url) return ''
  if (url.includes('weserv.nl')) return url
  return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=400&h=400&fit=cover`
}

async function jsonGet(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 12000 })
    return r?.json || {}
  }
  return (await fetch(url)).json()
}

async function itunes(term: string): Promise<Track[]> {
  try {
    const d = await jsonGet(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=40`)
    const rows = (d.results || []).map((s: any) => ({
      id: String(s.trackId),
      title: s.trackName,
      artist: s.artistName,
      album: s.collectionName,
      image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
      url: s.previewUrl,
    }))
    if (rows.length) return rows
  } catch {}
  try {
    const d = await jsonGet(`https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=40`)
    return (d.data || []).map((s: any) => ({
      id: String(s.id),
      title: s.title,
      artist: s.artist?.name,
      album: s.album?.title,
      image: s.album?.cover_medium || s.album?.cover,
      url: s.preview,
    }))
  } catch {}
  return []
}

export default function MusicPage() {
  const [tab, setTab] = useState('Home')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [now, setNow] = useState<Track | null>(null)
  const [audioUrl, setAudioUrl] = useState('')

  async function load(term: string) {
    const list = await itunes(term === 'Home' || term === 'Top hits' ? 'top hits 2024' : term).catch(() => [])
    setTracks(list)
    if (list[0]) setNow((cur) => cur || list[0])
  }

  useEffect(() => { load('Home') }, [])

  function play(t: Track) {
    setNow(t)
    if (t.url) setAudioUrl(t.url)
  }
  function skip(dir: number) {
    if (!now) return
    const i = tracks.findIndex((x) => x.id === now.id)
    const n = tracks[(i + dir + tracks.length) % tracks.length]
    if (n) play(n)
  }

  return (
    <div className="flex min-h-full bg-gradient-to-b from-[#2a0d18] to-[#0b0b10] text-white">
      <aside className="w-52 flex-shrink-0 bg-black/50 p-4">
        <p className="text-[10px] tracking-[0.28em] text-[#FF1493] font-bold mb-5">MFY MUSIC</p>
        {NAV.map((n) => (
          <button key={n} type="button" onClick={() => { setTab(n); if (n === 'Home') load('Home') }} className={`w-full text-left h-10 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-[#FF1493]/20 text-white' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto pb-28">
        <form className="flex gap-2 mb-5" onSubmit={(e) => { e.preventDefault(); load(q || 'Home') }}>
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black">
            <Search className="w-4 h-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to play?" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <div className="flex gap-2 mb-6 flex-wrap">
          {CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => load(c)} className="h-8 px-3 rounded-full bg-white/10 text-xs hover:bg-[#FF1493]/30">{c}</button>
          ))}
        </div>
        {now && (
          <div className="flex gap-5 mb-8 items-end">
            {art(now.image) ? (
              <img src={art(now.image)} alt="" className="w-44 h-44 rounded-md object-cover shadow-2xl bg-white/10" />
            ) : (
              <div className="w-44 h-44 rounded-md bg-[#FF1493]/30 grid place-items-center text-3xl font-black">{now.title[0]}</div>
            )}
            <div>
              <p className="text-[11px] font-bold tracking-widest text-[#FF1493]">PLAYLIST</p>
              <h2 className="text-4xl font-black mt-1">{now.title}</h2>
              <p className="text-white/60 mt-2">{now.artist}</p>
              <div className="flex gap-2 mt-4">
                <button type="button" className="h-12 w-12 rounded-full bg-[#FF1493] grid place-items-center" onClick={() => play(now)}><Play fill="white" className="text-white" /></button>
                <Heart className="w-6 h-6 text-white/40 self-center" />
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {tracks.slice(0, 12).map((t) => (
            <button key={`g-${t.id}`} type="button" onClick={() => play(t)} className="text-left">
              {art(t.image) ? (
                <img src={art(t.image)} alt="" className="w-full aspect-square rounded-lg object-cover bg-white/10" />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-white/10 grid place-items-center">{t.title[0]}</div>
              )}
              <p className="text-sm mt-2 truncate">{t.title}</p>
              <p className="text-[11px] text-white/40 truncate">{t.artist}</p>
            </button>
          ))}
        </div>
        {tracks.map((t, i) => (
          <button key={t.id} type="button" onClick={() => play(t)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/5 text-left">
            <span className="w-6 text-white/30 text-xs">{i + 1}</span>
            {art(t.image) ? <img src={art(t.image)} alt="" className="w-10 h-10 rounded object-cover bg-white/10" /> : <div className="w-10 h-10 rounded bg-white/10" />}
            <span className="flex-1 min-w-0">
              <span className="block text-sm truncate">{t.title}</span>
              <span className="block text-[11px] text-white/40 truncate">{t.artist}</span>
            </span>
            <span className="text-xs text-white/30 truncate hidden sm:block">{t.album}</span>
          </button>
        ))}
      </div>
      {audioUrl && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3 mb-1">
            <button type="button" onClick={() => skip(-1)}><SkipBack size={16} /></button>
            <p className="text-xs text-[#FF1493] flex-1">{now?.title} — {now?.artist}</p>
            <button type="button" onClick={() => skip(1)}><SkipForward size={16} /></button>
          </div>
          <audio src={audioUrl} autoPlay controls className="w-full" onEnded={() => skip(1)} />
        </div>
      )}
    </div>
  )
}
