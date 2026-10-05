import { POSTER_URL } from '../api/tmdb'
import { BadgeImg } from './QualityBadges'
import { useStore } from '../store'
import { watchFace } from '../lib/watchProgress'

export type PosterFace = 'fresh' | 'progress' | 'watched' | 'started'

export function stateCaption(state: PosterFace) {
  if (state === 'watched') return 'Watched'
  if (state === 'started') return 'Watching'
  if (state === 'progress') return 'In progress'
  return 'Not watched'
}

function shortGenre(genre?: string) {
  if (!genre) return ''
  return genre
    .replace('Science Fiction', 'Sci-Fi')
    .replace('Action & Adventure', 'Action')
    .replace('TV Movie', 'Movie')
}

export function PosterStatus({
  genre,
  score,
  state = 'fresh',
  pct = 0,
  label,
  rank,
  pending,
}: {
  genre?: string
  score?: number
  state?: PosterFace
  pct?: number
  label?: string
  rank?: number
  pending?: number
}) {
  const star = score && score > 0 ? Number(score).toFixed(1) : ''
  const freshLine = [shortGenre(genre), star ? `★ ${star}` : ''].filter(Boolean).join(' • ')
  const show = state === 'watched' || state === 'progress' || state === 'started' || !!freshLine || !!rank
  if (!show) return null
  return (
    <>
      {rank ? <em className="nv-today">#{rank} Today</em> : null}
      {state === 'watched' && <i className="nv-corner ok" aria-label="Up to date">✓</i>}
      {(state === 'started' || state === 'progress') && <i className="nv-corner play" aria-label="Started" />}
      {!!pending && pending > 0 && <span className="nv-pending">{pending} left</span>}
      {state === 'watched' && (
        <span className="nv-status watched"><i className="ok" aria-hidden>✓</i> Watched</span>
      )}
      {state === 'started' && (
        <span className="nv-status started"><i className="tri" aria-hidden /> {label || 'Watching'}</span>
      )}
      {state === 'progress' && (
        <span className="nv-status progress">
          <i className="tri" aria-hidden />
          <span className="nv-track"><b style={{ width: `${Math.max(8, Math.min(100, pct))}%` }} /></span>
          {label ? <em>{label}</em> : null}
        </span>
      )}
      {state === 'fresh' && freshLine && <span className="nv-status fresh"><em>{freshLine}</em></span>}
    </>
  )
}

export function PosterTile({
  poster,
  title,
  genre,
  score,
  pct = 0,
  badge,
  rank,
  state,
  progressLabel,
  mediaId,
  item,
  onClick,
}: {
  poster?: string | null
  title: string
  genre?: string
  score?: number
  pct?: number
  year?: string
  badge?: string
  rank?: number
  state?: PosterFace
  progressLabel?: string
  mediaId?: string | number
  item?: any
  onClick: () => void
}) {
  const hist = useStore((s) => s.watchHistory)
  const looked = mediaId != null ? watchFace(hist, mediaId, item) : null
  const src = poster ? (String(poster).startsWith('http') ? poster : `${POSTER_URL}${poster}`) : ''
  const bar = looked && looked.state !== 'fresh' ? looked.pct : pct
  const face = state || looked?.state || (bar >= 92 ? 'watched' : bar > 2 ? 'progress' : 'fresh')
  const label = progressLabel || looked?.label || (face === 'progress' ? `${Math.round(bar)}%` : '')
  return (
    <button type="button" className="nv-card" onClick={onClick}>
      <span className="nv-poster">
        {src ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <div className="ph">{title}</div>}
        {badge ? <BadgeImg className="nv-badge" src={badge} alt="" /> : null}
        <PosterStatus genre={genre} score={score} state={face} pct={bar} label={label} rank={rank} pending={looked?.pending} />
      </span>
      <strong>{title}</strong>
      <em className="nv-cap">{stateCaption(face)}</em>
    </button>
  )
}
