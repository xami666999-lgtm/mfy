import { useEffect, useState } from 'react'
import { Play, Search } from 'lucide-react'
import { useStore } from '../store'

type Track = { id: string; title: string; artist: string; album: string; image: string; preview?: string; time: string }

function fmt(ms: number) {
  const s = Math.round((ms || 0) / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

async function songs(term: string): Promise<Track[]> {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=50`)
  const d = await r.json()
  return (d.results || []).map((s: any) => ({
    id: String(s.trackId),
    title: s.trackName,
    artist: s.artistName,
    album: s.collectionName,
    image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    preview: s.previewUrl,
    time: fmt(s.trackTimeMillis),
  }))
}

const NAV = ['Discover', 'Charts', 'Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic', 'Anime']

export default function MusicPage() {
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [tab, setTab] = useState('Discover')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [now, setNow] = useState<Track | null>(null)

  useEffect(() => { songs(tab === 'Discover' ? 'top hits' : tab).then((t) => { setTracks(t); setNow(t[0] || null) }) }, [tab])

  function play(t: Track) {
    setNow(t)
    if (t.preview) {
      setCurrentStreamUrl(t.preview)
      setCurrentPage('player')
    }
  }

  return (
    <div className="flex min-h-full bg-[#0b0b10] text-white">
      <aside className="w-52 flex-shrink-0 border-r border-white/[0.06] p-4">
        <p className="text-[10px] tracking-[0.25em] text-[#FF1493] font-bold mb-4">MFY MUSIC</p>
        {NAV.map((n) => (
          <button key={n} type="button" onClick={() => setTab(n)} className={`w-full text-left h-9 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-[#FF1493]/20 text-[#FF1493]' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>
      <div className="flex-1 p-6">
        <form className="flex gap-2 mb-6" onSubmit={(e) => { e.preventDefault(); songs(q || tab).then(setTracks) }}>
          <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-full bg-white/[0.04] border border-white/[0.07]">
            <Search className="w-4 h-4 text-white/30" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracks, artists" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        {now && (
          <div className="flex gap-5 mb-8 items-end">
            <img src={now.image} alt="" referrerPolicy="no-referrer" className="w-40 h-40 rounded-xl object-cover shadow-2xl" />
            <div>
              <p className="text-[10px] tracking-widest text-[#FF1493] font-bold">NOW PLAYING</p>
              <h2 className="text-3xl font-bold mt-1">{now.title}</h2>
              <p className="text-white/50 mt-1">{now.artist} · {now.album}</p>
              <button type="button" className="mt-4 h-10 px-5 rounded-full bg-[#FF1493] text-sm font-semibold inline-flex items-center gap-2" onClick={() => play(now)}><Play size={14} fill="white" /> Play preview</button>
            </div>
          </div>
        )}
        <div className="text-[11px] text-white/30 grid grid-cols-[2rem_1fr_1fr_4rem] gap-3 px-2 mb-2">
          <span>#</span><span>TITLE</span><span>ALBUM</span><span>TIME</span>
        </div>
        {tracks.map((t, i) => (
          <button key={t.id} type="button" onClick={() => play(t)} className="w-full grid grid-cols-[2rem_1fr_1fr_4rem] gap-3 items-center px-2 py-2 rounded-lg hover:bg-white/[0.04] text-left">
            <span className="text-white/30 text-xs">{i + 1}</span>
            <span className="flex items-center gap-3 min-w-0">
              <img src={t.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded object-cover" />
              <span className="min-w-0">
                <span className="block text-sm truncate">{t.title}</span>
                <span className="block text-[11px] text-white/40 truncate">{t.artist}</span>
              </span>
            </span>
            <span className="text-xs text-white/40 truncate">{t.album}</span>
            <span className="text-xs text-white/35">{t.time}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
