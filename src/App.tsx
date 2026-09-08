import * as React from 'react'
import { useEffect } from 'react'
import { useStore } from './store'
import { databaseService } from './services/database'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/sidebar/Sidebar'
import { SearchBar } from './components/search/SearchBar'
import Home from './pages/Home'
import Games from './pages/Games'
import Systems from './pages/Systems'
import Emulators from './pages/Emulators'
import Themes from './pages/Themes'
import Downloads from './pages/Downloads'
import Saves from './pages/Saves'
import Controllers from './pages/Controllers'
import Settings from './pages/Settings'
import GameDetail from './pages/GameDetail'
import { cn } from './components/ui/Button'

const PAGES = {
  home: Home,
  games: Games,
  systems: Systems,
  emulators: Emulators,
  themes: Themes,
  downloads: Downloads,
  saves: Saves,
  controllers: Controllers,
  settings: Settings,
  'game-detail': GameDetail,
} as const

type PageKey = keyof typeof PAGES

export default function App() {
  const {
    currentPage,
    setCurrentPage,
    sidebarCollapsed,
    searchQuery,
    searchResults,
    setSearchResults,
    theme,
    setTheme,
  } = useStore()

  useEffect(() => {
    // Initialize emulator store from database
    // Note: In full implementation, would call initializeEmulatorStore()
  }, [])

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
    setCurrentPage(page as PageKey)
  }

  return (
    <div className={cn('h-screen flex flex-col bg-mfy-dark-400', theme === 'dark' && 'dark')}>
      <TitleBar />
      
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar onNavigate={handleNavigate} />
        
        <main className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">
            <CurrentPage />
          </div>

          {/* Search results overlay when on home page */}
          {currentPage === 'search' && searchResults.games.length > 0 && (
            <div className="absolute top-0 left-64 right-0 bottom-0 bg-black/40 z-50">
              <SearchResults />
            </div>
          )}

          {/* Quick search bar when on home */}
          {currentPage === 'home' && (
            <SearchBar
              placeholder="Search games, emulators, systems..."
              onSearch={(query) => {
                setSearchQuery(query)
                setCurrentPage('search')
              }}
            />
          )}
        </main>
      </div>

      {currentPage === 'settings' && (
        <SearchBar
          placeholder="Search settings..."
          className="mt-4 mx-6"
        />
      )}
    </div>
  )
}