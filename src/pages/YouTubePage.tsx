import { useState } from 'react'
import { Search } from 'lucide-react'

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

export default function YouTubePage() {
  const [mode, setMode] = useState<'app' | 'search'>('app')
  const [q, setQ] = useState('')
  const [watch, setWatch] = useState('')
  const [items, setItems] = useState<any[]>([])

  async function search(term: string) {
    const api = (window as any).electronAPI
    const path = `/api/v1/search?q=${encodeURIComponent(term || 'music')}&type=video`
    for (const h of INVIDIOUS) {
      try {
        const r = api?.fetchJson ? await api.fetchJson(h + path, { timeoutMs: 10000 }) : { json: await (await fetch(h + path)).json() }
        const rows = Array.isArray(r?.json) ? r.json : []
        const mapped = rows.filter((v: any) => v.videoId).map((v: any) => ({
          id: v.videoId,
          title: v.title,
          author: v.author,
        }))
        if (mapped.length) { setItems(mapped); return }
      } catch {}
    }
  }

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white flex flex-col">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-white/10 bg-[#111]">
        <span className="w-7 h-5 rounded-sm bg-[#FF1493] grid place-items-center text-[10px] font-black">M</span>
        <span className="font-black tracking-wide">MFY Tube</span>
        <span className="text-[10px] text-white/30">NouTube layout</span>
        <div className="flex-1" />
        <button type="button" className={`h-8 px-3 rounded-full text-xs ${mode === 'app' ? 'bg-[#FF1493]' : 'bg-white/10'}`} onClick={() => setMode('app')}>YouTube</button>
        <button type="button" className={`h-8 px-3 rounded-full text-xs ${mode === 'search' ? 'bg-[#FF1493]' : 'bg-white/10'}`} onClick={() => setMode('search')}>Search</button>
      </div>
      {mode === 'app' ? (
        <div className="flex-1 min-h-[70vh]">
          {/* @ts-expect-error Electron webview */}
          <webview
            src="https://m.youtube.com"
            partition="persist:mfy-yt"
            style={{ width: '100%', height: '100%', minHeight: '70vh', background: '#000' }}
            allowpopups="false"
            useragent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36"
          />
        </div>
      ) : (
        <div className="p-4">
          <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); search(q) }}>
            <div className="flex-1 flex items-center gap-2 h-11 px-4 rounded-full bg-[#222]">
              <Search size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search YouTube" className="flex-1 bg-transparent text-sm outline-none" />
            </div>
          </form>
          {watch && (
            <div className="aspect-video rounded-xl overflow-hidden bg-black mb-4">
              <iframe title="MFY" src={`https://www.youtube-nocookie.com/embed/${watch}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((v) => (
              <button key={v.id} type="button" className="text-left" onClick={() => setWatch(v.id)}>
                <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
                <p className="text-xs text-white/40">{v.author}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
