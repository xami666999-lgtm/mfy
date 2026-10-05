import { useState } from 'react'
import { getMood, getStars, setMood, setStars, type Mood } from '../lib/taste'

export default function TasteBar({ id, type, title }: { id: string | number; type: string; title: string }) {
  const [tick, setTick] = useState(0)
  void tick
  const stars = getStars(id)
  const mood = getMood(id)
  function bump() { setTick((n) => n + 1) }
  function moodOf(next: Mood) {
    setMood(id, next)
    bump()
  }
  return (
    <div className="mfy-taste" data-type={type} data-title={title}>
      <div className="mfy-stars" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" className={n <= stars ? 'on' : ''} onClick={() => { setStars(id, n === stars ? 0 : n); bump() }} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
            {n <= stars ? '★' : '☆'}
          </button>
        ))}
      </div>
      <button type="button" className={mood === 'love' ? 'on love' : ''} onClick={() => moodOf('love')}>Love</button>
      <button type="button" className={mood === 'like' ? 'on like' : ''} onClick={() => moodOf('like')}>Like</button>
      <button type="button" className={mood === 'dislike' ? 'on dislike' : ''} onClick={() => moodOf('dislike')}>Dislike</button>
    </div>
  )
}
