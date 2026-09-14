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
    <div className="page-fade-enter">
      <div className="relative h-44 mb-6 overflow-hidden" style={{ background: service.color || '#111' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
        <div className="relative z-10 h-full flex items-end px-8 pb-5 gap-4">
          <button type="button" onClick={back} className="absolute top-4 left-6 text-xs text-white/70 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Board
          </button>
          <img src={service.logo} alt="" className="h-10 object-contain" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
            <p className="text-[11px] text-white/50">Top 10 · catalog only · Fonte: TMDB</p>
          </div>
        </div>
      </div>
      <div className="px-8">
      {items.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Top 10</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {items.slice(0, 10).map((item, i) => (
              <button key={item.id} type="button" className="shrink-0 w-28 text-left" onClick={() => { setSelectedMedia({ id: item.id, type: tab }); setCurrentPage('detail') }}>
                <div className="relative">
                  <span className="absolute -left-1 bottom-0 text-5xl font-black text-white/80">{i + 1}</span>
                  {item.poster_path ? <img src={`${POSTER_URL}${item.poster_path}`} alt="" className="w-28 h-40 object-cover rounded-lg ml-6" /> : null}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

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
    </div>
  )
}
