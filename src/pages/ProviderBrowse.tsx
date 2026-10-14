import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { streamingServices } from '../api/streaming'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function ProviderBrowse() {
  const { selectedProviderId, setSelectedProviderId, setSelectedMedia, setCurrentPage } = useStore()
  const service = streamingServices.find((s) => s.id === selectedProviderId)
  const [tab, setTab] = useState<'movie' | 'tv'>('movie')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!service) { setItems([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    tmdb.discoverByProvider(tab, service.tmdbId, 1)
      .then((d) => { if (!cancelled) setItems(d?.results || []) })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [service, tab])

  function back() { setSelectedProviderId(null); setCurrentPage('home') }
  if (!service) return <div className="p-8"><button type="button" onClick={back}>Back</button></div>

  const rows = items.filter((x) => x.poster_path).sort((a, b) => String(a.release_date || a.first_air_date || '').localeCompare(String(b.release_date || b.first_air_date || '')))

  return (
    <div className="min-h-full pb-16">
      <div className="flex items-center gap-4 px-6 h-16 border-b border-white/10" style={{ background: service.color }}>
        <button type="button" onClick={back} className="text-white"><ArrowLeft className="w-4 h-4" /></button>
        {service.logo ? <img src={service.logo} alt={service.name} className="h-7 w-auto max-w-[140px] object-contain" /> : <b className="text-white">{service.name}</b>}
        <span className="text-sm text-white/80">On {service.name}</span>
      </div>
      <div className="px-6 md:px-10 pt-6">
        <p className="text-[11px] tracking-[0.16em] text-white/40 mb-2">WHAT'S ON</p>
        <p className="text-sm text-white/75 max-w-2xl mb-5">Movies and shows on {service.name}, oldest first so you can watch through in order.</p>
        <div className="flex gap-2 mb-5">
          {(['movie', 'tv'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn('h-8 px-3 rounded-full text-xs font-semibold', tab === t ? 'bg-white text-black' : 'bg-white/10 text-white')}>{t === 'movie' ? 'Movies' : 'Shows'}</button>
          ))}
        </div>
        {loading ? <p className="text-white/40 text-sm">Loading…</p> : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {rows.map((item, i) => (
              <button key={item.id} type="button" className="text-left" onClick={() => { setSelectedMedia({ id: item.id, type: tab }); setCurrentPage('detail') }}>
                <span className="relative block">
                  <img src={`${POSTER_URL}${item.poster_path}`} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover rounded-lg" />
                  <b className="absolute left-1.5 bottom-1.5 text-white text-sm drop-shadow">{i + 1}</b>
                </span>
                <p className="mt-1 text-[11px] text-white/75 truncate">{item.title || item.name}</p>
                <p className="text-[10px] text-white/35">{String(item.release_date || item.first_air_date || '').slice(0, 4)}</p>
              </button>
            ))}
            {!rows.length && <p className="text-white/30 text-sm col-span-full">Nothing on {service.name} right now.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
