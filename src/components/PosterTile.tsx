import { POSTER_URL } from '../api/tmdb'
import { BadgeImg } from './QualityBadges'

export function PosterTile({
  poster,
  title,
  genre,
  score,
  pct = 0,
  year,
  badge,
  onClick,
}: {
  poster?: string | null
  title: string
  genre?: string
  score?: number
  pct?: number
  year?: string
  badge?: string
  onClick: () => void
}) {
  const src = poster ? (String(poster).startsWith('http') ? poster : `${POSTER_URL}${poster}`) : ''
  const star = score && score > 0 ? score.toFixed(1) : ''
  return (
    <button type="button" className="nv-card" onClick={onClick}>
      <span className="nv-poster">
        {src ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <div className="ph">{title}</div>}
        {(genre || star) && (
          <em className="nv-foot">{[genre, star ? `★ ${star}` : ''].filter(Boolean).join('  ')}</em>
        )}
        {badge ? <BadgeImg className="nv-badge" src={badge} alt="" /> : null}
        {pct > 2 && <i className="nv-prog" style={{ width: `${Math.min(100, pct)}%` }} />}
      </span>
      <strong>{title}</strong>
      {year ? <small>{year}</small> : null}
    </button>
  )
}
