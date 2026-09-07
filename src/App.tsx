import * as React from 'react'
import { useEffect } from 'react'
import { useStore } from './store'
import { audioEngine } from './services/audioEngine'
import { databaseService } from './services/database'
import { streamService } from './services/stream'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/sidebar/Sidebar'
import { PlayerBar } from './components/player/PlayerBar'
import { QueueDrawer } from './components/queue/QueueDrawer'
import { LyricsPanel } from './components/lyrics/LyricsPanel'
import { MiniPlayer } from './components/mini-player/MiniPlayer'
import { SearchBar } from './components/search/SearchBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import { SettingsPage as Settings } from './pages/Settings'
import Stats from './pages/Stats'
import { cn } from './components/ui/Button'

const PAGES = {
  home: Home,
  search: Search,
  'search-results': Search,
  library: Library,
  settings: Settings,
  stats: Stats,
} as const

type PageKey = keyof typeof PAGES

export default function App() {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    lyricsPanelOpen,
    queueDrawerOpen,
    miniPlayerOpen,
    theme,
    playbackState,
    initAudioEngine,
  } = useStore()

  const currentTrack = playbackState.currentTrack
  const isPlaying = playbackState.isPlaying

  useEffect(() => {
    initAudioEngine()

    const handleMediaPlayPause = () => audioEngine.togglePlayPause()
    const handleMediaNext = () => audioEngine.playNext()
    const handleMediaPrevious = () => audioEngine.playPrevious()
    const handleMediaStop = () => audioEngine.pause()

    const cleanupPlayPause = window.electronAPI.onMediaPlayPause(handleMediaPlayPause)
    const cleanupNext = window.electronAPI.onMediaNext(handleMediaNext)
    const cleanupPrevious = window.electronAPI.onMediaPrevious(handleMediaPrevious)
    const cleanupStop = window.electronAPI.onMediaStop(handleMediaStop)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      switch (e.key) {
        case ' ':
          e.preventDefault()
          audioEngine.togglePlayPause()
          break
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            audioEngine.playNext()
          }
          break
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            audioEngine.playPrevious()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          audioEngine.setVolume(Math.min(1, playbackState.volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          audioEngine.setVolume(Math.max(0, playbackState.volume - 0.05))
          break
        case 'm':
          audioEngine.toggleMute()
          break
        case 's':
          audioEngine.setShuffle(!playbackState.shuffle)
          break
        case 'r':
          const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all']
          const nextMode = modes[(modes.indexOf(playbackState.repeatMode) + 1) % 3]
          audioEngine.setRepeatMode(nextMode)
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            ;(document.querySelector('input[type="text"]') as HTMLInputElement | null)?.focus()
          }
          break
        case 'l':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            useStore.getState().toggleLyricsPanel()
          }
          break
        case 'q':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            useStore.getState().toggleQueueDrawer()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    document.title = currentTrack ? `${currentTrack.title} - ${currentTrack.artist} - MFY Music` : 'MFY Music'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      cleanupPlayPause()
      cleanupNext()
      cleanupPrevious()
      cleanupStop()
    }
  }, [initAudioEngine, currentTrack, isPlaying, playbackState.volume, playbackState.shuffle, playbackState.repeatMode])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const CurrentPage = PAGES[currentPage as PageKey] || Home

  const handleNavigate = (page: string) => {
    if (page.startsWith('playlist-')) {
      // Handle playlist navigation
      return
    }
    setCurrentPage(page as PageKey)
  }

  return (
    <div className={cn('h-screen flex flex-col bg-mfy-dark-400', theme === 'dark' && 'dark')}>
      <TitleBar />
      
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar onNavigate={handleNavigate} />
        
        <main className="flex-1 flex flex-col min-w-0 relative">
          <div className="flex-1 overflow-y-auto">
            <CurrentPage />
          </div>

          <LyricsPanel />
          <PlayerBar />
        </main>

        <QueueDrawer />
      </div>

      {miniPlayerOpen && (
        <MiniPlayer
          onClose={() => useStore.getState().setMiniPlayerOpen(false)}
          onMaximize={() => {
            useStore.getState().setMiniPlayerOpen(false)
            window.electronAPI.showMiniPlayer()
          }}
        />
      )}
    </div>
  )
}