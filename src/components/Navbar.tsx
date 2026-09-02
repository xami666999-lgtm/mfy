import { Home, Film, Tv, Trophy, Search, Bookmark, Settings, BookOpen, Sparkles, Radio, Youtube, Music } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const tabs = [
  { id: 'home', label: 'Board', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'manga', label: 'Manga', icon: BookOpen },
  { id: 'comics', label: 'Comics', icon: BookOpen },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'iptv', label: 'IPTV', icon: Radio },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'My List', icon: Bookmark },
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Navbar() {
  const { currentPage, setCurrentPage } = useStore()

  return (
    <header className="mfy-navbar select-none">
      <button onClick={() => setCurrentPage('home')} className="brand" aria-label="MFY Board" type="button">
        <img src="./icon.png" alt="MFY" />
        <span>MFY</span>
        <span className="text-[10px] text-[#FF1493] font-bold ml-1">1.2.49</span>
      </button>

      <nav className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive =
            currentPage === tab.id ||
            (tab.id === 'search' && currentPage === 'search-results') ||
            (tab.id === 'home' && currentPage === 'provider')
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCurrentPage(tab.id as any)}
              className={cn('nav-tab', isActive && 'active')}
            >
              <Icon />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="navbar-spacer" />
    </header>
  )
}
