import { useState } from 'react'
import { useStore } from '../store'
import { streamingServices } from '../api/streaming'
import BugReport from './BugReport'

const LINKS: [string, string][] = [
  ['home', 'Home'],
  ['movies', 'Movies'],
  ['tv', 'TV'],
  ['anime', 'Anime'],
  ['manga', 'Manga'],
  ['comics', 'Comics'],
  ['books', 'Books'],
  ['youtube', 'YouTube'],
  ['music', 'Music'],
  ['sports', 'Sport'],
  ['iptv', 'IPTV'],
  ['library', 'Library'],
  ['settings', 'Settings'],
]

export default function AppleRail() {
  const { currentPage, setCurrentPage, setSelectedProviderId } = useStore()
  const [open, setOpen] = useState(true)
  const [q, setQ] = useState('')
  const [bug, setBug] = useState(false)
  return (
    <aside className={`flex flex-col gap-1 p-3 bg-black/65 backdrop-blur-2xl border-r border-white/10 overflow-y-auto ${open ? 'w-64' : 'w-16'}`}>
      <button type="button" className="text-left px-2 py-2 text-[#FF1493] text-xs font-bold" onClick={() => setOpen((v) => !v)}>
        {open ? 'MFY ▸' : 'MFY'}
      </button>
      {open && (
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { try { sessionStorage.setItem('mfy-q', q.trim()) } catch {} ; setCurrentPage('search') } }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-full h-9 mb-2 rounded-xl bg-white/10 px-3 text-sm" />
        </form>
      )}
      {LINKS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`text-left h-9 px-3 rounded-xl text-sm ${currentPage === id ? 'bg-white text-black font-semibold' : 'text-white/75 hover:bg-white/10'}`}
          onClick={() => setCurrentPage(id as any)}
        >
          {open ? label : label[0]}
        </button>
      ))}
      {open && <p className="text-[10px] text-white/30 px-3 pt-3">Channels</p>}
      {streamingServices.map((s) => (
        <button key={s.id} type="button" className="flex items-center gap-2 h-9 px-3 rounded-lg text-white/70 text-xs hover:bg-white/10" onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
          <img src={s.logo} alt="" className="w-5 h-5 object-contain" />
          {open ? s.name : ''}
        </button>
      ))}
      <button type="button" className="mt-auto text-[11px] text-[#FF1493] px-3 py-2" onClick={() => setBug(true)}>Bug</button>
      {bug && <BugReport onClose={() => setBug(false)} />}
    </aside>
  )
}
