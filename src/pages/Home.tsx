import * as React from 'react'
import { motion } from 'framer-motion'
import { Play, Shuffle, Heart, Plus, TrendingUp, Music, Clock, Loader2, ChevronRight } from 'lucide-react'
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

interface TrackCardProps {
  track: any
  index?: number
  showIndex?: boolean
  onPlay?: () => void
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index, showIndex, onPlay }) => {
  const handlePlay = async () => {
    if (onPlay) {
      onPlay()
    } else {
      const stream = await streamService.resolveStream(track.id, track.sourceUrl, track.sourceType)
      if (stream.success && stream.data) {
        audioEngine.playTrack(track, stream.data.streamUrl)
      }
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.05 }}
      className="card-interactive group relative"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        {track.albumArtUrl ? (
          <img
            src={track.albumArtUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
            <Music className="w-12 h-12 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlay}
            className="w-full shadow-glow-pink-strong group-hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5 mr-2" />
            Play
          </Button>
        </div>
        {showIndex && index !== undefined && (
          <div className="absolute top-2 left-2 text-white/70 font-medium text-lg">{index + 1}</div>
        )}
        {track.isFavorite && (
          <div className="absolute top-2 right-2 text-pink-400">
            <Heart className="w-5 h-5 fill-current" />
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="font-medium text-white truncate line-clamp-1">{track.title}</p>
        <p className="text-sm text-white/50 truncate line-clamp-1 flex items-center gap-1">
          {track.artist}
          {track.album && <span>· {track.album}</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>{formatTime(track.duration)}</span>
          {track.sourceType && <Badge variant="default" size="sm" className="text-[10px] capitalize">{track.sourceType}</Badge>}
        </div>
      </div>
    </motion.div>
  )
}

const Section: React.FC<{
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  subtitle?: string
}> = ({ title, children, action, subtitle }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display font-semibold text-xl gradient-text">{title}</h2>
        {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </motion.div>
)

export const Home: React.FC = () => {
  const { trendingTracks, setTrendingTracks, recentlyPlayed, setRecentlyPlayed, playlists } = useStore()
  const [loading, setLoading] = React.useState({ trending: true, recent: true })

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [trending, recent] = await Promise.all([
          streamService.getTrending(20),
          databaseService.getRecentHistory(),
        ])
        setTrendingTracks(trending)
        setRecentlyPlayed(recent.map(h => ({
          id: h.track_id,
          title: h.title,
          artist: h.artist,
          album: h.album || undefined,
          albumArtUrl: h.album_art_url,
          duration: h.duration,
          sourceType: h.source_type as 'piped' | 'youtube-music' | 'local' | 'cached',
        })))
      } catch (error) {
        console.error('Home load error:', error)
      } finally {
        setLoading({ trending: false, recent: false })
      }
    }
    loadData()
  }, [setTrendingTracks, setRecentlyPlayed])

  const handleShufflePlay = async () => {
    if (trendingTracks.length > 0) {
      const shuffled = [...trendingTracks].sort(() => Math.random() - 0.5)
      audioEngine.setQueue(shuffled, 0)
      const firstTrack = shuffled[0]
      if (firstTrack.sourceUrl && (firstTrack.sourceType === 'piped' || firstTrack.sourceType === 'youtube-music')) {
        const stream = await streamService.resolveStream(firstTrack.id, firstTrack.sourceUrl, firstTrack.sourceType)
        if (stream.success && stream.data) {
          audioEngine.playTrack(firstTrack, stream.data.streamUrl)
        }
      }
    }
  }

  const handlePlayTrack = async (track: any) => {
    if (track.sourceUrl && (track.sourceType === 'piped' || track.sourceType === 'youtube-music')) {
      const stream = await streamService.resolveStream(track.id, track.sourceUrl, track.sourceType)
      if (stream.success && stream.data) {
        audioEngine.playTrack(track, stream.data.streamUrl)
      }
    }
  }

  return (
    <ScrollArea className="h-full p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl gradient-text">Home</h1>
            <p className="text-white/50 mt-1">Discover new music and continue listening</p>
          </div>
          <Button variant="primary" onClick={handleShufflePlay} className="gap-2">
            <Shuffle className="w-5 h-5" />
            <span>Shuffle Play</span>
          </Button>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-cyan-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="max-w-md">
              <p className="text-white/50 text-sm mb-2">Made for you</p>
              <h3 className="font-display font-bold text-2xl gradient-text mb-2">Your Daily Mix</h3>
              <p className="text-white/60 text-sm">Based on your listening history</p>
            </div>
            <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center shadow-glow-pink">
              <Music className="w-16 h-16 text-white/30" />
            </div>
          </div>
        </div>
      </motion.div>

      <Section
        title="Trending Now"
        subtitle={loading.trending ? 'Loading...' : `${trendingTracks.length} tracks`}
        action={
          <Button variant="ghost" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        }
      >
        {loading.trending ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base aspect-square animate-pulse" />
            ))}
          </div>
        ) : trendingTracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trendingTracks.slice(0, 20).map((track, index) => (
              <TrackCard key={track.id} track={track} index={index} showIndex onPlay={() => handlePlayTrack(track)} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center text-white/50">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p>No trending tracks available</p>
          </div>
        )}
      </Section>

      <Section
        title="Recently Played"
        subtitle={loading.recent ? 'Loading...' : `${recentlyPlayed.length} tracks`}
        action={
          <Button variant="ghost" size="sm" onClick={() => { /* navigate to history */ }}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        }
      >
        {loading.recent ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base aspect-square animate-pulse" />
            ))}
          </div>
        ) : recentlyPlayed.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {recentlyPlayed.slice(0, 20).map((track, index) => (
              <TrackCard key={track.id} track={track} index={index} onPlay={() => handlePlayTrack(track)} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center text-white/50">
            <Clock className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p>No recent history</p>
            <p className="text-sm mt-1">Start listening to see your history here</p>
          </div>
        )}
      </Section>

      <Section
        title="Your Playlists"
        subtitle={`${playlists.length} playlists`}
        action={
          <Button variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        }
      >
        {playlists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.slice(0, 20).map((playlist) => (
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
                <div className="mt-3 space-y-1">
                  <p className="font-medium text-white truncate line-clamp-1">{playlist.name}</p>
                  <p className="text-sm text-white/50">{playlist.trackCount} tracks · {formatTime(playlist.totalDuration)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-8 text-center text-white/50">
            <Music className="w-12 h-12 mx-auto mb-4 text-white/20" />
            <p>No playlists yet</p>
            <p className="text-sm mt-1">Create your first playlist</p>
            <Button variant="primary" className="mt-4" onClick={() => { /* create playlist */ }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        )}
      </Section>
    </ScrollArea>
  )
}

export default Home