import { useEffect, useMemo, useState } from 'react'
import { Search, UserRound } from 'lucide-react'
import { tmdb, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { anilist } from '../api/anilist'
import { useStore } from '../store'

type Hit = {
  source: 'tmdb' | 'anilist'
  id: number
  name: string
  image?: string
  job?: string
}

function mapTmdb(p: any): Hit {
  return {
    source: 'tmdb',
    id: p.id,
    name: p.name,
    image: p.profile_path ? `${PROFILE_URL}${p.profile_path}` : '',
    job: p.known_for_department,
  }
}

function mapStaff(s: any): Hit {
  return {
    source: 'anilist',
    id: s.id,
    name: s.name?.full || s.name?.userPreferred || 'Staff',
    image: s.image?.large,
    job: (s.primaryOccupations || []).join(' · ') || 'Anime / manga',
  }
}

export default function People() {
  const { setSelectedMedia, setCurrentPage } = useStore()
  const [q, setQ] = useState('Eiichiro Oda')
  const [tab, setTab] = useState<'all' | 'directors' | 'actors' | 'anime'>('all')
  const [hits, setHits] = useState<Hit[]>([])
  const [person, setPerson] = useState<any>(null)
  const [source, setSource] = useState<'tmdb' | 'anilist'>('anilist')
  const [loading, setLoading] = useState(false)

  async function run(term = q) {
    const query = term.trim()
    if (!query) return
    setLoading(true)
    setPerson(null)
    try {
      const [pr, staff] = await Promise.all([
        tmdb.searchPerson(query).catch(() => ({ results: [] })),
        anilist.searchStaff(query, 1, 16).catch(() => []),
      ])
      setHits([...(staff || []).map(mapStaff), ...(pr?.results || []).map(mapTmdb)])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('mfy-person')
      if (raw) {
        sessionStorage.removeItem('mfy-person')
        const hit = JSON.parse(raw)
        setQ(hit.name || q)
        open({ source: hit.source, id: hit.id, name: hit.name || '' })
        return
      }
    } catch {}
    run('Eiichiro Oda')
  }, [])

  async function open(hit: Hit) {
    setSource(hit.source)
    setLoading(true)
    try {
      setPerson(hit.source === 'tmdb' ? await tmdb.getPersonDetail(hit.id) : await anilist.getStaff(hit.id))
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (tab === 'directors') return hits.filter((h) => /direct/i.test(h.job || ''))
    if (tab === 'actors') return hits.filter((h) => h.source === 'tmdb' && /act/i.test(h.job || ''))
    if (tab === 'anime') return hits.filter((h) => h.source === 'anilist' || /anim|manga/i.test(h.job || ''))
    return hits
  }, [hits, tab])

  const worksTmdb = [...(person?.combined_credits?.cast || []), ...(person?.combined_credits?.crew || [])]
  const worksAni = person?.media?.edges || []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-1">People</h1>
      <p className="text-xs text-white/40 mb-4">Writers, directors, mangaka. Search Oda, Nolan, Miyazaki.</p>
      <form className="flex gap-2 mb-4" onSubmit={(e) => { e.preventDefault(); run() }}>
        <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <Search className="w-4 h-4 text-white/35" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none" placeholder="Eiichiro Oda" />
        </div>
        <button type="submit" className="h-11 px-4 rounded-xl bg-[#e50914] text-white text-sm font-semibold">Search</button>
      </form>
      <div className="flex gap-2 mb-5">
        {([['all', 'All'], ['directors', 'Directors'], ['actors', 'Actors'], ['anime', 'Anime & manga']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`h-8 px-3 rounded-full text-[11px] ${tab === id ? 'bg-[#e50914] text-white' : 'bg-white/[0.06] text-white/45'}`}>{label}</button>
        ))}
      </div>

      {person && (
        <section className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="flex gap-5">
            <div className="w-28 h-40 rounded-xl overflow-hidden bg-white/[0.06] flex-shrink-0">
              {source === 'tmdb' && person.profile_path
                ? <img src={`${PROFILE_URL}${person.profile_path}`} alt="" className="w-full h-full object-cover" />
                : person.image?.large
                  ? <img src={person.image.large} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-white/30"><UserRound /></div>}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{source === 'tmdb' ? person.name : person.name?.full}</h2>
              <p className="text-xs text-[#e50914] mt-1">{source === 'tmdb' ? person.known_for_department : (person.primaryOccupations || []).join(' · ')}</p>
              <p className="text-sm text-white/60 mt-3 max-h-32 overflow-y-auto">{(source === 'tmdb' ? person.biography : String(person.description || '').replace(/<[^>]+>/g, ' ')) || 'No bio.'}</p>
            </div>
          </div>
          {source === 'tmdb' && <FilmSpine person={person} onOpen={(w) => { setSelectedMedia({ id: w.id, type: w.media_type === 'tv' || w.first_air_date ? 'tv' : 'movie' }); setCurrentPage('detail') }} />}
          {source === 'tmdb' && <CareerScatter person={person} onOpen={(w) => { setSelectedMedia({ id: w.id, type: w.media_type === 'tv' || w.first_air_date ? 'tv' : 'movie' }); setCurrentPage('detail') }} />}
          <h3 className="text-sm text-white/70 mt-5 mb-3">Works</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {source === 'tmdb' && worksTmdb.filter((x: any, i: number, a: any[]) => a.findIndex((y) => y.id === x.id) === i).slice(0, 20).map((w: any) => (
              <button key={w.id} type="button" className="w-[110px] flex-shrink-0 text-left" onClick={() => { setSelectedMedia({ id: w.id, type: w.media_type === 'tv' || w.first_air_date ? 'tv' : 'movie' }); setCurrentPage('detail') }}>
                <div className="w-[110px] h-[165px] rounded-lg overflow-hidden bg-[#14141c]">{w.poster_path && <img src={`${POSTER_URL}${w.poster_path}`} alt="" className="w-full h-full object-cover" />}</div>
                <p className="text-[11px] text-white mt-1 truncate">{w.title || w.name}</p>
              </button>
            ))}
            {source === 'anilist' && worksAni.map((e: any) => (
              <button key={e.node.id} type="button" className="w-[110px] flex-shrink-0 text-left" onClick={() => setCurrentPage(e.node.type === 'MANGA' ? 'manga' : 'anime')}>
                <div className="w-[110px] h-[165px] rounded-lg overflow-hidden bg-[#14141c]">{e.node.coverImage?.large && <img src={e.node.coverImage.large} alt="" className="w-full h-full object-cover" />}</div>
                <p className="text-[11px] text-white mt-1 truncate">{e.node.title?.english || e.node.title?.romaji}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {loading && hits.length === 0 && Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] animate-pulse" />)}
        {filtered.map((h) => (
          <button key={`${h.source}-${h.id}`} type="button" className="text-left" onClick={() => open(h)}>
            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.05] mb-1.5">
              {h.image ? <img src={h.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-white/25"><UserRound /></div>}
            </div>
            <p className="text-[11px] text-white truncate">{h.name}</p>
            <p className="text-[10px] text-white/35 truncate">{h.job}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function yearOf(c: any) {
  return Number(String(c.release_date || c.first_air_date || '').slice(0, 4)) || 0
}

function FilmSpine({ person, onOpen }: { person: any; onOpen: (w: any) => void }) {
  const directed = [...(person?.movie_credits?.crew || []), ...(person?.tv_credits?.crew || [])]
    .filter((c: any) => c.job === 'Director' && (c.poster_path || c.title || c.name))
    .filter((c: any, i: number, a: any[]) => a.findIndex((y) => y.id === c.id) === i)
    .sort((a: any, b: any) => yearOf(a) - yearOf(b))
  if (!directed.length) return null
  return (
    <>
      <h3 className="text-sm text-white/70 mt-5 mb-3">Filmography</h3>
      <div className="dir-line">
      {directed.slice(0, 24).map((w: any) => (
        <button key={`${w.id}-${w.job}`} type="button" onClick={() => onOpen(w)}>
          {w.poster_path ? <img src={`${POSTER_URL}${w.poster_path}`} alt="" /> : <div style={{ width: 110, height: 165, borderRadius: 10, background: '#14141c' }} />}
          <small>{yearOf(w) || ''}</small>
          <b style={{ display: 'block', fontSize: 12, marginTop: 2 }}>{w.title || w.name}</b>
        </button>
      ))}
      </div>
    </>
  )
}

function CareerScatter({ person, onOpen }: { person: any; onOpen: (w: any) => void }) {
  const crew = person?.combined_credits?.crew || []
  const cast = person?.combined_credits?.cast || []
  const lanes = [
    { name: 'Directing', color: '#fff', items: crew.filter((c: any) => c.job === 'Director') },
    { name: 'Writing', color: '#c4b5fd', items: crew.filter((c: any) => c.department === 'Writing') },
    { name: 'Production', color: '#93c5fd', items: crew.filter((c: any) => c.department === 'Production') },
    { name: 'Acting', color: '#fca5a5', items: cast },
  ].map((lane) => ({
    ...lane,
    items: lane.items.filter((c: any, i: number, a: any[]) => yearOf(c) && a.findIndex((y) => y.id === c.id) === i),
  }))
  const years = lanes.flatMap((l) => l.items.map(yearOf)).filter(Boolean)
  if (years.length < 2) return null
  const min = Math.min(...years)
  const max = Math.max(...years)
  const span = Math.max(1, max - min)
  const w = 640
  const h = 168
  const padL = 78
  const padR = 12
  return (
    <div className="career">
      <h3>Career</h3>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Career by year">
        {lanes.map((lane, i) => {
          const y = 28 + i * 34
          return (
            <g key={lane.name}>
              <text x="0" y={y + 4} fill="#9aa4b2" fontSize="11">{lane.name}</text>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#ffffff18" />
              {lane.items.map((c: any) => {
                const x = padL + ((yearOf(c) - min) / span) * (w - padL - padR)
                return (
                  <circle key={`${lane.name}-${c.id}`} cx={x} cy={y} r="5" fill={lane.color} style={{ cursor: 'pointer' }} onClick={() => onOpen(c)}>
                    <title>{`${yearOf(c)} · ${c.title || c.name || ''}`}</title>
                  </circle>
                )
              })}
            </g>
          )
        })}
        <text x={padL} y={h - 6} fill="#8e8e93" fontSize="11">{min}</text>
        <text x={w - padR} y={h - 6} fill="#8e8e93" fontSize="11" textAnchor="end">{max}</text>
      </svg>
    </div>
  )
}
