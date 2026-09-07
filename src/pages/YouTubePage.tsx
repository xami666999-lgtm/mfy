import { useEffect, useState } from 'react'
import { Search, Play } from 'lucide-react'
import { youtubioSearch, youtubioStream, YOUTUBIO_CONFIG, type YtItem } from '../api/youtubio'

const ROWS = [
  { id: 'tr', title: 'Trending', q: 'trending' },
  { id: 'mu', title: 'Music', q: 'music official video' },
  { id: 'gm', title: 'Gaming', q: 'gaming' },
  { id: 'nw', title: 'News', q: 'news today' },
  { id: 'lf', title: 'Lofi / chill', q: 'lofi hip hop' },
]

export default function YouTubePage() {
  const [q, setQ] = useState('')
  const [watch, setWatch] = useState('')
  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<Record<string, YtItem[]>>({})
  const [found, setFound] = useState<YtItem[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    ROWS.forEach(async (r) => {
      const items = await youtubioSearch(r.q)
      setRows((prev) => ({ ...prev, [r.id]: items }))
    })
  }, [])

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    setFound(await youtubioSearch(q.trim()))
    setBusy(false)
  }

  async function play(item: YtItem) {
    const s = await youtubioStream(item.id)
    setWatch(s.ytId || item.id)
    setTitle(item.title)
  }

  return (
    <div className="min-h-full bg-[#0c080e] text-white">
      <div className="h-14 px-5 flex items-center gap-3 border-b border-white/10">
        <span className="w-8 h-6 rounded-sm bg-[#FF1493] grid place-items-center text-[11px] font-black">M</span>
        <div>
          <div className="font-black tracking-wide leading-none">MFY Tube</div>
          <div className="text-[10px] text-white/40">YouTubio · ElfHosted</div>
        </div>
        <form className="flex-1 flex justify-center" onSubmit={onSearch}>
          <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#1a1016] border border-white/10 w-full max-w-xl">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search YouTube via YouTubio" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <button type="button" className="h-9 px-3 rounded-full bg-white/10 text-xs" onClick={() => (window as any).electronAPI?.openExternal?.(YOUTUBIO_CONFIG)}>
          Connect account
        </button>
      </div>

      {watch && (
        <div className="px-5 pt-4">
          <div className="aspect-video max-h-[56vh] rounded-xl overflow-hidden bg-black">
            <iframe title="yt" src={`https://www.youtube-nocookie.com/embed/${watch}?autoplay=1&rel=0`} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          </div>
          <div className="flex items-center justify-between py-3">
            <p className="font-semibold">{title}</p>
            <button type="button" className="text-xs text-white/40" onClick={() => setWatch('')}>Close player</button>
          </div>
        </div>
      )}

      {found.length > 0 && (
        <section className="px-5 py-3">
          <h3 className="text-sm font-bold mb-3">{busy ? 'Searching…' : 'Search results'}</h3>
          <Grid items={found} onPlay={play} />
        </section>
      )}

      {ROWS.map((r) => (
        <section key={r.id} className="px-5 py-3">
          <h3 className="text-sm font-bold mb-3">{r.title}</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(rows[r.id] || []).map((v) => (
              <button key={v.id} type="button" className="flex-none w-56 text-left" onClick={() => play(v)}>
                <div className="relative">
                  <img src={v.poster} alt="" className="w-56 aspect-video object-cover rounded-xl bg-[#1a1016]" />
                  <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#FF1493] grid place-items-center"><Play size={14} /></span>
                </div>
                <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
                {v.author && <p className="text-[11px] text-white/40">{v.author}</p>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Grid({ items, onPlay }: { items: YtItem[]; onPlay: (v: YtItem) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((v) => (
        <button key={v.id} type="button" className="text-left" onClick={() => onPlay(v)}>
          <img src={v.poster} alt="" className="w-full aspect-video object-cover rounded-xl bg-[#1a1016]" />
          <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
          {v.author && <p className="text-[11px] text-white/40">{v.author}</p>}
        </button>
      ))}
    </div>
  )
}
