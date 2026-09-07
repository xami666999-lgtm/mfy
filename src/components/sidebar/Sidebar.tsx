import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Search,
  Library,
  Heart,
  History,
  ListMusic,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Music,
  Star,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { useStore } from '../../store'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/Button'

interface SidebarProps {
  onNavigate: (page: string) => void
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, badge: null },
  { id: 'search', label: 'Search', icon: Search, badge: null },
  { id: 'trending', label: 'Trending', icon: TrendingUp, badge: 'New' },
  { id: 'library', label: 'Library', icon: Library, badge: null },
  { id: 'liked', label: 'Liked Songs', icon: Heart, badge: null },
  { id: 'playlists', label: 'Playlists', icon: ListMusic, badge: null, isSection: true },
  { id: 'history', label: 'History', icon: History, badge: null },
  { id: 'stats', label: 'Statistics', icon: BarChart3, badge: null },
  { id: 'settings', label: 'Settings', icon: Settings, badge: null },
]

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { currentPage, sidebarCollapsed, toggleSidebar, playlists } = useStore()

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="glass-strong h-full flex flex-col border-r border-white/5 overflow-hidden"
      style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-cyan-500 flex items-center justify-center shadow-glow-pink">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">MFY Music</span>
          </motion.div>
        )}
        <Button
          variant="icon"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            'flex-shrink-0',
            sidebarCollapsed ? 'ml-auto' : 'ml-auto'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1" role="navigation" aria-label="Main navigation">
        <ul className="space-y-0.5" role="list">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id
            const isPlaylistSection = item.id === 'playlists'
            
            if (isPlaylistSection) {
              return (
                <motion.li key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  {!sidebarCollapsed && (
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5" />
                        {item.label}
                      </span>
                      <Button variant="icon" size="icon" className="text-white/30 hover:text-white" aria-label="Create playlist">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <ul className="space-y-0.5 mt-1 ml-2 border-l border-white/5 pl-2" role="list">
                    {playlists.slice(0, 10).map((playlist) => (
                      <motion.li key={playlist.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
                        <button
                          onClick={() => onNavigate(`playlist-${playlist.id}`)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/70',
                            'hover:text-white hover:bg-white/5 active:bg-white/10',
                            'transition-all duration-200',
                            currentPage === `playlist-${playlist.id}` && 'text-white bg-white/10 font-medium',
                            'text-sm'
                          )}
                          aria-current={currentPage === `playlist-${playlist.id}` ? 'page' : undefined}
                        >
                          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                            {playlist.artworkUrl ? (
                              <img src={playlist.artworkUrl} alt="" className="w-full h-full rounded object-cover" />
                            ) : (
                              <ListMusic className="w-4 h-4 text-white/40" />
                            )}
                          </div>
                          {!sidebarCollapsed && (
                            <span className="truncate line-clamp-1">{playlist.name}</span>
                          )}
                        </button>
                      </motion.li>
                    ))}
                    {!sidebarCollapsed && playlists.length > 10 && (
                      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-colors">
                        <span className="w-5 h-5 flex-shrink-0" />
                        View all playlists
                      </button>
                    )}
                  </ul>
                </motion.li>
              )
            }

            return (
              <motion.li key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                    'transition-all duration-200',
                    isActive ? 'text-white bg-white/10 font-medium' : 'text-white/70 hover:text-white hover:bg-white/5',
                    sidebarCollapsed && 'justify-center'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="truncate font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="pink" size="sm" className="ml-auto">{item.badge}</Badge>
                      )}
                    </>
                  )}
                </button>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-white/5">
        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg glass border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-pink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Upgrade to Pro</p>
                <p className="text-xs text-white/40 truncate">Unlimited skips, offline playback, HQ audio</p>
              </div>
              <Badge variant="pink" size="sm">Pro</Badge>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}