import { POSTER_URL } from '../api/tmdb'

export function imgSrc(item: any) {
  if (item.poster_path) return `${POSTER_URL}${item.poster_path}`
  return item.coverImage?.large || item.coverImage?.medium || item.coverImage || item.image || item.artwork || ''
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
            <div className="poster-overlay">
              <div className="poster-meta-title">{titleOf(item)}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
