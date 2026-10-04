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
        <ArrowLeft className="w-3.5 h-3.5" /> Home
      </button>

      <div className="prov-hero" style={{ background: service.color }}>
        <div>
          {service.logo
            ? <img src={service.logo} alt="" />
            : <h2>{service.name}</h2>}
          <p className="text-[12px] text-white/70 mt-2 mb-0">Popular on {service.name}</p>
        </div>
        <div className="flex gap-2">
          {(['movie', 'tv'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'h-9 px-4 rounded-full text-sm font-semibold',
                tab === t ? 'bg-white text-black' : 'bg-black/30 text-white'
              )}
            >
              {t === 'movie' ? 'Movies' : 'Series'}
            </button>
          ))}
        </div>
      </div>

      {!loading && items.length > 0 && (
        <section className="mb-8">
          <h3 className="nv-kicker">{service.name} Top 10</h3>
          <div className="bill-top">
            {items.slice(0, 10).map((item, i) => (
              <button
                key={item.id}
                type="button"
                className="bill-rank"
                onClick={() => {
                  setSelectedMedia({ id: item.id, type: tab })
                  setCurrentPage('detail')
                }}
              >
                {item.poster_path
                  ? <img src={`${POSTER_URL}${item.poster_path}`} alt={item.title || item.name} />
                  : <img alt="" src="" style={{ background: '#222' }} />}
                {item.vote_average > 0 && <em>★ {Number(item.vote_average).toFixed(1)}</em>}
                <b>{i + 1}</b>
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-10">
          {items.slice(10).map((item) => (
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
