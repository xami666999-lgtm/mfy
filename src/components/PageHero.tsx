import { Play, Plus, Check } from 'lucide-react'
import { BACKDROP_URL } from '../api/tmdb'
import { titleOf, imgSrc } from './MediaShelf'
import { useStore } from '../store'

export default function PageHero({
  item,
  kicker,
  onPlay,
}: {
  item?: any
  kicker: string
  onPlay: () => void
}) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore()
  if (!item) return null
  const bg = item.backdrop_path ? `${BACKDROP_URL}${item.backdrop_path}` : imgSrc(item)
  const type = item.media_type === 'manga' || item.media_type === 'novel' || item.media_type === 'comics' || /manga|novel|comic/i.test(kicker)
    ? (item.media_type || 'manga')
    : (item.media_type === 'tv' || item.first_air_date) ? 'tv' : (item.media_type || 'movie')
  const inLib = item.id ? isInWatchlist(item.id, type) : false
  return (
    <section className="hero" style={{ minHeight: "70vh" }}>
      <div className="hero-backdrop" style={{ backgroundImage: bg ? `url(${bg})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      {bg ? <img src={bg} alt="" referrerPolicy="no-referrer" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, pointerEvents: 'none' }} /> : null}
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
            <button
              className="hero-secondary"
              type="button"
              onClick={() => {
                if (!item.id) return
                if (inLib) removeFromWatchlist(item.id, type)
                else addToWatchlist({ mediaId: item.id, mediaType: type, title: titleOf(item), posterPath: item.poster_path || null, addedAt: new Date().toISOString() })
              }}
            >
              {inLib ? <><Check size={16} /> In Library</> : <><Plus size={16} /> Add to Library</>}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
