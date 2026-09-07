import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ListMusic, X, GripVertical, Heart, MoreVertical, Play, Pause, Trash2, ChevronLeft } from 'lucide-react'
import { useStore } from '../../store'
import { audioEngine } from '../../services/audioEngine'
import { formatTime } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ScrollArea } from '../ui/ScrollArea'
import { cn } from '../ui/Button'

interface QueueItemProps {
  track: any
  index: number
  isPlaying: boolean
  isCurrent: boolean
  onPlay: () => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void
  onDragEnd: () => void
}

const QueueItem: React.FC<QueueItemProps> = ({
  track,
  index,
  isPlaying,
  isCurrent,
  onPlay,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const [dragging, setDragging] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    setDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
    onDragStart(e, index)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHovered(true)
    onDragOver(e)
  }

  const handleDragLeave = () => {
    setHovered(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHovered(false)
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIndex !== index) {
      onDrop(e, index)
    }
  }

  const handleDragEnd = () => {
    setDragging(false)
    setHovered(false)
    onDragEnd()
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg',
        'transition-all duration-200',
        isCurrent && 'bg-white/10',
        dragging && 'opacity-50 scale-[1.02] shadow-lg shadow-pink-500/20 z-10',
        hovered && !dragging && 'bg-white/5'
      )}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-white/30 group-hover:text-white/50 cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </div>

      {track.albumArtUrl ? (
        <img src={track.albumArtUrl} alt="" className="w-12 h-12 rounded object-cover shadow" />
      ) : (
        <div className="w-12 h-12 rounded bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
          <span className="text-xl">🎵</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'font-medium truncate line-clamp-1',
            isCurrent ? 'text-white' : 'text-white/80'
          )}>
            {track.title}
          </p>
          {isCurrent && isPlaying && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-pink-400 text-xs flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
              Playing
            </motion.span>
          )}
          {isCurrent && !isPlaying && (
            <Badge variant="default" size="sm" className="text-xs">Paused</Badge>
          )}
        </div>
        <p className="text-sm text-white/50 truncate line-clamp-1 flex items-center gap-1">
          {track.artist}
          {track.album && (
            <>
              <span className="text-white/30">·</span>
              <span>{track.album}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-white/40 w-16 text-right">{formatTime(track.duration)}</span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="icon"
            size="icon"
            onClick={onPlay}
            className={isCurrent && isPlaying ? 'text-pink-400' : 'text-white/40 hover:text-white'}
            aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
          >
            {isCurrent && isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </Button>
          <Button
            variant="icon"
            size="icon"
            onClick={onRemove}
            className="text-white/40 hover:text-red-400"
            aria-label="Remove from queue"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const QueueDrawer: React.FC = () => {
  const {
    queueDrawerOpen,
    toggleQueueDrawer,
    playbackState,
  } = useStore()

  const { queue, queueIndex, isPlaying, currentTrack } = playbackState
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      audioEngine.reorderQueue(draggedIndex, targetIndex)
    }
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handlePlay = (index: number) => {
    if (index === queueIndex) {
      audioEngine.togglePlayPause()
    } else {
      audioEngine.playTrackAtIndex(index)
    }
  }

  const handleRemove = (index: number) => {
    audioEngine.removeFromQueue(index)
  }

  if (!queueDrawerOpen) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        key="open"
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed inset-y-0 right-0 z-50 flex flex-col queue-drawer w-96"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        role="dialog"
        aria-label="Playback queue"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-cyan-500/30 flex items-center justify-center">
              <ListMusic className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Up Next</h2>
              <p className="text-xs text-white/40">{queue.length} track{queue.length !== 1 ? 's' : ''} in queue</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => audioEngine.clearQueue()}>
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
            <Button variant="icon" size="icon" onClick={toggleQueueDrawer} aria-label="Close queue">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-white/40">
              <ListMusic className="w-16 h-16 text-white/10 mb-4" />
              <p className="text-lg font-medium">Queue is empty</p>
              <p className="text-sm mt-1">Add tracks from search or your library</p>
            </div>
          ) : (
            <ScrollArea className="h-full p-2">
              <div className="space-y-1" role="list" aria-label="Queue tracks">
                {queue.map((track, index) => (
                  <QueueItem
                    key={track.id}
                    track={track}
                    index={index}
                    isPlaying={isPlaying}
                    isCurrent={index === queueIndex}
                    onPlay={() => handlePlay(index)}
                    onRemove={() => handleRemove(index)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {queue.length > 0 && (
          <div className="p-4 border-t border-white/5 bg-white/5">
            <div className="flex items-center justify-between text-sm text-white/50">
              <span>Drag to reorder • Click to play</span>
              <Badge variant="pink" size="sm">{queue.length} tracks</Badge>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}