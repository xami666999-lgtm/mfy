import { useState } from 'react'
import { Home, Film, Tv, Sparkles, LayoutGrid, Trophy, Bookmark, Settings, CalendarDays, Search, Music } from 'lucide-react'
import { useStore } from '../store'

const TABS: [string, string, any][] = [
  ['home', 'Home', Home],
  ['movies', 'Movies', Film],
  ['tv', 'Shows', Tv],
  ['anime', 'Anime', Sparkles],
]

const MORE: [string, string, any][] = [
  ['search', 'Search', Search],
  ['music', 'Music', Music],
  ['calendar', 'Calendar', CalendarDays],
  ['sports', 'Sport', Trophy],
  ['library', 'Library', Bookmark],
  ['settings', 'Settings', Settings],
]

export default function PhoneTabBar() {
  const { currentPage, setCurrentPage, setAuthenticated, currentProfile } = useStore()
  const [more, setMore] = useState(false)
  const onTab = TABS.some(([id]) => id === currentPage)

  return (
    <>
      {more && (
        <div className="mfy-more" onClick={() => setMore(false)}>
          <div className="mfy-more-sheet" onClick={(e) => e.stopPropagation()}>
            <p>More</p>
            <button type="button" className="mfy-switch" onClick={() => { setAuthenticated(false); setMore(false) }}>
              Switch profile{currentProfile?.name ? ` · ${currentProfile.name}` : ''}
            </button>
            <div className="mfy-more-grid">
              {MORE.map(([id, label, Icon]) => (
                <button key={id} type="button" onClick={() => { setCurrentPage(id as any); setMore(false) }}>
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="mfy-tabbar">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} type="button" className={currentPage === id ? 'on' : ''} onClick={() => setCurrentPage(id as any)}>
            <Icon size={20} />
            {label}
          </button>
        ))}
        <button type="button" className={!onTab || more ? 'on' : ''} onClick={() => setMore((v) => !v)}>
          <LayoutGrid size={20} />
          More
        </button>
      </nav>
    </>
  )
}
