import { useEffect, useMemo, useRef, useState } from 'react'
import { Home, Compass, Radio, Library, ListMusic, Search, Play, Pause, SkipBack, SkipForward, Volume2, Mic2 } from 'lucide-react'
import { flixCatalog, searchMusic, streamUrl, type Track } from '../api/musicAddons'
import { youtubioSearch } from '../api/youtubio'

type Tab = 'home' | 'browse' | 'radio' | 'library' | 'playlists'

export default function MusicPage() {
  const [tab, setTab] = useState<Tab>('home')
  const [q, setQ] = useState('')
  const [top, setTop] = useState<Track[]>([])
  const [trend, setTrend] = useState<Track[]>([])
  const [hits, setHits] = useState<Track[]>([])
  const [shelves, setShelves] = useState<{ title: string; tracks: Track[] }[]>([])
  const [now, setNow] = useState<Track | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [playing, setPlaying] = useState(false)
  const [focus, setFocus] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur, setDur] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytId = useRef('')

  useEffect(() => {
    flixCatalog('top').then(setTop)
    flixCatalog('trending').then(setTrend)
    const extra = ['pop hits', 'hip hop', 'rnb', 'rock', 'electronic', 'latin', 'afrobeats', 'kpop', 'indie', 'jazz']
    extra.forEach(async (term) => {
      const tracks = await searchMusic(term)
      if (tracks.length) setShelves((prev) => prev.some((s) => s.title === term) ? prev : [...prev, { title: term, tracks }])
    })
  }, [])

  async function play(track: Track, list: Track[] = []) {
    setNow(track)
    setQueue(list.length ? list : [track])
    setPlaying(true)
    const url = await streamUrl(track)
    if (url && audioRef.current) {
      ytId.current = ''
      audioRef.current.src = url
      audioRef.current.play().catch(() => {})
      return
    }
    const yt = await youtubioSearch(`${track.artist} ${track.title} official audio`)
    ytId.current = yt[0]?.id || ''
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
    }
  }

  function toggle() {
    if (!now) return
    if (ytId.current) { setPlaying((p) => !p); return }
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play().catch(() => {}); setPlaying(true) }
    else { a.pause(); setPlaying(false) }
  }

  function skip(dir: 1 | -1) {
    if (!now || !queue.length) return
    const i = queue.findIndex((t) => t.id === now.id)
    const n = queue[i + dir] || queue[dir === 1 ? 0 : queue.length - 1]
    if (n) play(n, queue)
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setTab('browse')
    setHits(await searchMusic(q.trim()))
  }

  const bg = now?.poster || trend[0]?.poster || ''

  return (
    <div className="h-full min-h-[100%] text-white overflow-hidden pl-[300px]" style={{ fontFamily: 'Inter, SF Pro Display, system-ui, sans-serif' }}>
      <div className="flex h-[calc(100vh-96px)]">
        <main className="flex-1 overflow-auto relative">
          <div className="pointer-events-none absolute inset-0" style={{ background: bg ? `radial-gradient(80% 50% at 20% 0%, rgba(255,20,147,.28), transparent 55%), url(${bg}) center/cover` : 'radial-gradient(70% 40% at 10% 0%, rgba(255,20,147,.25), transparent)' }} />
          <div className="pointer-events-none absolute inset-0 backdrop-blur-3xl bg-black/55" />
          <div className="relative p-6 pb-28">
            <div className="relative h-56 rounded-3xl overflow-hidden mb-6 border border-white/10">
              <div className="absolute inset-0 grid grid-cols-8">
                {[...trend, ...top].slice(0, 24).map((t) => (
                  <img key={t.id} src={t.poster} alt="" className="w-full h-full object-cover" />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-6">
                <div className="text-[#FF1493] text-xs font-bold tracking-widest">MFY MUSIC</div>
                <div className="text-3xl font-black tracking-tight">Crunch + Flix</div>
              </div>
            </div>
            <form onSubmit={onSearch} className="flex items-center gap-2 h-11 px-4 rounded-full bg-black/40 border border-white/10 max-w-xl mb-6">
              <Search size={15} className="text-white/40" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Crunch + Flix Music" className="flex-1 bg-transparent outline-none text-sm tracking-tight" />
            </form>
            {tab === 'browse' ? (
              <section>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Search</h2>
                <Grid tracks={hits} onPlay={(t) => play(t, hits)} />
              </section>
            ) : (
              <>
                <Row title="Trending" tracks={trend} onPlay={play} />
                <Row title="Top" tracks={top} onPlay={play} />
                {shelves.map((s) => <Row key={s.title} title={s.title} tracks={s.tracks} onPlay={play} />)}
              </>
            )}
          </div>
        </main>
      </div>

      <div className="fixed left-4 right-4 bottom-3 z-40 h-[72px] rounded-2xl backdrop-blur-xl bg-neutral-900/70 border border-white/10 shadow-2xl flex items-center px-4 gap-4">
        {now ? (
          <>
            <button type="button" onClick={() => setFocus(true)} className="w-12 h-12 rounded-lg overflow-hidden shadow-lg shadow-black/50">
              {now.poster ? <img src={now.poster} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/10" />}
            </button>
            <div className="w-40 min-w-0">
              <div className="text-sm font-semibold truncate tracking-tight">{now.title}</div>
              <div className="text-xs text-white/45 truncate">{now.artist}</div>
            </div>
          </>
        ) : <div className="text-sm text-white/40">Choose a track</div>}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => skip(-1)} className="text-white/70 hover:text-white"><SkipBack size={18} /></button>
            <button type="button" onClick={toggle} className="w-10 h-10 rounded-full bg-white text-black grid place-items-center hover:scale-105 transition-transform">
              {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
            <button type="button" onClick={() => skip(1)} className="text-white/70 hover:text-white"><SkipForward size={18} /></button>
          </div>
          <div className="w-full max-w-md h-1 rounded-full bg-white/15 mt-2 overflow-hidden">
            <div className="h-full bg-[#FF1493]" style={{ width: dur ? `${Math.min(100, (progress / dur) * 100)}%` : playing ? '12%' : '0%' }} />
          </div>
        </div>
        <button type="button" onClick={() => setFocus(true)} className="text-white/50 hover:text-white"><Mic2 size={16} /></button>
        <Volume2 size={16} className="text-white/40" />
      </div>

      <audio ref={audioRef} onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)} onDurationChange={(e) => setDur(e.currentTarget.duration || 0)} onEnded={() => skip(1)} />
      {ytId.current && playing && (
        <iframe title="yt-audio" className="hidden" src={`https://www.youtube-nocookie.com/embed/${ytId.current}?autoplay=1`} allow="autoplay" />
      )}

      {focus && now && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <img src={now.poster} alt="" className="absolute inset-0 w-full h-full object-cover scale-125 brightness-50 blur-3xl" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center gap-16 px-16">
            <img src={now.poster} alt="" className="w-[38vh] h-[38vh] object-cover rounded-2xl shadow-2xl shadow-black" />
            <div className="flex-1 max-w-xl">
              <div className="text-white/50 text-sm mb-2">{now.artist}</div>
              <div className="text-3xl font-bold tracking-tight line-clamp-2 mb-8">{now.title}</div>
              <LyricLines title={now.title} playing={playing} />
              <button type="button" className="mt-10 text-sm text-white/50" onClick={() => setFocus(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ title, tracks, onPlay }: { title: string; tracks: Track[]; onPlay: (t: Track, list: Track[]) => void }) {
  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold tracking-tight mb-3">{title}</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {tracks.map((t) => (
          <button key={t.id} type="button" onClick={() => onPlay(t, tracks)} className="group flex-none w-36 text-left rounded-xl bg-white/5 hover:bg-white/10 p-2 transition-all duration-300">
            <div className="relative">
              <img src={t.poster} alt="" className="w-32 h-32 object-cover rounded-xl shadow-lg shadow-black/50 group-hover:scale-105 transition-transform" />
              <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#FF1493] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={14} /></span>
            </div>
            <p className="text-sm mt-2 truncate tracking-tight">{t.title}</p>
            <p className="text-[11px] text-white/40 truncate">{t.artist}</p>
          </button>
        ))}
      </div>
    </section>
  )
}

function Grid({ tracks, onPlay }: { tracks: Track[]; onPlay: (t: Track, list?: Track[]) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {tracks.map((t) => (
        <button key={t.id} type="button" onClick={() => onPlay(t, tracks)} className="group text-left rounded-xl bg-white/5 hover:bg-white/10 p-2 transition-all">
          <div className="relative">
            <img src={t.poster} alt="" className="w-full aspect-square object-cover rounded-xl shadow-lg shadow-black/50 group-hover:scale-105 transition-transform" />
            <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#FF1493] grid place-items-center opacity-0 group-hover:opacity-100"><Play size={14} /></span>
          </div>
          <p className="text-sm mt-2 truncate">{t.title}</p>
          <p className="text-[11px] text-white/40 truncate">{t.artist}</p>
        </button>
      ))}
    </div>
  )
}

function LyricLines({ title, playing }: { title: string; playing: boolean }) {
  const lines = [title, 'Playing on MFY Music', 'Crunch + Flix catalogs', playing ? 'Now playing' : 'Paused']
  return (
    <div className="space-y-4">
      {lines.map((l, i) => (
        <div key={l} className={`text-3xl font-bold tracking-tight transition-all ${i === (playing ? 1 : 0) ? 'text-white scale-105 opacity-100' : 'text-white/40 opacity-50'}`}>{l}</div>
      ))}
    </div>
  )
}
