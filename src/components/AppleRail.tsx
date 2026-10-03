import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useStore } from '../store'
import ThemePicker from './ThemePicker'
import ProfileManage from './ProfileManage'

const LINKS: [string, string][] = [
  ['home', 'Home'],
  ['movies', 'Movies'],
  ['tv', 'TV'],
  ['anime', 'Anime'],
  ['library', 'My Box'],
]

export default function AppleRail() {
  const { currentPage, setCurrentPage, currentProfile, setAuthenticated } = useStore()
  const [q, setQ] = useState('')
  const [searchOn, setSearchOn] = useState(false)
  const [menu, setMenu] = useState(false)
  const [manage, setManage] = useState(false)

  function go(id: string) {
    setMenu(false)
    setCurrentPage(id as any)
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    try { sessionStorage.setItem('mfy-q', q.trim()) } catch {}
    setCurrentPage('search')
  }

  return (
    <>
      {currentPage === 'settings' && <ThemePicker />}
      <header className="nf-bar">
        <button type="button" className="nf-logo" onClick={() => go('home')}>MFY</button>
        <nav className="nf-pill">
          {LINKS.map(([id, label]) => (
            <button key={id} type="button" className={currentPage === id ? 'on' : ''} onClick={() => go(id)}>{label}</button>
          ))}
          {searchOn ? (
            <form onSubmit={submitSearch}>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" onBlur={() => { if (!q) setSearchOn(false) }} />
            </form>
          ) : (
            <button type="button" aria-label="Search" onClick={() => setSearchOn(true)}><Search size={16} /></button>
          )}
        </nav>
        <button type="button" className="nf-avatar" onClick={() => setMenu((v) => !v)} aria-label="Profile">
          {currentProfile?.avatar
            ? <img src={currentProfile.avatar} alt="" />
            : <span>{(currentProfile?.name || 'M')[0]}</span>}
        </button>
        {menu && (
          <div className="nf-menu">
            <button type="button" onClick={() => { setMenu(false); setManage(true) }}>Manage profile</button>
            <button type="button" onClick={() => { setMenu(false); setAuthenticated(false) }}>Switch profile</button>
            <button type="button" onClick={() => go('settings')}>Settings</button>
          </div>
        )}
      </header>
      {manage && currentProfile && <ProfileManage id={currentProfile.id} onClose={() => setManage(false)} />}
    </>
  )
}
