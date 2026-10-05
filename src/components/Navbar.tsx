import { useEffect, useState, type FormEvent } from 'react'
import { Home, Film, Tv, Sparkles, Music, CalendarDays, Trophy, Bookmark, Search, Settings } from 'lucide-react'
import { useStore } from '../store'
import InstallButton from './InstallButton'
import { cn } from '../lib/utils'
import { tmdb, POSTER_URL } from '../api/tmdb'

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'movies', label: 'Movies', icon: Film },
  { id: 'tv', label: 'TV Shows', icon: Tv },
  { id: 'anime', label: 'Anime', icon: Sparkles },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'library', label: 'Library', icon: Bookmark },
]

export default function Navbar() {
  const { currentPage, setCurrentPage, currentProfile, setAuthenticated, setSelectedMedia, setSearchQuery } = useStore()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<any[]>([])

  useEffect(() => {
    const query = q.trim()
    if (query.length < 2) { setHits([]); return }
    const t = window.setTimeout(() => {
      tmdb.searchMulti(query).then((d) => {
        setHits((d?.results || []).filter((r: any) => (r.media_type === 'movie' || r.media_type === 'tv') && (r.poster_path || r.title || r.name)).slice(0, 6))
      }).catch(() => setHits([]))
    }, 180)
    return () => window.clearTimeout(t)
  }, [q])

  function openHit(item: any) {
    setSelectedMedia({ ...item, type: item.media_type === 'movie' ? 'movie' : 'tv' })
    setCurrentPage('detail')
    setQ('')
    setHits([])
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    setSearchQuery(q.trim())
    try { sessionStorage.setItem('mfy-q', q.trim()) } catch {}
    setCurrentPage('search')
    setHits([])
  }

  return (
    <header className="mfy-navbar select-none">
      <button onClick={() => setCurrentPage('home')} className="brand" aria-label="MFY" type="button">
        <img src="./logo-mark.png" alt="MFY" />
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
      <InstallButton />
      <form className="nav-search" onSubmit={submit} style={{ position: 'relative' }}>
        <Search size={14} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" />
        {hits.length > 0 && (
          <div className="nav-hits">
            {hits.map((item) => (
              <button key={`${item.media_type}-${item.id}`} type="button" onClick={() => openHit(item)}>
                {item.poster_path ? <img src={`${POSTER_URL}${item.poster_path}`} alt="" /> : <i />}
                <span>{item.title || item.name}</span>
              </button>
            ))}
          </div>
        )}
      </form>
      <button type="button" className={cn('nav-tab', currentPage === 'settings' && 'active')} onClick={() => setCurrentPage('settings')} title="Settings">
        <Settings />
        <span>Settings</span>
      </button>
      <button type="button" className="nav-who" onClick={() => setAuthenticated(false)} title="Switch profile">
        {currentProfile?.avatar ? <img src={currentProfile.avatar} alt="" /> : <b>{(currentProfile?.name || 'M')[0]}</b>}
      </button>
      </div>
    </header>
  )
}
