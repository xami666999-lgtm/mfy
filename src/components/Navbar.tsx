import { Home, Compass, Search, Bookmark, Settings, UserCircle, BookOpen } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const tabs = [
  { id: 'home', label: 'Board', icon: Home },
  { id: 'discover', label: 'Discover', icon: Compass },
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
      <button className="profile-button" type="button" onClick={() => setCurrentPage('settings')} aria-label="Profile">
        <img src="./icon.png" alt="" />
        <UserCircle className="profile-fallback" />
      </button>
    </header>
  )
}
