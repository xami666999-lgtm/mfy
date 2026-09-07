import * as React from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Heart, Plus, Loader2, ChevronRight, Filter, X, ListMusic, Shuffle } from 'lucide-react'
import { useStore } from '../store'
import { streamService } from '../services/stream'
import { audioEngine } from '../services/audioEngine'
import { databaseService } from '../services/database'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { formatTime } from '../lib/utils'
import { cn } from '../components/ui/Button'

export const Library: React.FC = () => {
  const { playlists, favorites, history, setPlaylists, setFavorites, setHistory } = useStore()
  const [activeTab, setActiveTab] = React.useState<'playlists' | 'liked' | 'history' | 'tracks'>('playlists')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [playlistsData, favoritesData, historyData] = await Promise.all([
          databaseService.getPlaylists(),
          databaseService.getFavorites(),
          databaseService.getHistory(50, 0),
        ])
        setPlaylists(playlistsData)
        setFavorites(favoritesData.map(f => ({
          id: f.track_id,
          title: f.title,
          artist: f.artist,
          album: f.album || undefined,
          albumArtUrl: f.album_art_url,
          duration: f.duration,
          sourceType: f.source_type as 'piped' | 'youtube-music' | 'local' | 'cached',
          isFavorite: true,
        })))
        setHistory(historyData.map(h => ({
          id: h.track_id,
          title: h.title,
          artist: h.artist,
          album: h.album || undefined,
          albumArtUrl: h.album_art_url,
          duration: h.duration,
          sourceType: h.source_type as 'piped' | 'youtube-music' | 'local' | 'cached',
        })))
      } catch (error) {
        console.error('Library load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [setPlaylists, setFavorites, setHistory])

  const handlePlayTrack = async (track: any) => {
    const stream = await streamService.resolveStream(track.id, track.sourceUrl, track.sourceType)
    if (stream.success && stream.data) {
      audioEngine.playTrack(track, stream.data.streamUrl)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'playlists':
        return (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(6)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base aspect-square animate-pulse" />
                ))}
              </div>
            ) : playlists.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {playlists.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-interactive group"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg">
                      {playlist.artworkUrl ? (
                        <img src={playlist.artworkUrl} alt={playlist.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                          <ListMusic className="w-12 h-12 text-white/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <Button variant="primary" size="lg" className="w-full" onClick={(e) => { e.stopPropagation(); /* play playlist */ }}>
                          <Play className="w-5 h-5 mr-2" />
                          Play
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 space-y-1">
                      <p className="font-medium text-white truncate line-clamp-1">{playlist.name}</p>
                      <p className="text-sm text-white/50">{playlist.trackCount} tracks · {formatTime(playlist.totalDuration)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center text-white/50">
                <ListMusic className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
                <p className="text-sm mb-4">Create your first playlist to organize your music</p>
                <Button variant="primary" onClick={() => { /* create playlist */ }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            )}
          </div>
        )

      case 'liked':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              </div>
            ) : favorites.length > 0 ? (
              <div className="glass rounded-xl overflow-hidden border border-white/5">
                <table className="w-full" role="grid">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 hidden md:table-cell">Album</th>
                      <th className="px-4 py-3 w-20 text-right">Duration</th>
                      <th className="px-4 py-3 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {favorites.map((track, index) => (
                      <motion.tr
                        key={track.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <td className="px-4 py-3 text-white/40 text-sm font-medium w-12">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {track.albumArtUrl ? (
                              <img src={track.albumArtUrl} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                                <Music className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate line-clamp-1">{track.title}</p>
                              <p className="text-sm text-white/50 truncate line-clamp-1">{track.artist}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-white/50 text-sm truncate max-w-[150px]">{track.album || '—'}</td>
                        <td className="px-4 py-3 text-white/40 text-sm w-20 text-right">{formatTime(track.duration)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="icon" size="icon" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }} className="text-white/40 hover:text-pink-400">
                            <Play className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center text-white/50">
                <Heart className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium mb-2">No liked songs yet</h3>
                <p className="text-sm mb-4">Click the heart icon on tracks to add them here</p>
              </div>
            )}
          </div>
        )

      case 'history':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
              </div>
            ) : history.length > 0 ? (
              <div className="glass rounded-xl overflow-hidden border border-white/5">
                <table className="w-full" role="grid">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      <th className="px-4 py-3 w-12">#</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3 hidden md:table-cell">Album</th>
                      <th className="px-4 py-3 w-24">Played</th>
                      <th className="px-4 py-3 w-20 text-right">Duration</th>
                      <th className="px-4 py-3 w-12 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((track, index) => (
                      <motion.tr
                        key={`${track.id}-${index}`}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <td className="px-4 py-3 text-white/40 text-sm font-medium w-12">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {track.albumArtUrl ? (
                              <img src={track.albumArtUrl} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                                <Music className="w-5 h-5 text-white/30" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate line-clamp-1">{track.title}</p>
                              <p className="text-sm text-white/50 truncate line-clamp-1">{track.artist}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-white/50 text-sm truncate max-w-[150px]">{track.album || '—'}</td>
                        <td className="px-4 py-3 text-white/40 text-sm w-24">
                          {new Date((track as any).played_at || Date.now()).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-white/40 text-sm w-20 text-right">{formatTime(track.duration)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="icon" size="icon" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }} className="text-white/40 hover:text-pink-400">
                            <Play className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center text-white/50">
                <Music className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-lg font-medium mb-2">No listening history</h3>
                <p className="text-sm">Start playing music to see your history</p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-3xl gradient-text">Library</h1>
            <p className="text-white/50 mt-1">Your music collection</p>
          </div>
          <Button variant="primary" className="gap-2">
            <Shuffle className="w-5 h-5" />
            Shuffle All
          </Button>
        </div>
        <div className="flex items-center gap-2 border-b border-white/10">
          {(['playlists', 'liked', 'history', 'tracks'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                'hover:text-white hover:bg-white/5',
                activeTab === tab
                  ? 'text-white bg-white/10 border-b-2 border-pink-500'
                  : 'text-white/50'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'playlists' && playlists.length > 0 && (
                <Badge variant="default" size="sm" className="ml-2 text-xs">{playlists.length}</Badge>
              )}
              {tab === 'liked' && favorites.length > 0 && (
                <Badge variant="pink" size="sm" className="ml-2 text-xs">{favorites.length}</Badge>
              )}
              {tab === 'history' && history.length > 0 && (
                <Badge variant="default" size="sm" className="ml-2 text-xs">{history.length}</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </div>
    </div>
  )
}

export default Library