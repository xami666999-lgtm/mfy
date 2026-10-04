import { useStore } from '../store'
import { POSTER_URL } from '../api/tmdb'
import { isFinished, watchPercent } from '../lib/watchProgress'

function art(path?: string | null) {
  if (!path) return ''
  if (String(path).startsWith('http')) return String(path)
  return `${POSTER_URL}${path}`
}

export default function SavedDrawer({ onClose }: { onClose: () => void }) {
  const { watchHistory, watchlist, currentProfile, setSelectedMedia, setCurrentPage } = useStore()
  const mine = currentProfile?.id || 'default'
  const hist = (watchHistory || []).filter((h) => (h.profileId || 'default') === mine)
  const going = hist.filter((h) => !isFinished(h) && watchPercent(h) > 0).slice(0, 8)
  const seenIds = new Set(hist.map((h) => `${h.mediaType}:${h.mediaId}`))
  const fresh = (watchlist || []).filter((w) => !seenIds.has(`${w.mediaType}:${w.mediaId}`)).slice(0, 8)
  const done = hist.filter((h) => isFinished(h)).slice(0, 8)

  function open(id: number | string, type: string, extra?: { season?: number; episode?: number; title?: string }) {
    setSelectedMedia({ id, type: type === 'movie' ? 'movie' : 'tv', season: extra?.season, episode: extra?.episode, title: extra?.title } as any)
    setCurrentPage('detail')
    onClose()
  }

  function Block({ title, rows }: { title: string; rows: { key: string; title: string; sub: string; poster?: string | null; onOpen: () => void }[] }) {
    return (
      <section>
        <h3>{title}</h3>
        {!rows.length && <p className="saved-empty">Nothing here</p>}
        {rows.map((r) => (
          <button key={r.key} type="button" className="saved-row" onClick={r.onOpen}>
            {r.poster ? <img src={art(r.poster)} alt="" /> : <span />}
            <div>
              <b>{r.title}</b>
              <small>{r.sub}</small>
            </div>
          </button>
        ))}
      </section>
    )
  }

  return (
    <div className="saved-back" onClick={onClose}>
      <aside className="saved-panel" onClick={(e) => e.stopPropagation()}>
        <header>
          <b>Saved</b>
          <button type="button" onClick={onClose}>Close</button>
        </header>
        <Block
          title="Continue"
          rows={going.map((h) => ({
            key: h.id,
            title: h.title || 'Title',
            sub: h.mediaType === 'tv' && h.season ? `S${h.season} E${h.episode || 1} · ${watchPercent(h)}%` : `${watchPercent(h)}%`,
            poster: h.posterPath,
            onOpen: () => open(h.mediaId, h.mediaType, h),
          }))}
        />
        <Block
          title="Not started"
          rows={fresh.map((w) => ({
            key: `${w.mediaType}-${w.mediaId}`,
            title: w.title,
            sub: w.mediaType === 'tv' ? 'Series' : 'Movie',
            poster: w.posterPath,
            onOpen: () => open(w.mediaId, w.mediaType, w),
          }))}
        />
        <Block
          title="Already watched"
          rows={done.map((h) => ({
            key: `d-${h.id}`,
            title: h.title || 'Title',
            sub: 'Watched',
            poster: h.posterPath,
            onOpen: () => open(h.mediaId, h.mediaType, h),
          }))}
        />
      </aside>
    </div>
  )
}
