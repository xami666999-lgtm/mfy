import { useEffect, useState } from 'react'
import { Play, Search, Heart } from 'lucide-react'
import { eclipseApi } from '../api/eclipse'
import { useStore } from '../store'

type Track = { id: string; title: string; artist: string; album?: string; image?: string; url?: string }

const NAV = ['Home', 'Search', 'Your Library', 'Liked']
const CHIPS = ['Eclipse charts', 'Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic', 'Anime openings']

function mapEclipse(d: any): Track[] {
  const rows = d?.tracks || d?.results || []
  return rows.map((t: any, i: number) => ({
    id: String(t.id || t.trackId || i),
    title: t.title || t.name || t.trackName,
    artist: t.artist || t.artistName || t.artists?.[0]?.name || 'Unknown',
    album: t.album || t.collectionName,
    image: t.artwork || t.image || t.cover || String(t.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    url: t.url || t.previewUrl,
  }))
}

async function itunes(term: string): Promise<Track[]> {
  const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=40`)
  const d = await r.json()
  return (d.results || []).map((s: any) => ({
    id: String(s.trackId),
    title: s.trackName,
    artist: s.artistName,
    album: s.collectionName,
    image: String(s.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    url: s.previewUrl,
  }))
}

export default function MusicPage() {
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [tab, setTab] = useState('Home')
  const [q, setQ] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [now, setNow] = useState<Track | null>(null)

  async function load(term: string) {
    try {
      const d = await eclipseApi.getTrending('tracks', 1, 40)
      let list = mapEclipse(d)
      if (term && term !== 'Home' && term !== 'Eclipse charts') {
        try { list = mapEclipse(await eclipseApi.search(term, 'tracks', 1, 40)) } catch {}
      }
      if (!list.length) list = await itunes(term === 'Home' || term === 'Eclipse charts' ? 'top hits' : term)
      setTracks(list)
      setNow((cur) => cur || list[0] || null)
    } catch {
      const list = await itunes(term || 'top hits')
      setTracks(list)
      setNow(list[0] || null)
    }
  }

  useEffect(() => { load('Home') }, [])

  function play(t: Track) {
    setNow(t)
    if (t.url) {
      setCurrentStreamUrl(t.url)
      setCurrentPage('player')
    }
  }

  return (
    <div className="flex min-h-full bg-gradient-to-b from-[#1a0b14] to-[#0b0b10] text-white">
      <aside className="w-56 flex-shrink-0 bg-black/40 p-4">
        <p className="text-[10px] tracking-[0.28em] text-[#FF1493] font-bold mb-5">MFY</p>
        {NAV.map((n) => (
          <button key={n} type="button" onClick={() => { setTab(n); if (n === 'Home') load('Home') }} className={`w-full text-left h-10 px-3 rounded-lg text-sm mb-1 ${tab === n ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>{n}</button>
        ))}
      </aside>
      <div className="flex-1 p-6 overflow-y-auto">
        <form className="flex gap-2 mb-5" onSubmit={(e) => { e.preventDefault(); load(q || 'Home') }}>
          <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-white text-black">
            <Search className="w-4 h-4" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What do you want to play?" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <div className="flex gap-2 mb-6 flex-wrap">
          {CHIPS.map((c) => (
            <button key={c} type="button" onClick={() => load(c)} className="h-8 px-3 rounded-full bg-white/10 text-xs hover:bg-white/20">{c}</button>
          ))}
        </div>
        {now && (
          <div className="flex gap-5 mb-8 items-end">
            {now.image && <img src={now.image} alt="" referrerPolicy="no-referrer" className="w-44 h-44 rounded-md object-cover shadow-2xl" />}
            <div>
              <p className="text-[11px] font-bold tracking-widest">PLAYLIST</p>
              <h2 className="text-4xl font-black mt-1">{now.title}</h2>
              <p className="text-white/60 mt-2">{now.artist}</p>
              <div className="flex gap-2 mt-4">
                <button type="button" className="h-12 w-12 rounded-full bg-[#1db954] grid place-items-center" onClick={() => play(now)}><Play fill="black" className="text-black" /></button>
                <Heart className="w-6 h-6 text-white/40 self-center" />
              </div>
            </div>
          </div>
        )}
        {tracks.map((t, i) => (
          <button key={t.id} type="button" onClick={() => play(t)} className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/5 text-left">
            <span className="w-6 text-white/30 text-xs">{i + 1}</span>
            {t.image && <img src={t.image} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded object-cover" />}
            <span className="flex-1 min-w-0">
              <span className="block text-sm truncate">{t.title}</span>
              <span className="block text-[11px] text-white/40 truncate">{t.artist}</span>
            </span>
            <span className="text-xs text-white/30 truncate hidden sm:block">{t.album}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
