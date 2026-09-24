import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useStore, applyTheme } from './store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY, isTmdbKeyValid, tmdb } from './api/tmdb'
import { setRuntimeMdblistKey } from './api/mdblist'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import TitleBar from './components/TitleBar'
import Navbar from './components/Navbar'
import AppleRail from './components/AppleRail'
import Board from './pages/Board'
import NuvioHome from './pages/NuvioHome'
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
import People from './pages/People'
import IdleWall from './components/IdleWall'
import IntroSkip from './components/IntroSkip'
import CalendarPage from './pages/CalendarPage'
import DetailExtras from './components/DetailExtras'
import EpisodePanel from './components/EpisodePanel'
import { youtubeEmbedUrl } from './api/youtubio'

void Board
void Navbar
void tmdb

export default function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [updateInfo, setUpdateInfo] = useState<{ version?: string } | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const {
    currentPage,
    selectedMedia,
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

  useEffect(() => {
    const { init } = useStore.getState()
    init()
  }, [])

  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onWindowShown) return
    return api.onWindowShown(() => {
      setShowIntro(true)
    })
  }, [])

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
    api.get('watchlist').then((list: any) => { if (Array.isArray(list) ) setWatchlist(list) })
    api.get('watchHistory').then((list: any) => { if (Array.isArray(list)) setWatchHistory(list) })
    api.loadProgress?.().then((disk: any[]) => { if (Array.isArray(disk) && disk.length) setWatchHistory(disk) }).catch(() => {})
    api.onFlushProgress?.(() => {
      try {
        const rows = useStore.getState().watchHistory
        api.saveProgressAll?.(rows)
      } catch {}
    })
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
      if (Array.isArray(list)) useStore.setState({ favorites: list })
    })
  }, [])

  if (showIntro) return <Intro onDone={() => setShowIntro(false)} />
  if (!isSetupComplete) return <Wizard />
  if (!authenticated) return <LoginGate />

  const ytId = (selectedMedia as any)?.youtubeId || ((selectedMedia as any)?.type === 'youtube' ? selectedMedia?.id : '')

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] font-sans">
      <RemoteHelp />
      <IdleWall />
      <IntroSkip />
      <EpisodePanel />
      {updateInfo && !updateDismissed && currentPage !== 'player' && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#14101a] border border-white/15 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <div className="text-xs text-white/80">
            Update {updateInfo.version ? `v${updateInfo.version} ` : ''}downloaded
          </div>
          <button
            onClick={() => (window as any).electronAPI?.installUpdate?.()}
            className="h-7 px-3 rounded-lg bg-white text-black text-[11px] font-semibold hover:brightness-110 transition-all"
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
      <TitleBar />
      <div className="flex-1 min-h-0 relative" style={{ paddingTop: 36 }}>
      {currentPage !== 'player' && currentPage !== 'detail' && <AppleRail />}
      <main className="absolute inset-0 overflow-y-auto overflow-x-hidden">
        {currentPage === 'home' && <NuvioHome />}
        {currentPage === 'discover' && <Discover />}
        {currentPage === 'search' && <Search />}
        {currentPage === 'search-results' && <SearchResults />}
        {currentPage === 'library' && <Library />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'detail' && (
          <>
            <MetaDetails />
            <DetailExtras
              title={String((selectedMedia as any)?.title || (selectedMedia as any)?.name || '')}
              type={selectedMedia?.type}
              item={selectedMedia}
              releaseDate={(selectedMedia as any)?.release_date || (selectedMedia as any)?.first_air_date}
            />
          </>
        )}
        {currentPage === 'player' && (ytId ? (
          <div className="h-full bg-black flex flex-col">
            <iframe title="yt" src={youtubeEmbedUrl(String(ytId))} className="flex-1 w-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen />
          </div>
        ) : (
          <PlayerPage />
        ))}
        {currentPage === 'guide' && <Guide />}
        {currentPage === 'provider' && <ProviderBrowse />}
        {currentPage === 'franchise' && <Franchise />}
        {currentPage === 'movies' && <Movies />}
        {currentPage === 'tv' && <TvShows />}
        {currentPage === 'anime' && <Anime />}
        {currentPage === 'sports' && <Sports />}
        {currentPage === 'iptv' && <Iptv />}
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'manga' && <PrintHome kind="manga" />}
        {currentPage === 'comics' && <PrintHome kind="comics" />}
        {currentPage === 'manga-detail' && <MangaReader />}
        {currentPage === 'books' && <CatalogSection kind="books" title="Books" />}
        {currentPage === 'youtube' && <YouTubePage />}
        {currentPage === 'music' && <MusicPage />}
        {currentPage === 'people' && <People />}
      </main>
      </div>
    </div>
  )
}
