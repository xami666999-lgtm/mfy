import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL, PROFILE_URL } from '../api/tmdb'
import { useStore } from '../store'

export default function Constellation() {
  const { selectedMedia, selectedPersonId, setSelectedMedia, setSelectedPersonId, setCurrentPage } = useStore()
  const [nodes, setNodes] = useState<any[]>([])

  useEffect(() => {
    async function run() {
      const out: any[] = []
      if (selectedMedia) {
        const d = selectedMedia.type === 'tv' ? await tmdb.getTVDetail(selectedMedia.id) : await tmdb.getMovieDetail(selectedMedia.id)
        out.push({ kind: 'title', id: selectedMedia.id, name: d?.title || d?.name, img: d?.poster_path })
        for (const c of (d?.credits?.cast || []).slice(0, 6)) {
          out.push({ kind: 'person', id: c.id, name: c.name, img: c.profile_path, via: 'cast' })
        }
        for (const c of (d?.credits?.crew || []).filter((x: any) => /Director|Writer/i.test(x.job)).slice(0, 4)) {
          out.push({ kind: 'person', id: c.id, name: c.name, img: c.profile_path, via: c.job })
        }
        for (const s of (d?.similar?.results || []).slice(0, 6)) {
          out.push({ kind: 'title', id: s.id, name: s.title || s.name, img: s.poster_path, type: s.media_type || selectedMedia.type, via: 'similar' })
        }
      } else if (selectedPersonId) {
        const p = await tmdb.getPerson(selectedPersonId)
        out.push({ kind: 'person', id: p.id, name: p.name, img: p.profile_path })
        for (const c of (p.combined_credits?.cast || []).slice(0, 12)) {
          out.push({ kind: 'title', id: c.id, name: c.title || c.name, img: c.poster_path, type: c.media_type, via: 'filmography' })
        }
      }
      setNodes(out)
    }
    run()
  }, [selectedMedia, selectedPersonId])

  return (
    <div className="p-8 pb-20 text-white">
      <h1 className="text-2xl font-display font-bold">Constellation</h1>
      <p className="text-white/45 text-sm mt-2 mb-8">Title → people → other titles. Data from TMDB credits and similar.</p>
      <div className="flex flex-wrap gap-4">
        {nodes.map((n, i) => (
          <button
            key={i}
            className="w-28 text-left"
            onClick={() => {
              if (n.kind === 'person') {
                setSelectedPersonId(n.id)
                setCurrentPage('person')
              } else {
                setSelectedMedia({ id: n.id, type: n.type === 'tv' ? 'tv' : 'movie' })
                setCurrentPage('detail')
              }
            }}
          >
            {n.img ? (
              <img src={`${n.kind === 'person' ? PROFILE_URL : POSTER_URL}${n.img}`} className="w-28 h-36 object-cover rounded-lg" alt="" />
            ) : <div className="w-28 h-36 bg-white/5 rounded-lg" />}
            <div className="text-xs mt-1 truncate">{n.name}</div>
            {n.via && <div className="text-[10px] text-white/35">{n.via}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
