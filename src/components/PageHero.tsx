import { useEffect, useState } from 'react'
import { Play, Plus, Check } from 'lucide-react'
import { BACKDROP_URL } from '../api/tmdb'
import { titleOf, imgSrc } from './MediaShelf'
import { useStore } from '../store'
import TitleLogo from './TitleLogo'

export default function PageHero({
  item,
  items,
  kicker,
  onPlay,
}: {
  item?: any
  items?: any[]
  kicker: string
  onPlay: (item?: any) => void
}) {
  const pool = (items && items.length ? items : item ? [item] : []).filter((x) => x && (x.backdrop_path || x.poster_path || x.name || x.title)).slice(0, 8)
  const [i, setI] = useState(0)
  useEffect(() => { setI(0) }, [pool[0]?.id])
  useEffect(() => {
    if (pool.length < 2) return
    const id = setInterval(() => setI((n) => (n + 1) % pool.length), 8000)
    return () => clearInterval(id)
  }, [pool.length, pool[0]?.id])
  const current = pool[i]
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useStore()
  if (!current) return null
  const bg = current.backdrop_path ? `${BACKDROP_URL}${current.backdrop_path}` : imgSrc(current)
  const type = current.media_type === 'manga' || current.media_type === 'novel' || current.media_type === 'comics' || /manga|novel|comic/i.test(kicker)
    ? (current.media_type || 'manga')
    : (current.media_type === 'tv' || current.first_air_date) ? 'tv' : (current.media_type || 'movie')
  const inLib = current.id ? isInWatchlist(current.id, type) : false
  const raw = Number(current.vote_average || current.averageScore || 0)
  const score = raw > 10 ? raw / 10 : raw
  return (
    <section className="hero" style={{ minHeight: '62vh' }}>
      <div className="hero-backdrop" style={{ backgroundImage: bg ? `url(${bg})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center top' }} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-copy">
          <div className="hero-kicker">{kicker}</div>
          <TitleLogo id={current.id} type={type} title={titleOf(current)} />
          {score > 0 && <div className="hero-meta"><span className="hero-score">★ {score.toFixed(1)}</span></div>}
          <p>{String(current.overview || current.description || '').replace(/<[^>]+>/g, '')}</p>
          <div className="hero-actions">
            <button className="hero-play" type="button" onClick={() => onPlay(current)}>
              <Play fill="currentColor" size={16} /> Play
            </button>
            <button
              className="hero-secondary"
              type="button"
              onClick={() => {
                if (!current.id) return
                if (inLib) removeFromWatchlist(current.id, type)
                else addToWatchlist({ mediaId: current.id, mediaType: type, title: titleOf(current), posterPath: current.poster_path || null, addedAt: new Date().toISOString() })
              }}
            >
              {inLib ? <><Check size={16} /> In Library</> : <><Plus size={16} /> Add to Library</>}
            </button>
          </div>
          {pool.length > 1 && (
            <div className="hero-dots">
              {pool.map((x, n) => (
                <button key={x.id || n} type="button" className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={titleOf(x)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}