import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  Music, Play, Heart, Plus, Loader2, ChevronRight, Filter, X, ListMusic, Shuffle,
  Clock, TrendingUp, BarChart3, Calendar, Hourglass, Award, Target, Zap, User
} from 'lucide-react'
import { useStore } from '../store'
import { databaseService } from '../services/database'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { formatTime } from '../lib/utils'
import { cn } from '../components/ui/Button'

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const StatCard: React.FC<{
  icon: React.ReactNode
  value: string | number
  label: string
  trend?: string
  color?: string
}> = ({ icon, value, label, trend, color = 'pink' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass rounded-xl p-6 border border-white/5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-white/50 mb-1">{label}</p>
        <p className="font-display font-bold text-3xl gradient-text">{value}</p>
        {trend && (
          <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', `bg-${color}-500/20 text-${color}-400`)}>
        {icon}
      </div>
    </div>
  </motion.div>
)

const ChartBar: React.FC<{
  label: string
  value: number
  maxValue: number
  color?: string
  index: number
}> = ({ label, value, maxValue, color = 'pink', index }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="w-16 h-full relative" style={{ height: '150px' }}>
        <div
          className="absolute bottom-0 w-full rounded-t"
          style={{
            height: `${percentage}%`,
            background: `linear-gradient(to top, #FF1493, #00E5FF)`,
          }}
        />
      </div>
      <span className="text-xs text-white/50 text-center w-20">{label}</span>
      <span className="text-xs font-medium text-white/70">{formatDuration(value)}</span>
    </motion.div>
  )
}

export const Stats: React.FC = () => {
  const { statistics, setStatistics } = useStore()
  const [loading, setLoading] = React.useState(true)
  const [timeRange, setTimeRange] = React.useState<'7d' | '30d' | '90d' | 'all'>('30d')

  React.useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
        const stats = await databaseService.getStatistics(days)
        setStatistics(stats)
      } catch (error) {
        console.error('Stats load error:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [timeRange, setStatistics])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    )
  }

  const stats = statistics!
  const maxHourly = Math.max(...stats.listeningByHour)
  const maxDaily = Math.max(...stats.listeningByDay)
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <ScrollArea className="h-full p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl gradient-text">Statistics</h1>
          <p className="text-white/50 mt-1">Your listening insights</p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                timeRange === range
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="w-6 h-6" />} value={formatDuration(stats.totalListeningTime)} label="Total Listening Time" />
        <StatCard icon={<Music className="w-6 h-6" />} value={stats.totalTracksPlayed} label="Tracks Played" />
        <StatCard icon={<ListMusic className="w-6 h-6" />} value={stats.uniqueTracksPlayed} label="Unique Tracks" />
        <StatCard icon={<User className="w-6 h-6" />} value={stats.uniqueArtistsPlayed} label="Unique Artists" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topTracks.slice(0, 10).map((item, index) => (
                <motion.div
                  key={item.track.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 glass rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="w-8 text-center font-medium text-white/50">{index + 1}</span>
                  {item.track.albumArtUrl ? (
                    <img src={item.track.albumArtUrl} alt="" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                      <Music className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate line-clamp-1">{item.track.title}</p>
                    <p className="text-sm text-white/50 truncate line-clamp-1">{item.track.artist}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{item.playCount} plays</p>
                    <p className="text-xs text-white/40">{formatDuration(item.totalTime)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topArtists.slice(0, 10).map((item, index) => (
                <motion.div
                  key={item.artist}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-3 glass rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="w-8 text-center font-medium text-white/50">{index + 1}</span>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                    <Music className="w-6 h-6 text-white/30" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{item.artist}</p>
                    <p className="text-sm text-white/50">{item.playCount} plays · {formatDuration(item.totalTime)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hourglass className="w-5 h-5" />
              Listening by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-1 h-48 px-4">
              {stats.listeningByHour.map((value, index) => (
                <ChartBar
                  key={index}
                  label={`${index}:00`}
                  value={value}
                  maxValue={maxHourly}
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Listening by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-2 h-48 px-4">
              {stats.listeningByDay.map((value, index) => (
                <ChartBar
                  key={index}
                  label={dayLabels[index]}
                  value={value}
                  maxValue={maxDaily}
                  index={index}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top Albums
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topAlbums.slice(0, 10).map((item, index) => (
              <motion.div
                key={item.album}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-3 glass rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="w-8 text-center font-medium text-white/50">{index + 1}</span>
                <div className="w-12 h-12 rounded bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                  <Music className="w-5 h-5 text-white/30" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{item.album}</p>
                  <p className="text-sm text-white/50">{item.playCount} plays · {formatDuration(item.totalTime)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recently Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.recentlyPlayed.slice(0, 10).map((track, index) => (
              <motion.div
                key={track.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-interactive group"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  {track.albumArtUrl ? (
                    <img src={track.albumArtUrl} alt={track.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
                      <Music className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <Button variant="primary" size="sm" className="w-full">
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="font-medium text-white truncate line-clamp-1 text-sm">{track.title}</p>
                  <p className="text-xs text-white/50 truncate line-clamp-1">{track.artist}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  )
}

export default Stats