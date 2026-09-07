import * as React from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Heart, Plus, Loader2, ChevronRight, Filter, X } from 'lucide-react'
import { useStore } from '../store'
import { streamService } from '../services/stream'
import { audioEngine } from '../services/audioEngine'
import { databaseService } from '../services/database'
import { SearchBar } from '../components/search/SearchBar'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { formatTime } from '../lib/utils'
import { cn } from '../components/ui/Button'

interface TrackRowProps {
  track: any
  index: number
  onPlay: () => void
}

const TrackRow: React.FC<TrackRowProps> = ({ track, index, onPlay }) => {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="hover:bg-white/5 transition-colors cursor-pointer"
      onClick={onPlay}
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
        <Button variant="icon" size="icon" onClick={(e) => { e.stopPropagation(); onPlay(); }} className="text-white/40 hover:text-pink-400">
          <Play className="w-4 h-4" />
        </Button>
      </td>
    </motion.tr>
  )
}

export const Search: React.FC = () => {
  const { searchQuery, searchResults, currentPage, setCurrentPage } = useStore()
  const [activeTab, setActiveTab] = React.useState<'tracks' | 'artists' | 'albums'>('tracks')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (searchQuery.length >= 2) {
      setLoading(true)
      streamService.search(searchQuery, 'tracks', 20).then(results => {
        // Results are already set via store
        setLoading(false)
      })
    }
  }, [searchQuery])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentPage('search-results')
    }
  }

  const handlePlayTrack = async (track: any) => {
    const stream = await streamService.resolveStream(track.id, track.sourceUrl, track.sourceType)
    if (stream.success && stream.data) {
      audioEngine.playTrack(track, stream.data.streamUrl)
    }
  }

  const currentResults = activeTab === 'tracks' ? searchResults.tracks :
    activeTab === 'artists' ? searchResults.artists : searchResults.albums

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <SearchBar />
          <div className="mt-4 flex items-center gap-2 border-b border-white/10">
            {(['tracks', 'artists', 'albums'] as const).map(tab => (
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
                {currentResults.length > 0 && (
                  <Badge variant="default" size="sm" className="ml-2 text-xs">{currentResults.length}</Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
            </div>
          ) : searchQuery.length < 2 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center text-white/40"
            >
              <Music className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-lg font-medium text-white/60 mb-2">Start searching</h3>
              <p className="text-sm">Type at least 2 characters to search for music</p>
            </motion.div>
          ) : currentResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center text-white/40"
            >
              <Music className="w-16 h-16 text-white/10 mb-4" />
              <h3 className="text-lg font-medium text-white/60 mb-2">No results found</h3>
              <p className="text-sm">Try a different search term</p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={handleSearch}>
                Search all results
              </Button>
            </motion.div>
          ) : activeTab === 'tracks' ? (
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
                  {currentResults.map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} onPlay={() => handlePlayTrack(track)} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'artists' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentResults.map((artist, index) => (
                <motion.div
                  key={artist.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card-interactive group p-4"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    {artist.imageUrl ? (
                      <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                        <Music className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-white truncate line-clamp-1">{artist.name}</p>
                  <p className="text-sm text-white/50 mt-1">{artist.trackCount || 0} tracks</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentResults.map((album, index) => (
                <motion.div
                  key={album.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card-interactive group"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    {album.artworkUrl ? (
                      <img src={album.artworkUrl} alt={album.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                        <Music className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <Button variant="primary" size="lg" className="w-full">
                        <Play className="w-5 h-5 mr-2" />
                        Play
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="font-medium text-white truncate line-clamp-1">{album.title}</p>
                    <p className="text-sm text-white/50 truncate line-clamp-1">{album.artist}</p>
                    <p className="text-xs text-white/40">{album.trackCount || 0} tracks</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Search