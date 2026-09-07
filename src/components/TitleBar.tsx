import * as React from 'react'
import { Minimize, Maximize2, X, Menu, Music, Sun, Moon, Monitor } from 'lucide-react'
import { useStore } from '@/store'
import { cn, Button } from '@/components/ui/Button'

export const TitleBar: React.FC = () => {
  const { theme, setTheme, sidebarCollapsed, toggleSidebar, miniPlayerOpen, toggleMiniPlayer } = useStore()
  const [isMaximized, setIsMaximized] = React.useState(false)

  React.useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.isMaximized()
      setIsMaximized(maximized)
    }
    checkMaximized()
  }, [])

  const handleMinimize = () => window.electronAPI.minimize()
  const handleMaximize = async () => {
    await window.electronAPI.maximize()
    const maximized = await window.electronAPI.isMaximized()
    setIsMaximized(maximized)
  }
  const handleClose = () => window.electronAPI.close()

  const themeIcons: Record<'dark' | 'light' | 'system', typeof Moon> = {
    dark: Moon,
    light: Sun,
    system: Monitor,
  }
  const ThemeIcon = themeIcons[theme]

  const toggleTheme = () => {
    const themes: ('dark' | 'light' | 'system')[] = ['dark', 'light', 'system']
    const nextTheme = themes[(themes.indexOf(theme) + 1) % 3]
    setTheme(nextTheme)
  }

  return (
    <div className="titlebar no-select" style={{ height: 40 }}>
      <div className="titlebar-drag-region flex items-center gap-3 px-4">
        <Button
          variant="icon"
          size="icon"
          onClick={toggleSidebar}
          className="text-white/60 hover:text-white"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow-glow-pink">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">MFY Music</span>
        </div>
      </div>

      <div className="flex items-center gap-1 pr-2">
        <Button
          variant="icon"
          size="icon"
          onClick={toggleTheme}
          className="text-white/60 hover:text-white"
          aria-label={`Current theme: ${theme}. Click to change.`}
        >
          <ThemeIcon className="w-5 h-5" />
        </Button>

        <Button
          variant="icon"
          size="icon"
          onClick={toggleMiniPlayer}
          className={cn('text-white/60 hover:text-white', miniPlayerOpen && 'text-pink-400')}
          aria-label={miniPlayerOpen ? 'Hide mini player' : 'Show mini player'}
        >
          <Music className="w-5 h-5" />
        </Button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <Button variant="icon" size="icon" onClick={handleMinimize} className="text-white/60 hover:text-white" aria-label="Minimize">
          <Minimize className="w-5 h-5" />
        </Button>
        <Button variant="icon" size="icon" onClick={handleMaximize} className="text-white/60 hover:text-white" aria-label={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? <Maximize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </Button>
        <Button variant="icon" size="icon" onClick={handleClose} className="titlebar-button close text-white/60 hover:text-white" aria-label="Close">
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}