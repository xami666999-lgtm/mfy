import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { franchises, loadFranchise, type FranchiseItem } from '../api/franchises'
import { POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const ORDERS: Record<string, string> = {
  marvel: 'Watch in release order. That is the Disney+ Marvel order: Phase 1, then 2, 3, 4, 5.',
  'star-wars': 'Watch in release order, the same way Disney+ lists Star Wars: originals, prequels, then the new films and shows.',
  'harry-potter': 'Watch the films in release order, then the Fantastic Beasts films.',
  lotr: 'Watch The Lord of the Rings first, then The Hobbit.',
  hobbit: 'Watch The Hobbit films in release order.',
  dc: 'Watch in release order.',
}

function phaseOf(franchiseId: string, date: string) {
  if (franchiseId !== 'marvel' || !date) return ''
  const year = Number(date.slice(0, 4))
  if (year <= 2012) return 'Phase 1'
  if (year <= 2015) return 'Phase 2'
  if (year <= 2019) return 'Phase 3'
  if (year <= 2022) return 'Phase 4'
  if (year <= 2025) return 'Phase 5'
  return 'Phase 6'
}

export default function Franchise() {
  const { selectedFranchiseId, setSelectedFranchiseId, setSelectedMedia, setCurrentPage } = useStore()
  const franchise = franchises.find((f) => f.id === selectedFranchiseId) || null
  const [tab, setTab] = useState<'all' | 'movie' | 'tv'>('all')
  const [items, setItems] = useState<FranchiseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!franchise) { setItems([]); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError('')
    loadFranchise(franchise)
      .then((list) => { if (!cancelled) setItems(list) })
      .catch(() => { if (!cancelled) setError('Could not load this franchise.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [franchise])

  function back() {
    setSelectedFranchiseId(null)
    setCurrentPage('home')
  }

  if (!franchise) {
    return (
      <div className="p-8">
        <button type="button" onClick={back} className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
        <p className="text-sm text-white/30 mt-6">No franchise selected.</p>
      </div>
    )
  }

  const filtered = (tab === 'all' ? items : items.filter((i) => i.mediaType === tab))
    .slice()
    .sort((a, b) => String(a.releaseDate || '').localeCompare(String(b.releaseDate || '')))
  const logo = franchise.id === 'marvel' ? './logos/marvel-word.svg' : franchise.logo

  return (
    <div className="page-fade-enter min-h-full pb-16">
      <div className="flex items-center gap-4 px-6 h-16 border-b border-white/10" style={{ background: franchise.color }}>
        <button type="button" onClick={back} className="text-white/80 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
        {logo ? <img src={logo} alt={franchise.name} className="h-7 w-auto max-w-[140px] object-contain" /> : <b className="text-white">{franchise.name}</b>}
        <span className="text-sm text-white/80">{franchise.tagline}</span>
      </div>

      <div className="px-6 md:px-10 pt-6">
        <p className="text-[11px] tracking-[0.16em] text-white/40 mb-2">WATCH ORDER</p>
        <p className="text-sm text-white/75 max-w-2xl mb-5">{ORDERS[franchise.id] || `Watch ${franchise.name} in release order.`}</p>
        <div className="flex gap-2 mb-5">
          {(['all', 'movie', 'tv'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn('h-8 px-3 rounded-full text-xs font-semibold', tab === t ? 'bg-white text-black' : 'bg-white/10 text-white')}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Shows'}
            </button>
          ))}
        </div>
        {error && <div className="error-banner mb-4">{error}</div>}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.map((item, i) => {
              const phase = phaseOf(franchise.id, item.releaseDate || '')
              const showPhase = phase && phase !== phaseOf(franchise.id, filtered[i - 1]?.releaseDate || '')
              return (
                <div key={`${item.mediaType}-${item.id}`} className="contents">
                  {showPhase && <p className="col-span-full text-xs text-white/45 mt-2">{phase}</p>}
                  <button type="button" className="text-left" onClick={() => { setSelectedMedia({ id: item.id, type: item.mediaType }); setCurrentPage('detail') }}>
                    <span className="relative block">
                      {item.posterPath ? <img src={`${POSTER_URL}${item.posterPath}`} alt={item.title} loading="lazy" className="w-full aspect-[2/3] object-cover rounded-lg" /> : <span className="block aspect-[2/3] rounded-lg bg-white/10" />}
                      <b className="absolute left-1.5 bottom-1.5 text-white text-sm drop-shadow">{i + 1}</b>
                    </span>
                    <p className="mt-1 text-[11px] text-white/75 truncate">{item.title}</p>
                    <p className="text-[10px] text-white/35">{(item.releaseDate || '').slice(0, 4)}</p>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
