import { useEffect, useState } from 'react'
import { Search, Play, Trash2 } from 'lucide-react'

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

type Saved = { id: string; title: string; author: string }

export default function YouTubePage() {
  const [tab, setTab] = useState<'yt' | 'music' | 'library' | 'search' | 'youtubio'>('yt')
  const [q, setQ] = useState('')
  const [watch, setWatch] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [saved, setSaved] = useState<Saved[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-yt-lib') || '[]') } catch { return [] }
  })

  function persist(next: Saved[]) {
    setSaved(next)
    try { localStorage.setItem('mfy-yt-lib', JSON.stringify(next.slice(0, 80))) } catch {}
  }

  async function search(term: string) {
    const api = (window as any).electronAPI
    const path = `/api/v1/search?q=${encodeURIComponent(term || 'music')}&type=video`
    for (const h of INVIDIOUS) {
      try {
        const r = api?.fetchJson ? await api.fetchJson(h + path, { timeoutMs: 12000 }) : { json: await (await fetch(h + path)).json() }
        const rows = Array.isArray(r?.json) ? r.json : []
        const mapped = rows.filter((v: any) => v.videoId).map((v: any) => ({
          id: v.videoId, title: v.title, author: v.author,
        }))
        if (mapped.length) { setItems(mapped); return }
      } catch {}
    }
  }

  useEffect(() => { if (tab === 'search' && !items.length) search('trending music') }, [tab])

  const src = tab === 'music' ? 'https://music.youtube.com' : 'https://m.youtube.com'

  return (
    <div className="min-h-full bg-[#0f0f0f] text-white flex flex-col">
      <div className="h-12 px-4 flex items-center gap-3 border-b border-white/10 bg-[#111]">
        <span className="w-7 h-5 rounded-sm bg-[#FF1493] grid place-items-center text-[10px] font-black">M</span>
        <span className="font-black tracking-wide">MFY Tube</span>
        <div className="flex-1" />
        {(['yt', 'music', 'youtubio', 'search', 'library'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`h-8 px-3 rounded-full text-xs capitalize ${tab === t ? 'bg-[#FF1493]' : 'bg-white/10'}`}>
            {t === 'yt' ? 'YouTube' : t === 'music' ? 'YT Music' : t}
          </button>
        ))}
      </div>
      {tab === 'youtubio' && (
        <div className="flex-1 min-h-[72vh]">
          {/* @ts-expect-error Electron webview */}
          <webview src="https://youtubio.elfhosted.com" partition="persist:mfy-yt" style={{ width: '100%', height: '100%', minHeight: '72vh', background: '#000' }} allowpopups="false" />
        </div>
      )}
      {(tab === 'yt' || tab === 'music') && (
        <div className="flex-1 min-h-[72vh]">
          {/* @ts-expect-error Electron webview */}
          <webview
            key={src}
            src={src}
            partition="persist:mfy-yt"
            style={{ width: '100%', height: '100%', minHeight: '72vh', background: '#000' }}
            allowpopups="false"
            useragent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36"
          />
        </div>
      )}
      {tab === 'search' && (
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
              <div key={v.id} className="text-left">
                <button type="button" className="w-full" onClick={() => setWatch(v.id)}>
                  <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover rounded-xl" />
                  <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
                  <p className="text-xs text-white/40">{v.author}</p>
                </button>
                <button type="button" className="text-[11px] text-[#FF1493] mt-1" onClick={() => persist([{ id: v.id, title: v.title, author: v.author }, ...saved.filter((s) => s.id !== v.id)])}>Save</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === 'library' && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {saved.length === 0 && <p className="text-white/40">Saved videos show here</p>}
          {saved.map((v) => (
            <div key={v.id}>
              <button type="button" className="w-full text-left" onClick={() => { setWatch(v.id); setTab('search') }}>
                <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <p className="text-sm mt-2">{v.title}</p>
              </button>
              <button type="button" className="text-white/30 mt-1" onClick={() => persist(saved.filter((s) => s.id !== v.id))}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
