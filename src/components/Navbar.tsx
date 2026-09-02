import { useState } from 'react'
import { Home, Film, Tv, Trophy, Search, Bookmark, Settings, BookOpen, Sparkles, Radio, Youtube, Music, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const main = [
  { id: 'home', label: 'Board', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'manga', label: 'Manga', icon: BookOpen },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'My List', icon: Bookmark },
]

const more = [
  { id: 'comics', label: 'Comics', icon: BookOpen },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'iptv', label: 'IPTV', icon: Radio },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { currentPage, setCurrentPage } = useStore()
  const [open, setOpen] = useState(false)
  const moreActive = more.some((t) => t.id === currentPage)

  return (
    <header className="mfy-navbar select-none">
      <button onClick={() => setCurrentPage('home')} className="brand" aria-label="MFY Board" type="button">
        <img src="./icon.png" alt="MFY" />
        <span>MFY</span>
        <span className="text-[10px] text-[#FF1493] font-bold ml-1">1.2.59</span>
      </button>

      <nav className="nav-tabs">
        {main.map((tab) => {
          const Icon = tab.icon
          const isActive = currentPage === tab.id || (tab.id === 'search' && currentPage === 'search-results') || (tab.id === 'home' && currentPage === 'provider')
          return (
            <button key={tab.id} type="button" onClick={() => setCurrentPage(tab.id as any)} className={cn('nav-tab', isActive && 'active')}>
              <Icon />
              <span>{tab.label}</span>
            </button>
          )
        })}
        <div className="relative h-full">
          <button type="button" className={cn('nav-tab', moreActive && 'active')} onClick={() => setOpen((v) => !v)}>
            <ChevronDown />
            <span>More</span>
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#0c0b12] py-1 z-[80]">
              {more.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5', currentPage === tab.id ? 'text-[#FF1493]' : 'text-white/70')}
                    onClick={() => { setCurrentPage(tab.id as any); setOpen(false) }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </nav>
      <div className="navbar-spacer" />
    </header>
  )
}
