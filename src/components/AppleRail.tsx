import { useEffect, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import BugReport from './BugReport'
import ThemePicker from './ThemePicker'
import { Search, Home, Film, Tv, Sparkles, Youtube, Music, Trophy, Bookmark, Settings, PanelLeftClose, PanelLeft, CalendarDays } from 'lucide-react'

const LINKS: [string, string, any][] = [
  ['home', 'Home', Home],
  ['movies', 'Movies', Film],
  ['tv', 'TV', Tv],
  ['anime', 'Anime', Sparkles],
  ['calendar', 'Calendar', CalendarDays],
  ['youtube', 'YouTube', Youtube],
  ['music', 'Music', Music],
  ['sports', 'Sport', Trophy],
  ['library', 'Library', Bookmark],
  ['settings', 'Settings', Settings],
]

export default function AppleRail() {
  const { currentPage, setCurrentPage, currentProfile, setAuthenticated } = useStore()
  const [q, setQ] = useState('')
  const [bug, setBug] = useState(false)
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('mfy-rail-hidden') === '1' } catch { return false }
  })

  function toggle(next?: boolean) {
    setHidden((prev) => {
      const v = typeof next === 'boolean' ? next : !prev
      try { localStorage.setItem('mfy-rail-hidden', v ? '1' : '0') } catch {}
      return v
    })
  }

  useEffect(() => {
    document.documentElement.dataset.rail = hidden ? '0' : '1'
    return () => { document.documentElement.dataset.rail = '0' }
  }, [hidden])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '[' || (e.key.toLowerCase() === 'b' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    try { sessionStorage.setItem('mfy-q', q.trim()) } catch {}
    setCurrentPage('search')
  }

  const themes = currentPage === 'settings' ? <ThemePicker /> : null

  if (hidden) {
    return (
      <>
        {themes}
        <button type="button" className="rail-show" onClick={() => toggle(false)} title="Show sidebar ([)">
          <PanelLeft size={16} /> Menu
        </button>
      </>
    )
  }

  return (
    <>
      {themes}
      <aside className="apple-rail">
        <div className="apple-rail-in">
          <div className="rail-me">
            <button type="button" className="rail-ava" onClick={() => setAuthenticated(false)} title="Switch profile">
              {currentProfile?.avatar ? <img src={currentProfile.avatar} alt="" /> : <span>{(currentProfile?.name || 'M')[0]}</span>}
            </button>
            <div className="min-w-0 flex-1">
              <p>{currentProfile?.name || 'MFY'}</p>
              <button type="button" className="rail-switch" onClick={() => setAuthenticated(false)}>Switch profile</button>
            </div>
            <button type="button" className="rail-hide" title="Hide sidebar ([)" onClick={() => toggle(true)}>
              <PanelLeftClose size={16} />
            </button>
          </div>
          <form onSubmit={submit}>
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          </form>
          {LINKS.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={currentPage === id ? 'on' : ''}
              onClick={() => setCurrentPage(id as any)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          <button type="button" className="rail-bug" onClick={() => setBug(true)}>Bug</button>
          {bug && <BugReport onClose={() => setBug(false)} />}
        </div>
      </aside>
    </>
  )
}
