import { useEffect, useState } from 'react'
import { Search, Bell, Menu } from 'lucide-react'
import { noutubeApi } from '../api/noutube'
import { useStore } from '../store'

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be']
const CHIPS = ['Home', 'Music', 'Gaming', 'News', 'Live', 'Anime', 'Movies', 'Sports']

type Vid = { videoId: string; title: string; author: string; views?: string }

async function feed(q: string): Promise<Vid[]> {
  try {
    const d = q === 'Home' ? await noutubeApi.getTrending(1) : await noutubeApi.search(q, 1)
    const videos = (d as any).videos || []
    if (videos.length) {
      return videos.slice(0, 48).map((v: any) => ({
        videoId: v.videoId,
        title: v.title,
        author: v.author,
        views: v.viewCount ? `${Number(v.viewCount).toLocaleString()} views` : '',
      }))
    }
  } catch {}
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const hosts = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']
  const path = !q || q === 'Home' ? '/api/v1/trending' : `/api/v1/search?q=${encodeURIComponent(q)}&type=video`
  for (const h of hosts) {
    try {
      const r = api?.fetchJson ? await api.fetchJson(h + path, { timeoutMs: 10000 }) : { json: await (await fetch(h + path)).json() }
      const rows = Array.isArray(r?.json) ? r.json : (r?.json?.videos || [])
      const mapped = rows.filter((v: any) => v.videoId).map((v: any) => ({
        videoId: v.videoId,
        title: v.title,
        author: v.author,
        views: v.viewCount ? `${Number(v.viewCount).toLocaleString()} views` : '',
      }))
      if (mapped.length) return mapped.slice(0, 48)
    } catch {}
  }
  return []
}

export default function YouTubePage() {
  const { setCurrentStreamUrl, setCurrentPage, setSelectedMedia } = useStore()
  const [q, setQ] = useState('')
  const [chip, setChip] = useState('Home')
  const [items, setItems] = useState<Vid[]>([])
  const [loading, setLoading] = useState(true)
  const [watchId, setWatchId] = useState('')

  useEffect(() => {
    setLoading(true)
    feed(q.trim() || chip).then(setItems).finally(() => setLoading(false))
  }, [chip])

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white">
      <div className="h-14 px-4 flex items-center gap-3 border-b border-white/10">
        <Menu className="w-5 h-5 text-white/70" />
        <div className="flex items-center gap-1 font-bold text-lg">
          <span className="w-8 h-5 rounded-sm bg-[#FF1493] grid place-items-center text-[10px] font-black">M</span>
          MFY
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
      {watchId && (
        <div className="px-4 mb-4">
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe title="MFY Tube" src={`https://www.youtube-nocookie.com/embed/${watchId}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
          </div>
        </div>
      )}
      <div className="px-4 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((v) => (
          <button key={v.videoId} type="button" className="text-left" onClick={() => setWatchId(v.videoId)}>
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
