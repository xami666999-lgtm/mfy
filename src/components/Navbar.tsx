import { Home, Film, Tv, Trophy, Search, Bookmark, Settings, BookOpen, Sparkles, Radio, Youtube, Music } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import BugReport from './BugReport'
import { cn } from '../lib/utils'

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'My Box', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { currentPage, setCurrentPage } = useStore()
  const [bug, setBug] = useState(false)
  return (
    <header className="mfy-navbar select-none">
      <button onClick={() => setCurrentPage('home')} className="brand" aria-label="MFY Board" type="button">
        <img src="./icon.png" alt="MFY" />
        <span>MFY</span>
        <span className="text-[10px] text-[#e50914] font-bold ml-1">1.6.11</span>
      </button>
      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentPage === tab.id || (tab.id === 'search' && currentPage === 'search-results')
          return (
            <button key={tab.id} type="button" onClick={() => setCurrentPage(tab.id as any)} className={cn('nav-tab', isActive && 'active')}>
              <Icon />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="navbar-spacer" />
      <button type="button" className="nav-tab" onClick={() => setBug(true)} title="Report a bug">
        <span className="text-[11px] text-[#e50914] font-bold">Bug</span>
      </button>
      {bug && <BugReport onClose={() => setBug(false)} />}
    </header>
  )
}
