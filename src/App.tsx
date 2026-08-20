import { useEffect, useState } from 'react'
import { useStore, applyTheme } from './store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY, isTmdbKeyValid } from './api/tmdb'
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

export default function App() {
  const [showIntro, setShowIntro] = useState(true)
  const {
    currentPage,
    isSetupComplete,
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

  // Replay the intro splash whenever the window is shown (first launch + re-open from tray)
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onWindowShown) return
    return api.onWindowShown(() => {
      setShowIntro(true)
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
    api.get('profiles').then((list: any) => { if (Array.isArray(list)) setProfiles(list) })
    api.get('currentProfileId').then((id: string) => {
      if (id) {
        const profiles = useStore.getState().profiles
        const p = profiles.find((x) => x.id === id)
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
  }, [])

  if (!isSetupComplete) return <Wizard />

  return (
    <div className="h-screen flex flex-col bg-[#08080e]">
      {showIntro && <Intro onDone={() => setShowIntro(false)} />}
      {currentPage !== 'player' && (
        <>
          <TitleBar />
          <Navbar />
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
      </main>
    </div>
  )
}
