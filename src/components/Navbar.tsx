import { useState, type FormEvent } from 'react'
import { Home, Film, Tv, Sparkles, CalendarDays, Trophy, Bookmark, Search, Settings } from 'lucide-react'
import { useStore } from '../store'
import BugReport from './BugReport'
import { cn } from '../lib/utils'

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'library', label: 'Library', icon: Bookmark },
]

export default function Navbar() {
  const { currentPage, setCurrentPage, currentProfile, setAuthenticated } = useStore()
  const [bug, setBug] = useState(false)
  const [q, setQ] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    try { sessionStorage.setItem('mfy-q', q.trim()) } catch {}
    setCurrentPage('search')
  }

  return (
    <header className="mfy-navbar select-none">
      <button onClick={() => setCurrentPage('home')} className="brand" aria-label="MFY" type="button">
        <img src="./icon.png" alt="MFY" />
      </button>
      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const on = currentPage === tab.id
          return (
            <button key={tab.id} type="button" onClick={() => setCurrentPage(tab.id as any)} className={cn('nav-tab', on && 'active')}>
              <Icon />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="nav-tools">
      <form className="nav-search" onSubmit={submit}>
        <Search size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" />
      </form>
      <button type="button" className={cn('nav-tab', currentPage === 'settings' && 'active')} onClick={() => setCurrentPage('settings')} title="Settings">
        <Settings />
        <span>Settings</span>
      </button>
      <button type="button" className="nav-who" onClick={() => setAuthenticated(false)} title="Switch profile">
        {currentProfile?.avatar ? <img src={currentProfile.avatar} alt="" /> : <b>{(currentProfile?.name || 'M')[0]}</b>}
      </button>
      <button type="button" className="nav-bug" onClick={() => setBug(true)}>Bug</button>
      </div>
      {bug && <BugReport onClose={() => setBug(false)} />}
    </header>
  )
}
