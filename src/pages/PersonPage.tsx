import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { tmdb, PROFILE_URL, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

export default function PersonPage() {
  const { selectedPersonId, setCurrentPage, setSelectedMedia, setSelectedPersonId } = useStore()
  const [p, setP] = useState<any>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!selectedPersonId) return
    tmdb.getPerson(selectedPersonId).then((d) => setP(d)).catch((e) => setErr(e.message))
  }, [selectedPersonId])

  if (!selectedPersonId) return <p className="p-8 text-white/40">No person selected.</p>
  if (err) return <p className="p-8">{err}</p>
  if (!p) return <p className="p-8 text-white/40">Loading…</p>

  const credits = p.combined_credits?.cast || []
  const crew = p.combined_credits?.crew || []
  const known = [...credits].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 24)
  const years = Array.from(new Set(
    [...credits, ...crew]
      .map((c: any) => (c.release_date || c.first_air_date || '').slice(0, 4))
      .filter((y: string) => y)
  )).sort()

  function openTitle(c: any) {
    const type = c.media_type === 'tv' || c.first_air_date ? 'tv' : 'movie'
    setSelectedMedia({ id: c.id, type })
    setCurrentPage('detail')
  }

  return (
    <div className="p-8 pb-20 text-white">
      <button className="text-sm text-white/50 mb-6" onClick={() => setCurrentPage('home')}><ArrowLeft className="inline w-4 h-4" /> Back</button>
      <div className="flex gap-8">
        {p.profile_path && <img src={`${PROFILE_URL}${p.profile_path}`} alt="" className="w-40 h-52 object-cover rounded-xl" />}
        <div>
          <h1 className="text-3xl font-bold font-display">{p.name}</h1>
          <p className="text-white/45 text-sm mt-1">{p.known_for_department} {p.birthday ? `· ${p.birthday}` : ''}</p>
          <p className="text-white/70 text-sm mt-4 max-w-2xl leading-relaxed">{p.biography || 'No biography from TMDB.'}</p>
        </div>
      </div>
      <h2 className="mt-10 mb-3 text-sm tracking-widest uppercase text-white/40">Known for</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {known.map((c: any) => (
          <button key={`${c.media_type}-${c.id}-${c.credit_id}`} className="w-28 flex-shrink-0 text-left" onClick={() => openTitle(c)}>
            {c.poster_path ? <img src={`${POSTER_URL}${c.poster_path}`} className="w-28 h-40 object-cover rounded-lg" alt="" /> : <div className="w-28 h-40 bg-white/5 rounded-lg" />}
            <div className="text-xs mt-1 truncate">{c.title || c.name}</div>
          </button>
        ))}
      </div>
      <h2 className="mt-10 mb-3 text-sm tracking-widest uppercase text-white/40">Career timeline</h2>
      <div className="flex flex-wrap gap-2">
        {years.map((y) => <span key={y} className="px-2 py-1 rounded bg-white/5 text-xs text-white/70">{y}</span>)}
      </div>
      <div className="mt-6 space-y-2">
        {[...credits, ...crew].slice(0, 40).map((c: any, i: number) => (
          <button key={i} className="block text-left text-sm text-white/70 hover:text-white" onClick={() => openTitle(c)}>
            {(c.release_date || c.first_air_date || '').slice(0, 4) || '—'} · {c.title || c.name} · {c.character || c.job || c.department}
          </button>
        ))}
      </div>
      <button className="mt-8 text-sm text-white/50" onClick={() => { setSelectedPersonId(selectedPersonId); setCurrentPage('constellation') }}>Open constellation</button>
    </div>
  )
}
