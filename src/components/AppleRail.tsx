import { useState } from 'react'
import { useStore } from '../store'
import { streamingServices } from '../api/streaming'
import BugReport from './BugReport'
import { Search, Home, Film, Tv, Sparkles, BookOpen, Youtube, Music, Trophy, Radio, Bookmark, Settings } from 'lucide-react'

const LINKS: [string, string, any][] = [
  ['home', 'Home', Home],
  ['movies', 'Movies', Film],
  ['tv', 'TV', Tv],
  ['anime', 'Anime', Sparkles],
  ['manga', 'Manga', BookOpen],
  ['comics', 'Comics', BookOpen],
  ['books', 'Books', BookOpen],
  ['youtube', 'YouTube', Youtube],
  ['music', 'Music', Music],
  ['sports', 'Sport', Trophy],
  ['iptv', 'IPTV', Radio],
  ['library', 'Library', Bookmark],
  ['settings', 'Settings', Settings],
]

export default function AppleRail() {
  const { currentPage, setCurrentPage, setSelectedProviderId, currentProfile } = useStore()
  const [q, setQ] = useState('')
  const [bug, setBug] = useState(false)
  return (
    <aside className="pointer-events-none absolute z-40 left-4 top-4 bottom-4 w-[280px]">
      <div className="pointer-events-auto h-full rounded-[28px] bg-black/55 backdrop-blur-2xl border border-white/10 shadow-2xl p-3 flex flex-col overflow-y-auto">
        <div className="flex items-center gap-2 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-[#FF1493] grid place-items-center text-xs font-black">{(currentProfile?.name || 'M')[0]}</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentProfile?.name || 'MFY'}</p>
            <p className="text-[10px] text-white/35">1.2.87</p>
          </div>
        </div>
        <form className="px-1 mb-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { try { sessionStorage.setItem('mfy-q', q.trim()) } catch {} ; setCurrentPage('search') } }}>
          <div className="flex items-center gap-2 h-9 rounded-full bg-white/10 px-3">
            <Search size={14} className="text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </form>
        {LINKS.map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            className={`flex items-center gap-3 h-10 px-3 rounded-full text-sm mb-0.5 ${currentPage === id ? 'bg-white text-black font-semibold' : 'text-white/80 hover:bg-white/10'}`}
            onClick={() => setCurrentPage(id as any)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <p className="text-[10px] text-white/30 px-3 pt-3 pb-1">Channels</p>
        {streamingServices.map((s) => (
          <button key={s.id} type="button" className="flex items-center gap-2 h-9 px-3 rounded-full text-white/70 text-xs hover:bg-white/10" onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
            <img src={s.logo} alt="" className="w-5 h-5 object-contain" />
            {s.name}
          </button>
        ))}
        <button type="button" className="mt-auto text-[11px] text-[#FF1493] px-3 py-2" onClick={() => setBug(true)}>Bug</button>
        {bug && <BugReport onClose={() => setBug(false)} />}
      </div>
    </aside>
  )
}
