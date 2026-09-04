import { useEffect, useState } from 'react'
import { POSTER_URL, tmdb } from '../api/tmdb'
import { useStore } from '../store'

const IDLE_MS = 5 * 60 * 1000

function posterOf(item: any) {
  return item?.poster_path ? `${POSTER_URL}${item.poster_path}` : ''
}

export default function IdleWall() {
  const { currentPage, setSelectedMedia, setCurrentPage } = useStore()
  const [on, setOn] = useState(false)
  const [rows, setRows] = useState<any[][]>([])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const bump = () => {
      setOn(false)
      clearTimeout(t)
      if (useStore.getState().currentPage === 'player') return
      t = setTimeout(() => setOn(true), IDLE_MS)
    }
    bump()
    const ev = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']
    ev.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    return () => {
      clearTimeout(t)
      ev.forEach((e) => window.removeEventListener(e, bump))
    }
  }, [currentPage])

  useEffect(() => {
    if (!on || rows.length) return
    Promise.all([
      tmdb.getPopular('movie').catch(() => ({ results: [] })),
      tmdb.getPopular('tv').catch(() => ({ results: [] })),
      tmdb.getTrending('all', 'week').catch(() => ({ results: [] })),
      tmdb.discoverTV({ with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc' }).catch(() => ({ results: [] })),
    ]).then(([m, tv, tr, an]) => {
      const pool = [...(m.results || []), ...(tv.results || []), ...(tr.results || []), ...(an.results || [])]
        .filter((x: any) => x.poster_path)
      const uniq: any[] = []
      const seen = new Set<string>()
      for (const x of pool) {
        const k = `${x.media_type || x.title || x.name}-${x.id}`
        if (seen.has(k)) continue
        seen.add(k)
        uniq.push(x)
      }
      const slice = (n: number) => {
        const start = n * 10
        const chunk = uniq.slice(start, start + 16)
        return chunk.concat(chunk)
      }
      setRows([slice(0), slice(1), slice(2), slice(3)])
    }).catch(() => {})
  }, [on, rows.length])

  if (!on || currentPage === 'player') return null

  function open(item: any) {
    const type = item.media_type === 'tv' || item.first_air_date || item.name ? 'tv' : 'movie'
    setSelectedMedia({ id: item.id, type, title: item.title || item.name } as any)
    setCurrentPage('detail')
    setOn(false)
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black"
      onClick={() => setOn(false)}
      onKeyDown={() => setOn(false)}
    >
      <style>{`
        @keyframes mfy-idle-l { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes mfy-idle-r { from { transform: translateX(-50%) } to { transform: translateX(0) } }
      `}</style>
      <div className="absolute inset-0 flex flex-col justify-center gap-4 rotate-[-8deg] scale-110 opacity-90">
        {rows.map((row, i) => (
          <div key={i} className="overflow-hidden">
            <div
              className="flex gap-3 w-max"
              style={{
                animation: `${i % 2 ? 'mfy-idle-r' : 'mfy-idle-l'} ${70 + i * 8}s linear infinite`,
              }}
            >
              {row.map((item, j) => (
                <button
                  key={`${item.id}-${j}`}
                  type="button"
                  className="w-[140px] h-[210px] rounded-lg overflow-hidden shrink-0 bg-[#111] border border-white/10"
                  onClick={(e) => { e.stopPropagation(); open(item) }}
                >
                  <img src={posterOf(item)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-8 left-0 right-0 text-center text-white/35 text-xs tracking-[0.3em]">MFY</div>
    </div>
  )
}
