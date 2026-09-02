import { useEffect, useState } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { useStore } from '../store'

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be']
const CHIPS = ['Home', 'Music', 'Gaming', 'News', 'Live', 'Anime', 'Movies', 'Sports']

type Vid = { videoId: string; title: string; author: string; views?: string }

async function feed(q: string): Promise<Vid[]> {
  const path = q === 'Home'
    ? '/api/v1/trending'
    : `/api/v1/search?q=${encodeURIComponent(q)}&type=video`
  for (const base of INVIDIOUS) {
    try {
      const r = await fetch(base + path, { signal: AbortSignal.timeout(7000) })
      if (!r.ok) continue
      const rows = await r.json()
      const list = Array.isArray(rows) ? rows : []
      return list.filter((v: any) => v.videoId).slice(0, 48).map((v: any) => ({
        videoId: v.videoId,
        title: v.title,
        author: v.author,
        views: v.viewCountText || (v.viewCount ? `${Number(v.viewCount).toLocaleString()} views` : ''),
      }))
    } catch {}
  }
  return []
}

export default function YouTubePage() {
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [q, setQ] = useState('')
  const [chip, setChip] = useState('Home')
  const [items, setItems] = useState<Vid[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    feed(q.trim() || chip).then(setItems).finally(() => setLoading(false))
  }, [chip])

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white">
      <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10">
        <Menu className="w-5 h-5 text-white/70" />
        <div className="flex items-center gap-1 font-bold text-lg">
          <span className="w-8 h-5 rounded-sm bg-[#ff0000] grid place-items-center text-[10px]">▶</span>
          MFY Tube
        </div>
        <form className="flex-1 max-w-2xl mx-auto flex" onSubmit={(e) => { e.preventDefault(); setLoading(true); feed(q || chip).then(setItems).finally(() => setLoading(false)) }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="flex-1 h-10 px-4 rounded-l-full bg-[#121212] border border-white/15 text-sm outline-none" />
          <button type="submit" className="h-10 w-16 rounded-r-full bg-[#222] border border-l-0 border-white/15 grid place-items-center"><Search className="w-4 h-4" /></button>
        </form>
        <Bell className="w-5 h-5 text-white/50" />
        <button
          type="button"
          className="h-9 px-3 rounded-full border border-[#3ea6ff] text-[#3ea6ff] text-xs font-semibold"
          onClick={() => (window as any).electronAPI?.openExternal?.('https://www.youtube.com') || window.open('https://www.youtube.com', '_blank')}
        >
          Sign in
        </button>
      </div>
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => setChip(c)} className={`h-8 px-3 rounded-lg text-xs whitespace-nowrap ${chip === c ? 'bg-white text-black' : 'bg-white/10 text-white/80'}`}>{c}</button>
        ))}
      </div>
      {loading && <p className="px-4 text-sm text-white/40">Loading…</p>}
      <div className="px-4 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((v) => (
          <button key={v.videoId} type="button" className="text-left" onClick={() => { setCurrentStreamUrl(`https://www.youtube.com/embed/${v.videoId}`); setCurrentPage('player') }}>
            <div className="aspect-video rounded-xl overflow-hidden bg-[#222]">
              <img src={`https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-medium mt-2 line-clamp-2">{v.title}</p>
            <p className="text-xs text-white/50">{v.author}</p>
            {v.views && <p className="text-[11px] text-white/35">{v.views}</p>}
          </button>
        ))}
      </div>
    </div>
  )
}
