import { Play, Plus } from 'lucide-react'
import { BACKDROP_URL } from '../api/tmdb'
import { titleOf, imgSrc } from './MediaShelf'

export default function PageHero({
  item,
  kicker,
  onPlay,
}: {
  item?: any
  kicker: string
  onPlay: () => void
}) {
  if (!item) return null
  const bg = item.backdrop_path ? `${BACKDROP_URL}${item.backdrop_path}` : imgSrc(item)
  return (
    <section className="hero" style={{ minHeight: "70vh" }}>
      <div className="hero-backdrop" style={{ backgroundImage: bg ? `url(${bg})` : undefined }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-copy">
          <div className="hero-kicker">{kicker}</div>
          <h1>{titleOf(item)}</h1>
          <p>{item.overview || item.description || ''}</p>
          <div className="hero-actions">
            <button className="hero-play" type="button" onClick={onPlay}>
              <Play fill="currentColor" size={16} /> Play
            </button>
            <button className="hero-secondary" type="button">
              <Plus size={16} /> Add to List
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
