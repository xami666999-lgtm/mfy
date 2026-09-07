import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX, Heart, Mic, ListMusic, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../../store'
import { audioEngine } from '../../services/audioEngine'
import { streamService } from '../../services/stream'
import { formatTime } from '../../lib/utils'
import { Button, cn } from '../ui/Button'
import { Slider } from '../ui/Slider'
import { Badge } from '../ui/Badge'

export const PlayerBar: React.FC = () => {
  const {
    playbackState,
    setPlaybackState,
    lyricsPanelOpen,
    toggleLyricsPanel,
    queueDrawerOpen,
    toggleQueueDrawer,
    settings,
    setSettings,
  } = useStore()

  const { currentTrack, isPlaying, currentTime, duration, volume, isMuted, repeatMode, shuffle, crossfadeEnabled } = playbackState

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
    setSettings({ volume: value })
  }

  const handleMuteToggle = async () => {
    await audioEngine.toggleMute()
  }

  const handleRepeatToggle = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all']
    const nextMode = modes[(modes.indexOf(repeatMode) + 1) % 3]
    audioEngine.setRepeatMode(nextMode)
    setPlaybackState({ repeatMode: nextMode })
  }

  const handleShuffleToggle = () => {
    const newShuffle = !shuffle
    audioEngine.setShuffle(newShuffle)
    setPlaybackState({ shuffle: newShuffle })
  }

  const handleCrossfadeToggle = () => {
    const newCrossfade = !crossfadeEnabled
    audioEngine.setCrossfade(newCrossfade)
    setPlaybackState({ crossfadeEnabled: newCrossfade })
  }

  if (!currentTrack) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="player-bar h-20 px-4 flex items-center justify-center"
      >
        <div className="text-center text-white/40">
          <p className="font-medium">No track playing</p>
          <p className="text-sm">Search for music or play from your library</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="player-bar h-20 px-4 flex items-center gap-4"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-14 h-14 flex-shrink-0">
          {currentTrack.albumArtUrl ? (
            <img
              src={currentTrack.albumArtUrl}
              alt={currentTrack.title}
              className="w-full h-full rounded-lg object-cover shadow-lg"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white/50" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {isPlaying && (
              <motion.div
                key="playing-indicator"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center animate-pulse"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-white rounded-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-white truncate line-clamp-1">{currentTrack.title}</h4>
          <p className="text-sm text-white/50 truncate line-clamp-1 flex items-center gap-1">
            {currentTrack.artist}
            {currentTrack.album && (
              <>
                <span className="text-white/30">·</span>
                <span>{currentTrack.album}</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
        <div className="flex items-center gap-4">
          <Button
            variant="icon"
            size="icon"
            onClick={handleShuffleToggle}
            className={shuffle ? 'text-pink-400 shadow-glow-pink' : 'text-white/50 hover:text-white'}
            aria-label={shuffle ? 'Shuffle on' : 'Shuffle off'}
            aria-pressed={shuffle}
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          <Button variant="icon" size="icon" onClick={handlePrevious} aria-label="Previous">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="shadow-glow-pink-strong"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </Button>
          <Button variant="icon" size="icon" onClick={handleNext} aria-label="Next">
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button
            variant="icon"
            size="icon"
            onClick={handleRepeatToggle}
            className={repeatMode !== 'off' ? 'text-pink-400 shadow-glow-pink' : 'text-white/50 hover:text-white'}
            aria-label={`Repeat: ${repeatMode}`}
            aria-pressed={repeatMode !== 'off'}
          >
            <Repeat className={cn('w-5 h-5', repeatMode === 'one' && 'text-xs')} />
            {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] text-pink-300">1</span>}
          </Button>
        </div>

        <div className="w-full max-w-md flex items-center gap-2 text-xs text-white/50">
          <span className="w-10 text-right">{formatTime(currentTime)}</span>
          <Slider
            value={currentTime}
            onChange={handleSeek}
            min={0}
            max={duration || 1}
            step={1}
            className="flex-1"
            aria-label="Seek"
          />
          <span className="w-10">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="icon"
          size="icon"
          onClick={handleMuteToggle}
          className={isMuted ? 'text-pink-400' : 'text-white/50 hover:text-white'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Slider
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.05}
          className="w-24"
          aria-label="Volume"
        />
        <Button
          variant="icon"
          size="icon"
          onClick={toggleLyricsPanel}
          className={lyricsPanelOpen ? 'text-pink-400 shadow-glow-pink' : 'text-white/50 hover:text-white'}
          aria-label={lyricsPanelOpen ? 'Close lyrics' : 'Open lyrics'}
          aria-pressed={lyricsPanelOpen}
        >
          <Mic className="w-5 h-5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={toggleQueueDrawer}
          className={queueDrawerOpen ? 'text-pink-400 shadow-glow-pink' : 'text-white/50 hover:text-white'}
          aria-label={queueDrawerOpen ? 'Close queue' : 'Open queue'}
          aria-pressed={queueDrawerOpen}
        >
          <ListMusic className="w-5 h-5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={() => audioEngine.setCrossfade(!crossfadeEnabled)}
          className={crossfadeEnabled ? 'text-cyan-400 shadow-glow-cyan' : 'text-white/50 hover:text-white'}
          aria-label={crossfadeEnabled ? 'Crossfade on' : 'Crossfade off'}
          aria-pressed={crossfadeEnabled}
        >
          <Badge variant="cyan" size="sm" className="text-xs">XF</Badge>
        </Button>
        {currentTrack.isFavorite !== false && (
          <Button
            variant="icon"
            size="icon"
            onClick={() => {}}
            className="text-white/50 hover:text-pink-400"
            aria-label="Add to favorites"
          >
            <Heart className="w-5 h-5" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}