import { useEffect, useState } from 'react'
import { useStore, applyTheme } from './store'
import { setRuntimeTmdbKey } from './api/tmdb'
import { setRuntimeOmdbKey } from './api/omdb'
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
import Intro from './components/Intro'
import Movies from './pages/Movies'
import TvShows from './pages/TvShows'
import Sports from './pages/Sports'

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
    setExternalPlayer,
    setLocalFolders,
    setOmdbApiKey,
    theme,
  } = useStore()

  useKeyboardNav()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api) return

    api.isSetupComplete().then((complete: boolean) => setSetupComplete(complete))

    api.get('tmdbApiKey').then((k: string) => {
      if (k) {
        setTmdbApiKey(k)
        setRuntimeTmdbKey(k)
      }
    })
    api.get('traktToken').then((t: string) => { if (t) setTraktToken(t) })
    api.get('realDebridKey').then((k: string) => { if (k) setRealDebridKey(k) })
    api.get('aiostreamsUrl').then((u: string) => { if (u) setAiostreamsUrl(u) })
    api.get('jellyfinUrl').then((u: string) => { if (u) setJellyfinUrl(u) })
    api.get('jellyfinApiKey').then((k: string) => { if (k) setJellyfinApiKey(k) })
    api.get('omdbApiKey').then((k: string) => {
      if (k) {
        setOmdbApiKey(k)
        setRuntimeOmdbKey(k)
      }
    })
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
        {currentPage === 'movies' && <Movies />}
        {currentPage === 'tv' && <TvShows />}
        {currentPage === 'sports' && <Sports />}
      </main>
    </div>
  )
}
