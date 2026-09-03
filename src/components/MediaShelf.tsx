import { POSTER_URL } from '../api/tmdb'
import { PosterMarks } from './PosterMarks'
import { useStore } from '../store'
import { watchPercent } from '../lib/watchProgress'

function proxy(url: string) {
  if (!url) return ''
  if (/image\.tmdb\.org|ytimg\.com|openlibrary\.org|weserv\.nl|wsrv\.nl/.test(url)) return url
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
        {items.filter(Boolean).map((item: any, i: number) => (
          <button
            key={`${title}-${item.id || titleOf(item)}-${i}`}
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
            <PosterMarks item={{ ...item, progressPct: item.progressPct ?? watchPercent(hist.find((h) => String(h.mediaId) === String(item.id))) }} />
            <div className="poster-overlay">
              <div className="poster-meta-title">{titleOf(item)}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
