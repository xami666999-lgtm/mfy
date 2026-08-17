import { useEffect, useState } from 'react'
import { ArrowLeft, Play } from 'lucide-react'
import { franchises, loadFranchise, type FranchiseItem } from '../api/franchises'
import { POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function Franchise() {
  const { selectedFranchiseId, setSelectedFranchiseId, setSelectedMedia, setCurrentPage } = useStore()
  const franchise = franchises.find((f) => f.id === selectedFranchiseId) || null
  const [tab, setTab] = useState<'all' | 'movie' | 'tv'>('all')
  const [items, setItems] = useState<FranchiseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!franchise) {
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    loadFranchise(franchise)
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this franchise.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [franchise])

  function back() {
    setSelectedFranchiseId(null)
    setCurrentPage('home')
  }

  if (!franchise) {
    return (
      <div className="p-8">
        <button type="button" onClick={back} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p className="text-sm text-white/30 mt-6">No franchise selected.</p>
      </div>
    )
  }

  const filtered = tab === 'all' ? items : items.filter((i) => i.mediaType === tab)

  return (
    <div className="page-fade-enter min-h-full">
      <button type="button" onClick={back} className="absolute top-4 left-5 z-10 text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
        <ArrowLeft className="w-3.5 h-3.5" /> Board
      </button>

      <div
        className="relative h-56 sm:h-64 flex items-end p-6 md:p-10 bg-cover bg-center"
        style={{
          backgroundImage:
            items.find((i) => i.backdropPath)?.backdropPath
              ? `linear-gradient(to bottom, rgba(8,8,14,0.2), rgba(8,8,14,0.95)), url(${POSTER_URL.replace('/w500', '/w1280')}${items.find((i) => i.backdropPath)?.backdropPath})`
              : undefined,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center overflow-hidden p-3 flex-shrink-0" style={{ background: franchise.color }}>
            <img src={franchise.logo} alt="" className="max-w-full max-h-full object-contain" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight" style={{ color: franchise.color }}>{franchise.name}</h2>
            <p className="text-xs text-white/40 mt-1">{franchise.tagline}</p>
            <p className="text-[11px] text-white/25 mt-2">{items.length} titles · in chronological order</p>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 pb-12">
        <div className="flex gap-2 mb-5">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'h-8 px-3 rounded-lg text-xs border transition-all',
                tab === t
                  ? 'bg-[#FF1493]/15 border-[#FF1493]/35 text-[#FF1493]'
                  : 'border-white/[0.06] text-white/35 hover:text-white/55'
              )}
            >
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
            </button>
          ))}
        </div>

        {error && <div className="error-banner mb-4">{error}</div>}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-10">
            {filtered.map((item) => (
              <div
                key={`${item.mediaType}-${item.id}`}
                className="poster-card w-full"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedMedia({ id: item.id, type: item.mediaType })
                  setCurrentPage('detail')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedMedia({ id: item.id, type: item.mediaType })
                    setCurrentPage('detail')
                  }
                }}
              >
                {item.posterPath ? (
                  <img src={`${POSTER_URL}${item.posterPath}`} alt={item.title} loading="lazy" />
                ) : (
                  <div className="poster-fallback">{item.title}</div>
                )}
                <div className="poster-play"><Play size={18} fill="#fff" /></div>
                <div className="poster-overlay">
                  <div className="poster-meta-title">{item.title}</div>
                  <div className="poster-meta-sub">
                    {(item.releaseDate || '').slice(0, 4)}
                    {item.voteAverage > 0 ? ` · ★ ${item.voteAverage.toFixed(1)}` : ''}
                  </div>
                </div>
                {item.voteAverage > 0 && (
                  <div className="imdb-badge" title="Rating">
                    <span className="imdb-badge-label">IMDb</span>
                    <span className="imdb-badge-score">{Number(item.voteAverage).toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
            {!filtered.length && (
              <p className="text-xs text-white/25 col-span-full py-10 text-center">No titles found for this franchise.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}