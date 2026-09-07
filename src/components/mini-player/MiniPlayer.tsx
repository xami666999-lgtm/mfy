import * as React from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Maximize2 } from 'lucide-react'
import { useStore } from '../../store'
import { audioEngine } from '../../services/audioEngine'
import { formatTime } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'

interface MiniPlayerProps {
  onClose: () => void
  onMaximize: () => void
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onClose, onMaximize }) => {
  const { playbackState, settings } = useStore()
  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted } = playbackState

  const handlePlayPause = async () => {
    await audioEngine.togglePlayPause()
  }

  const handleNext = async () => {
    await audioEngine.playNext()
  }

  const handlePrevious = async () => {
    await audioEngine.playPrevious()
  }

  const handleSeek = async (value: number) => {
    await audioEngine.seek(value)
  }

  const handleVolumeChange = async (value: number) => {
    await audioEngine.setVolume(value)
  }

  const handleMuteToggle = async () => {
    await audioEngine.toggleMute()
  }

  if (!currentTrack) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="mini-player w-[360px] p-3"
      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start gap-3">
        <div className="relative w-16 h-16 flex-shrink-0">
          {currentTrack.albumArtUrl ? (
            <img
              src={currentTrack.albumArtUrl}
              alt={currentTrack.title}
              className="w-full h-full rounded-lg object-cover shadow-lg"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
              <span className="text-2xl">🎵</span>
            </div>
          )}
          {isPlaying && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center animate-pulse"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1 h-1 bg-white rounded-full"
              />
            </motion.div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-white truncate line-clamp-1">{currentTrack.title}</h4>
              <p className="text-xs text-white/50 truncate line-clamp-1">{currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="icon" size="icon" onClick={onMaximize} aria-label="Open full player">
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="icon" size="icon" onClick={onClose} aria-label="Close mini player">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] text-white/40 w-8 text-right">{formatTime(currentTime)}</span>
            <Slider
              value={currentTime}
              onChange={handleSeek}
              min={0}
              max={duration || 1}
              step={1}
              className="flex-1 h-1"
              aria-label="Seek"
            />
            <span className="text-[10px] text-white/40 w-8">{formatTime(duration)}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button variant="icon" size="sm" onClick={handlePrevious} aria-label="Previous">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="sm" onClick={handlePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'} className="w-8 h-8">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <Button variant="icon" size="sm" onClick={handleNext} aria-label="Next">
              <SkipForward className="w-4 h-4" />
            </Button>
            <div className="flex-1" />
            <Button variant="icon" size="icon" onClick={handleMuteToggle} className={isMuted ? 'text-pink-400' : 'text-white/50'} aria-label={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.05}
              className="w-20 h-1"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}