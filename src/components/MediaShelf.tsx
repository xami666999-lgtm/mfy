import { POSTER_URL } from '../api/tmdb'
import { genreOf, scoreOf } from './PosterMarks'
import { PosterStatus, stateCaption } from './PosterTile'
import { useStore } from '../store'
import { watchFace } from '../lib/watchProgress'

function proxy(url: string) {
  if (!url) return ''
  if (/image\.tmdb\.org|ytimg\.com|openlibrary\.org|weserv\.nl|wsrv\.nl|myanimelist\.net|anilist\.co|anilistcdn|mangadex\.org|mangaupdates/.test(url)) return url
  return `https://wsrv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}&w=400`
}

export function imgSrc(item: any) {
  const path = item.poster_path
  if (path && String(path).startsWith('http')) return proxy(String(path))
  if (path) return `${POSTER_URL}${path}`
  const raw =
    item.coverImage?.extraLarge ||
    item.coverImage?.large ||
    item.coverImage?.medium ||
    (typeof item.coverImage === 'string' ? item.coverImage : '') ||
    item.images?.jpg?.large_image_url ||
    item.images?.jpg?.image_url ||
    item.image ||
    item.artwork ||
    item.poster ||
    ''
  return proxy(String(raw || ''))
}

export function titleOf(item: any) {
  return item.title?.english || item.title?.romaji || item.title || item.name || ''
}

export function MediaShelf({
  title,
  items,
  onOpen,
  viewAll,
}: {
  title: string
  items: any[]
  onOpen: (item: any) => void
  viewAll?: () => void
}) {
  const hist = useStore((s) => s.watchHistory)
  if (!items?.length) return null
  const ranked = /top\s*10|today/i.test(title)
  return (
    <section className="media-row">
      <div className="media-row-header">
        <h2 className="media-row-title">{title}</h2>
        {viewAll && (
          <button type="button" className="media-row-action" onClick={viewAll}>
            View All
          </button>
        )}
      </div>
      <div className="scroll-row">
        {items.filter(Boolean).map((item: any, i: number) => {
          const score = scoreOf(item)
          const genre = genreOf(item)
          const face = watchFace(hist, item.id, item)
          return (
          <div key={`${title}-${item.id || titleOf(item)}-${i}`} className="poster-wrap">
          <button
            type="button"
            className="poster-card"
            onClick={() => onOpen(item)}
          >
            {imgSrc(item) ? (
              <img
                src={imgSrc(item)}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  const el = e.currentTarget
                  el.onerror = null
                  el.style.display = 'none'
                  el.parentElement?.classList.add('has-fallback')
                }}
              />
            ) : (
              <div className="poster-fallback">{titleOf(item)}</div>
            )}
            <PosterStatus
              genre={genre}
              score={score}
              state={face.state}
              pct={face.pct}
              label={face.label}
              rank={ranked && i < 10 ? i + 1 : 0}
            />
            <div className="poster-overlay">
              <div className="poster-meta-title">{titleOf(item)}</div>
            </div>
          </button>
          <div className="poster-caption">
            <div className="poster-caption-title">{titleOf(item)}</div>
            <div className="poster-caption-sub nv-cap">{stateCaption(face.state)}</div>
          </div>
          </div>
          )
        })}
      </div>
    </section>
  )
}
