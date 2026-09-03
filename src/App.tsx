import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useStore, applyTheme } from './store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY, isTmdbKeyValid, tmdb } from './api/tmdb'
import { setRuntimeMdblistKey } from './api/mdblist'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import TitleBar from './components/TitleBar'
import Navbar from './components/Navbar'
import Board from './pages/Board'
import Discover from './pages/Discover'
import Search from './pages/Search'
import SearchResults from './pages/SearchResults'
import Library from './pages/Library'
import Settings from './pages/Settings'
import MetaDetails from './pages/MetaDetails'
import PlayerPage from './pages/PlayerPage'
import Wizard from './pages/Wizard'
import Guide from './pages/Guide'
import ProviderBrowse from './pages/ProviderBrowse'
import Franchise from './pages/Franchise'
import Intro from './components/Intro'
import Movies from './pages/Movies'
import TvShows from './pages/TvShows'
import Anime from './pages/Anime'
import Sports from './pages/Sports'
import Iptv from './pages/Iptv'
import LoginGate from './components/LoginGate'
import RemoteHelp from './components/RemoteHelp'
import CatalogSection from './pages/CatalogSection'
import YouTubePage from './pages/YouTubePage'
import MusicPage from './pages/MusicPage'
import PrintHome from './pages/PrintHome'
import MangaReader from './pages/MangaReader'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [updateInfo, setUpdateInfo] = useState<{ version?: string } | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const {
    currentPage,
    isSetupComplete,
    authenticated,
    setSetupComplete,
    setTmdbApiKey,
    setTraktToken,
    setRealDebridKey,
    setAiostreamsUrl,
    setJellyfinUrl,
    setJellyfinApiKey,
    setWatchlist,
    setWatchHistory,
    setProfiles,
    setCurrentProfile,
    setTheme,
    setOmdbApiKey,
    setMdblistApiKey,
setExternalPlayer,
    setLocalFolders,
    theme,
  } = useStore()

  useKeyboardNav()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Initialize store from persisted storage
  useEffect(() => {
    const { init } = useStore.getState()
    init()
  }, [])

  // Replay the intro splash whenever the window is shown (first launch + re-open from tray)
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onWindowShown) return
    return api.onWindowShown(() => {
      setShowIntro(true)
    })
  }, [])

  // Surface a downloaded update inside the app (after login)
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onUpdateDownloaded) return
    return api.onUpdateDownloaded((info: any) => {
      setUpdateInfo(info || {})
      setUpdateDismissed(false)
    })
  }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api) return

api.isSetupComplete().then((complete: boolean) => setSetupComplete(complete))

    // A TMDB key is always available (baked default + optional user override), so
    // the onboarding wizard only ever shows on a truly fresh install. Once loaded,
    // mark setup as complete so the recurring "Welcome to MFY" wizard no longer
    // reappears on every app re-open. A stale user-stored key is validated and
    // replaced with the baked default so the catalog can never render empty.
    api.get('tmdbApiKey').then(async (k: string) => {
      const stored = (k && typeof k === 'string' && k.trim()) || ''
      let key = stored || DEFAULT_TMDB_API_KEY
      if (stored && !(await isTmdbKeyValid(stored))) {
        key = DEFAULT_TMDB_API_KEY
        api.set('tmdbApiKey', DEFAULT_TMDB_API_KEY)
      }
      setTmdbApiKey(key)
      setRuntimeTmdbKey(key)
      setSetupComplete(true)
    })
    api.get('omdbApiKey').then((k: string) => { if (k) setOmdbApiKey(k) })
    api.get('mdblistApiKey').then((k: string) => {
      if (k) {
        setMdblistApiKey(k)
        setRuntimeMdblistKey(k)
      }
    })
    api.get('traktToken').then((t: string) => { if (t) setTraktToken(t) })
    api.get('realDebridKey').then((k: string) => { if (k) setRealDebridKey(k) })
    api.get('aiostreamsUrl').then((u: string) => { if (u) setAiostreamsUrl(u) })
    api.get('jellyfinUrl').then((u: string) => { if (u) setJellyfinUrl(u) })
    api.get('jellyfinApiKey').then((k: string) => { if (k) setJellyfinApiKey(k) })
    api.get('watchlist').then((list: any) => { if (Array.isArray(list)) setWatchlist(list) })
    api.get('watchHistory').then((list: any) => { if (Array.isArray(list)) setWatchHistory(list) })
    api.get('profiles').then(async (list: any) => {
      const loaded: any[] = Array.isArray(list) ? list : []
      if (loaded.length) setProfiles(loaded)
      const id = await api.get('currentProfileId')
      if (id) {
        const p = loaded.find((x) => x.id === id)
        if (p) setCurrentProfile(p)
      }
    })
    api.get('theme').then((t: any) => { if (t) setTheme(t) })
    api.get('externalPlayer').then((p: string) => { if (p) setExternalPlayer(p) })
    api.get('localFolders').then((f: any) => { if (Array.isArray(f)) setLocalFolders(f) })
    api.get('favorites').then((list: any) => {
      if (Array.isArray(list)) {
        // hydrate favorites without going through add one-by-one
        useStore.setState({ favorites: list })
      }
    })

    // New release notifications: check watchlist/favorites once per launch for
    // new seasons/episodes and surface OS notifications (throttled to once/day).
    setTimeout(() => {
      checkReleases().catch(() => {})
    }, 12000)
  }, [])

  // Track whether intro has been shown — only show once per install.
  const [introSeen, setIntroSeen] = useState(() => {
    const v = localStorage.getItem('mfy-intro-seen')
    return v ? JSON.parse(v) : false
  })

  // On first launch, show legacy "Welcome to MFY" branding briefly, then never show intro again.
  useEffect(() => {
    if (!introSeen) {
      setTimeout(() => setIntroSeen(true), 2000)
    }
  }, [introSeen])

  // For each TV title in the watchlist/favorites, check if a new season was
  // released since the last notification (stored per-title). Uses the in-app
  // banner path so results show whether or not a key is set.
  async function checkReleases() {
    const api = (window as any).electronAPI
    const { watchlist, favorites, tmdbApiKey } = useStore.getState()
    const titles = [...watchlist, ...favorites].filter((t: any) => t.mediaType === 'tv')
    const unique = Array.from(new Map(titles.map((t: any) => [`${t.mediaType}-${t.mediaId}`, t])).values()).slice(0, 10)
    if (!unique.length) return
    let lastNotified: Record<string, string> = {}
    try { lastNotified = JSON.parse(localStorage.getItem('mfy-release-notified') || '{}') } catch {}
    const notifications: { title: string; body: string }[] = []
    for (const t of unique) {
      try {
        const key = `tv-${t.mediaId}`
        const d = await tmdb.getTVDetail(t.mediaId)
        const seasons = (d?.seasons || []).filter((s: any) => s.season_number > 0)
        if (!seasons.length) continue
        const latest = seasons.sort((a: any, b: any) => (b.season_number || 0) - (a.season_number || 0))[0]
        if (!latest?.air_date) continue
        const last = lastNotified[key] || ''
        if (last === latest.air_date) continue
        lastNotified[key] = latest.air_date
        notifications.push({
          title: d.name || t.title,
          body: `New season ${latest.season_number} is out (${latest.air_date})`,
        })
      } catch {}
    }
    if (notifications.length) {
      try { localStorage.setItem('mfy-release-notified', JSON.stringify(lastNotified)) } catch {}
      if (api?.showNotification) {
        for (const n of notifications.slice(0, 3)) api.showNotification(n.title, n.body)
      }
    }
  }

  if (!isSetupComplete) return <Wizard />

  if (!authenticated) return <LoginGate />

  return (
    <div className="h-screen flex flex-col bg-[#08080e]">
      <RemoteHelp />
      {false && !introSeen && <Intro onDone={() => { setShowIntro(false); setIntroSeen(true) }} />}
      {updateInfo && !updateDismissed && currentPage !== 'player' && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#14101a] border border-[#FF1493]/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="w-2 h-2 rounded-full bg-[#FF1493] animate-pulse" />
          <div className="text-xs text-white/80">
            Update {updateInfo.version ? `v${updateInfo.version} ` : ''}downloaded
          </div>
          <button
            onClick={() => (window as any).electronAPI?.installUpdate?.()}
            className="h-7 px-3 rounded-lg bg-[#FF1493] text-white text-[11px] font-semibold hover:brightness-110 transition-all"
          >
            Restart & install
          </button>
          <button
            onClick={() => setUpdateDismissed(true)}
            className="w-6 h-6 grid place-items-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {currentPage !== 'player' && (
        <>
          <TitleBar />
          {currentPage !== 'home' && <Navbar />}
        </>
      )}
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {currentPage === 'home' && <Board />}
        {currentPage === 'discover' && <Discover />}
        {currentPage === 'search' && <Search />}
        {currentPage === 'search-results' && <SearchResults />}
        {currentPage === 'library' && <Library />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'detail' && <MetaDetails />}
        {currentPage === 'player' && <PlayerPage />}
        {currentPage === 'guide' && <Guide />}
        {currentPage === 'provider' && <ProviderBrowse />}
        {currentPage === 'franchise' && <Franchise />}
        {currentPage === 'movies' && <Movies />}
        {currentPage === 'tv' && <TvShows />}
        {currentPage === 'anime' && <Anime />}
        {currentPage === 'sports' && <Sports />}
        {currentPage === 'iptv' && <Iptv />}
        {currentPage === 'manga' && <PrintHome kind="manga" />}
        {currentPage === 'comics' && <PrintHome kind="comics" />}
        {currentPage === 'manga-detail' && <MangaReader />}
        {currentPage === 'books' && <CatalogSection kind="books" title="Books" />}
        {currentPage === 'youtube' && <YouTubePage />}
        {currentPage === 'music' && <MusicPage />}
      </main>
    </div>
  )
}
