import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function ProviderBrowse() {
  const { selectedProviderId, setSelectedProviderId, setSelectedMedia, setCurrentPage, tmdbApiKey } = useStore()
  const service = streamingServices.find((s) => s.id === selectedProviderId)
  const [tab, setTab] = useState<'movie' | 'tv'>('movie')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!service) {
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const d = await tmdb.discoverByProvider(tab, service.tmdbId, 1)
        if (!cancelled) setItems(d?.results || [])
      } catch {
        if (!cancelled) setItems([])
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [service, tab])

  function back() {
    setSelectedProviderId(null)
    setCurrentPage('home')
  }

  if (!service) {
    return (
      <div className="p-8">
        <button type="button" onClick={back} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p className="text-sm text-white/30 mt-6">No provider selected.</p>
      </div>
    )
  }

  return (
    <div className="p-8 page-fade-enter">
      <button type="button" onClick={back} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1 mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Board
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center overflow-hidden p-2">
          <img src={service.logo} alt="" className="max-w-full max-h-full object-contain" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight">{service.name}</h2>
          <p className="text-[11px] text-white/30">Popular titles · TMDB watch providers</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {(['movie', 'tv'] as const).map((t) => (
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
            {t === 'movie' ? 'Movies' : 'TV Shows'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-10">
          {items.map((item) => (
            <div
              key={item.id}
              className="poster-card w-full"
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedMedia({ id: item.id, type: tab })
                setCurrentPage('detail')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSelectedMedia({ id: item.id, type: tab })
                  setCurrentPage('detail')
                }
              }}
            >
              {item.poster_path ? (
                <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} loading="lazy" />
              ) : (
                <div className="poster-fallback">{item.title || item.name}</div>
              )}
              <div className="poster-overlay">
                <div className="poster-meta-title">{item.title || item.name}</div>
                <div className="poster-meta-sub">
                  {(item.release_date || item.first_air_date || '').slice(0, 4)}
                  {item.vote_average > 0 ? ` · ★ ${item.vote_average.toFixed(1)}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
