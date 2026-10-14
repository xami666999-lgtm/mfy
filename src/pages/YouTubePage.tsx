import { useEffect, useState } from 'react'
import { Search, Play, ExternalLink, MonitorPlay } from 'lucide-react'
import {
  youtubioSearch,
  youtubioDiscover,
  youtubioStream,
  youtubeEmbedUrl,
  youtubeWatchUrl,
  vid,
  YOUTUBIO_CONFIG,
  type YtItem,
} from '../api/youtubio'
import { useStore } from '../store'

const ROWS = [
  { id: 'tr', title: 'Trending', q: 'trending' },
  { id: 'mu', title: 'Music', q: 'music official video' },
  { id: 'gm', title: 'Gaming', q: 'gaming' },
  { id: 'nw', title: 'News', q: 'news today' },
  { id: 'lf', title: 'Lofi / chill', q: 'lofi hip hop' },
  { id: 'mv', title: 'Music videos', q: 'official music video' },
  { id: 'sp', title: 'Sports', q: 'sports highlights' },
]

export default function YouTubePage() {
  const { setSelectedMedia, setCurrentPage } = useStore() as any
  const [q, setQ] = useState('')
  const [watch, setWatch] = useState('')
  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<Record<string, YtItem[]>>({})
  const [found, setFound] = useState<YtItem[]>([])
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    ;(window as any).electronAPI?.youtubeLoginStatus?.().then((s: any) => setSignedIn(!!s?.signedIn)).catch(() => {})
    youtubioDiscover().then((items) => setRows((prev) => ({ ...prev, disc: items })))
    ROWS.forEach(async (r) => {
      const items = await youtubioSearch(r.q)
      setRows((prev) => ({ ...prev, [r.id]: items }))
    })
  }, [])

  async function signIn() {
    const api = (window as any).electronAPI
    if (!api?.openYouTubeLogin) {
      api?.openExternal?.('https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com/')
      return
    }
    const r = await api.openYouTubeLogin()
    setSignedIn(!!r?.signedIn)
  }

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!q.trim()) return
    setBusy(true)
    setFound(await youtubioSearch(q.trim()))
    setBusy(false)
  }

  async function play(item: YtItem) {
    const s = await youtubioStream(item.id)
    const id = s.ytId || item.id
    setWatch(id)
    setTitle(item.title)
  }

  async function playInMfy(item: YtItem) {
    const s = await youtubioStream(item.id)
    const id = s.ytId || item.id
    setSelectedMedia({
      id,
      title: item.title,
      name: item.title,
      type: 'youtube',
      poster: item.poster,
      streamUrl: youtubeEmbedUrl(id),
      youtubeId: id,
      url: youtubeWatchUrl(id),
    })
    setCurrentPage?.('player')
    setWatch(id)
    setTitle(item.title)
  }

  function openExternal(item: YtItem) {
    ;(window as any).electronAPI?.openExternal?.(youtubeWatchUrl(item.id))
  }

  const embed = watch ? `https://www.youtube.com/embed/${vid(watch)}?autoplay=1&rel=0` : ''

  return (
    <div className="min-h-full bg-[#07070a] text-white">
      <div className="h-14 px-12 flex items-center gap-3 border-b border-white/10">
        <div>
          <div className="font-semibold tracking-tight leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>YouTube</div>
          <div className="text-[10px] text-white/40">{signedIn ? 'Signed in' : 'Not signed in'} · official Google login</div>
        </div>
        <form className="flex-1 flex justify-center" onSubmit={onSearch}>
          <div className="flex items-center gap-2 h-10 px-4 rounded-full bg-white/5 border border-white/10 w-full max-w-xl">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search YouTube" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        <button type="button" className="h-9 px-3 rounded-full bg-white text-black text-xs font-semibold" onClick={signIn}>
          {signedIn ? 'Switch account' : 'Sign in to YouTube'}
        </button>
        <button type="button" className="h-9 px-3 rounded-full bg-white/10 text-xs" onClick={() => (window as any).electronAPI?.openExternal?.(YOUTUBIO_CONFIG)}>
          YouTubio lists
        </button>
      </div>

      {watch && (
        <div className="px-12 pt-4">
          <div className="aspect-video max-h-[56vh] rounded-xl overflow-hidden bg-black">
            <iframe title="yt" src={embed || youtubeEmbedUrl(watch)} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          </div>
          <div className="flex items-center justify-between py-3 gap-3">
            <p className="font-semibold truncate">{title}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button type="button" className="text-xs text-white/50" onClick={() => (window as any).electronAPI?.openExternal?.(youtubeWatchUrl(watch))}>Open on YouTube</button>
              <button type="button" className="text-xs text-white/40" onClick={() => setWatch('')}>Close</button>
            </div>
          </div>
        </div>
      )}

      {found.length > 0 && (
        <section className="px-12 py-3">
          <h3 className="text-sm font-bold mb-3">{busy ? 'Searching…' : 'Search results'}</h3>
          <Grid items={found} onPlay={play} onMfy={playInMfy} onExt={openExternal} />
        </section>
      )}

      {rows.disc?.length ? (
        <section className="px-12 py-3">
          <h3 className="text-sm font-bold mb-3">Discover</h3>
          <Row items={rows.disc} onPlay={play} />
        </section>
      ) : null}

      {ROWS.map((r) => (
        <section key={r.id} className="px-12 py-3">
          <h3 className="text-sm font-bold mb-3">{r.title}</h3>
          <Row items={rows[r.id] || []} onPlay={play} />
        </section>
      ))}
    </div>
  )
}

function Row({ items, onPlay }: { items: YtItem[]; onPlay: (v: YtItem) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {items.map((v) => (
        <button key={v.id} type="button" className="flex-none w-56 text-left" onClick={() => onPlay(v)}>
          <div className="relative">
            <img src={v.poster} alt="" className="w-56 aspect-video object-cover rounded-xl bg-white/5" />
            <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white grid place-items-center"><Play size={14} color="#111" /></span>
          </div>
          <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
          {v.author && <p className="text-[11px] text-white/40">{v.author}</p>}
        </button>
      ))}
    </div>
  )
}

function Grid({ items, onPlay, onMfy, onExt }: { items: YtItem[]; onPlay: (v: YtItem) => void; onMfy: (v: YtItem) => void; onExt: (v: YtItem) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((v) => (
        <div key={v.id} className="text-left">
          <button type="button" className="w-full text-left" onClick={() => onPlay(v)}>
            <img src={v.poster} alt="" className="w-full aspect-video object-cover rounded-xl bg-white/5" />
            <p className="text-sm mt-2 line-clamp-2">{v.title}</p>
            {v.author && <p className="text-[11px] text-white/40">{v.author}</p>}
          </button>
          <div className="flex gap-2 mt-1 text-[11px] text-white/40">
            <button type="button" className="inline-flex items-center gap-1" onClick={() => onMfy(v)}><MonitorPlay size={11} /> Player</button>
            <button type="button" className="inline-flex items-center gap-1" onClick={() => onExt(v)}><ExternalLink size={11} /> YouTube</button>
          </div>
        </div>
      ))}
    </div>
  )
}
