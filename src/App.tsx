import { lazy, Suspense, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useStore, applyTheme } from './store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY, isTmdbKeyValid } from './api/tmdb'
import { setRuntimeMdblistKey } from './api/mdblist'
import { useKeyboardNav } from './hooks/useKeyboardNav'
import TitleBar from './components/TitleBar'
import Navbar from './components/Navbar'
import PhoneTabBar from './components/PhoneTabBar'
import NuvioHome from './pages/NuvioHome'
const Discover = lazy(() => import('./pages/Discover'))
const Search = lazy(() => import('./pages/Search'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Library = lazy(() => import('./pages/Library'))
const Settings = lazy(() => import('./pages/Settings'))
const MetaDetails = lazy(() => import('./pages/MetaDetails'))
const PlayerPage = lazy(() => import('./pages/PlayerPage'))
import Wizard from './pages/Wizard'
import Intro from './components/Intro'
const Movies = lazy(() => import('./pages/Movies'))
const TvShows = lazy(() => import('./pages/TvShows'))
const Anime = lazy(() => import('./pages/Anime'))
const Sports = lazy(() => import('./pages/Sports'))
import LoginGate from './components/LoginGate'
import IdleWall from './components/IdleWall'
import CalendarPage from './pages/CalendarPage'
const ShelfBrowse = lazy(() => import('./pages/ShelfBrowse'))
const Guide = lazy(() => import('./pages/Guide'))
const ProviderBrowse = lazy(() => import('./pages/ProviderBrowse'))
const Franchise = lazy(() => import('./pages/Franchise'))
const People = lazy(() => import('./pages/People'))
import DetailExtras from './components/DetailExtras'
import EpisodePanel from './components/EpisodePanel'
import { youtubeEmbedUrl } from './api/youtubio'
import { consumeTrackerReturn } from './lib/trackerLogin'
import { pullProgress } from './lib/githubProgress'
import { importAnilistPublic } from './lib/importLists'
import { importStremioLibrary, savedStremioKey } from './lib/stremioLibrary'
import { isPhoneShell } from './lib/device'
import { useSeriesTotals } from './lib/watchProgress'

export default function App() {
  useEffect(() => { consumeTrackerReturn().catch(() => {}) }, [])
  const [showIntro, setShowIntro] = useState(true)
  const [updateInfo, setUpdateInfo] = useState<{ version?: string } | null>(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const phone = isPhoneShell()
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  const {
    currentPage,
    setCurrentPage,
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
    watchHistory,
  } = useStore()

  useSeriesTotals(watchHistory)

  useKeyboardNav()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const { init } = useStore.getState()
    init()
    void pullProgress().then((rows) => {
      if (Array.isArray(rows) && rows.length) useStore.getState().setWatchHistory(rows)
    }).catch(() => {})
    let anilist = ''
    try { anilist = localStorage.getItem('mfy-anilist-keep') || localStorage.getItem('mfy-anilist-username') || '' } catch {}
    if (anilist) {
      try { localStorage.setItem('mfy-anilist-keep', anilist) } catch {}
      void importAnilistPublic(anilist).catch(() => {})
    }
    if (savedStremioKey()) void importStremioLibrary().catch(() => {})
  }, [])

  useEffect(() => {
    document.documentElement.dataset.rail = '0'
    if (typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)) {
      document.documentElement.classList.add('mfy-electron')
    }
  }, [])

  useEffect(() => {
    if (phone) document.documentElement.classList.add('mfy-phone')
    else document.documentElement.classList.remove('mfy-phone')
  }, [phone])

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
      let loaded: any[] = Array.isArray(list) ? list : []
      try {
        const raw = localStorage.getItem('mfy-profiles')
        if (raw) {
          const local = JSON.parse(raw)
          if (Array.isArray(local)) loaded = local
        }
      } catch {}
      if (!loaded.length) {
        setProfiles([])
        api.set?.('profiles', [])
        return
      }
      setProfiles(loaded)
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

  useEffect(() => {
    if (currentPage === 'iptv' || currentPage === 'manga' || currentPage === 'comics' || currentPage === 'books' || currentPage === 'manga-detail' || currentPage === 'youtube' || currentPage === 'music') {
      setCurrentPage('home')
    }
  }, [currentPage, setCurrentPage])

  if (showIntro) return <Intro onDone={() => setShowIntro(false)} />
  if (!isSetupComplete) return <Wizard />
  if (!authenticated) return <LoginGate />

  const electron = typeof navigator !== 'undefined' && /Electron/i.test(navigator.userAgent)
  const ytId = (selectedMedia as any)?.youtubeId || ((selectedMedia as any)?.type === 'youtube' ? selectedMedia?.id : '')

  return (
    <div className="h-screen flex flex-col bg-[#07111c] font-sans">
      {!online && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-full bg-white text-black text-xs font-semibold">
          You're offline. Your library still opens. Playback needs a connection.
        </div>
      )}
      <IdleWall />
      {currentPage === 'player' && <EpisodePanel />}
      {updateInfo && !updateDismissed && currentPage !== 'player' && !phone && (
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
      {electron && !phone && <TitleBar />}
      {currentPage !== 'player' && currentPage !== 'music' && !phone && <Navbar />}
      {phone && currentPage !== 'player' && currentPage !== 'music' && <PhoneTabBar />}
      <div className="flex-1 min-h-0 relative mfy-phone-main">
      <main className="h-full overflow-y-auto overflow-x-hidden">
        <Suspense fallback={null}>
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
        {currentPage === 'calendar' && <CalendarPage />}
        {currentPage === 'shelf' && <ShelfBrowse />}
        {currentPage === 'people' && <People />}
        </Suspense>
      </main>
      </div>
    </div>
  )
}
