import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Maximize2, Minimize2, RefreshCw, Globe, Copy } from 'lucide-react'
import { useStore } from '../../store'
import { streamService } from '../../services/stream'
import { audioEngine } from '../../services/audioEngine'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ScrollArea } from '../ui/ScrollArea'
import { cn } from '../ui/Button'

interface LyricsLine {
  time: number
  text: string
}

interface LyricsData {
  synced: boolean
  lines: LyricsLine[]
  provider: string
}

export const LyricsPanel: React.FC = () => {
  const {
    lyricsPanelOpen,
    playbackState,
    toggleLyricsPanel,
    settings,
  } = useStore()

  const { currentTrack, currentTime } = playbackState
  const [lyrics, setLyrics] = React.useState<LyricsData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [expanded, setExpanded] = React.useState(false)

  React.useEffect(() => {
    if (!lyricsPanelOpen || !currentTrack) {
      setLyrics(null)
      return
    }
    loadLyrics()
  }, [lyricsPanelOpen, currentTrack])

  const loadLyrics = async () => {
    if (!currentTrack?.sourceUrl) return
    
    setLoading(true)
    setError(null)
    
    try {
      const videoId = extractVideoId(currentTrack.sourceUrl)
      if (!videoId) throw new Error('Invalid track URL')
      
      // Only fetch lyrics for Piped or YouTube Music sources
      if (currentTrack.sourceType === 'piped' || currentTrack.sourceType === 'youtube-music') {
        const lyricsData = await streamService.getLyrics(videoId, currentTrack.sourceType)
        setLyrics(lyricsData)
      } else {
        setLyrics(null)
      }
    } catch (err) {
      setError('Failed to load lyrics')
      console.error('Lyrics load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const findCurrentLine = (lines: LyricsLine[], time: number) => {
    let currentIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= time) {
        currentIndex = i
      } else {
        break
      }
    }
    return currentIndex
  }

  if (!lyricsPanelOpen) {
    return (
      <AnimatePresence>
        <motion.button
          key="closed"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onClick={toggleLyricsPanel}
          className="w-full h-12 flex items-center justify-center gap-2 px-4 bg-gradient-to-r from-pink-500/10 to-cyan-500/10 border-t border-white/5 hover:from-pink-500/20 hover:to-cyan-500/20 transition-all duration-300"
          aria-label="Open lyrics panel"
        >
          <Mic className="w-5 h-5 text-white/50" />
          <span className="text-sm font-medium text-white/70">Lyrics</span>
          <span className="text-xs text-white/40">Click to expand</span>
        </motion.button>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="open"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: expanded ? 'auto' : 300, opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="glass-strong border-t border-white/5 overflow-hidden flex flex-col"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
              {lyrics?.synced ? <Mic className="w-4 h-4 text-pink-400" /> : <MicOff className="w-4 h-4 text-white/50" />}
            </div>
            <div>
              <h3 className="font-medium text-white">Lyrics</h3>
              <p className="text-xs text-white/40">
                {currentTrack?.title} - {currentTrack?.artist}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={lyrics?.synced ? 'cyan' : 'default'} size="sm">
              {lyrics?.synced ? 'Synced' : 'Static'}
            </Badge>
            {lyrics?.provider && (
              <Badge variant="default" size="sm" className="text-xs">
                {lyrics.provider}
              </Badge>
            )}
            <Button variant="icon" size="icon" onClick={loadLyrics} disabled={loading} aria-label="Refresh lyrics">
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
            <Button variant="icon" size="icon" onClick={() => setExpanded(!expanded)} aria-label={expanded ? 'Minimize' : 'Expand'}>
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button variant="icon" size="icon" onClick={toggleLyricsPanel} aria-label="Close lyrics">
              <MicOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden" style={{ maxHeight: expanded ? '50vh' : 300 }}>
          <ScrollArea className="h-full p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/50">
                <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
                <span className="ml-2">Loading lyrics...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-white/50">
                <MicOff className="w-10 h-10 text-white/20" />
                <p className="text-sm">{error}</p>
                <Button variant="ghost" size="sm" onClick={loadLyrics}>Retry</Button>
              </div>
            ) : !lyrics || lyrics.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-white/50">
                <Mic className="w-10 h-10 text-white/20" />
                <p className="text-sm">No lyrics available for this track</p>
                <Button variant="ghost" size="sm" onClick={loadLyrics}>Search again</Button>
              </div>
            ) : (
              <div className="space-y-1" role="region" aria-label="Lyrics">
                {lyrics.lines.map((line, index) => {
                  const isCurrent = index === findCurrentLine(lyrics.lines, currentTime)
                  const isPast = index < findCurrentLine(lyrics.lines, currentTime)
                  
                  return (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isCurrent ? 1 : isPast ? 0.6 : 0.4, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg cursor-pointer select-none transition-all duration-200',
                        'hover:bg-white/5',
                        isCurrent && 'text-white font-medium bg-white/5 shadow-glow-pink',
                        isPast && 'text-white/70',
                        !isCurrent && !isPast && 'text-white/40'
                      )}
                      onClick={() => audioEngine.seek(line.time)}
                      style={{ 
                        transform: isCurrent ? 'translateX(4px)' : 'none',
                        fontWeight: isCurrent ? 500 : 400,
                      }}
                    >
                      {line.text || '♪'}
                    </motion.p>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {lyrics?.synced && (
          <div className="px-4 py-2 border-t border-white/5 bg-white/5">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>Current: {formatTime(currentTime)}</span>
              <span>Provider: {lyrics.provider}</span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}