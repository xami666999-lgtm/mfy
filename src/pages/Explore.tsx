import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

const THEMES = [
  { id: 9715, name: 'Superhero' },
  { id: 818, name: 'Based on a novel' },
  { id: 12377, name: 'Time travel' },
  { id: 4565, name: 'Revenge' },
  { id: 6054, name: 'Coming of age' },
  { id: 10349, name: 'Survival' },
]

export default function Explore() {
  const { setSelectedMedia, setCurrentPage, watchHistory } = useStore()
  const [tab, setTab] = useState<'scene' | 'looks' | 'talk'>('scene')
  const [rows, setRows] = useState<Record<string, any[]>>({})

  useEffect(() => {
    Promise.all(THEMES.map(async (t) => {
      const d = await tmdb.discoverByKeyword('movie', t.id)
      return [t.name, d?.results || []] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: item.media_type === 'tv' ? 'tv' : 'movie' })
    setCurrentPage('detail')
  }

  const watchedIds = new Set(watchHistory.map((h) => h.mediaId))

  return (
    <div className="p-8 pb-20 text-white">
      <h1 className="text-2xl font-display font-bold mb-2">Explore</h1>
      <p className="text-white/45 text-sm mb-6">Concept discovery from TMDB keywords. Themes are sourced, not invented.</p>
      <div className="flex gap-2 mb-8">
        {[
          ['scene', 'Enter the scene'],
          ['looks', 'Other views'],
          ['talk', 'Stories that talk'],
        ].map(([id, label]) => (
          <button key={id} className={`px-4 py-2 rounded-full text-sm ${tab === id ? 'bg-white text-black' : 'bg-white/10'}`} onClick={() => setTab(id as any)}>{label}</button>
        ))}
      </div>

      {tab === 'scene' && THEMES.map((t) => (
        <section key={t.id} className="mb-8">
          <h2 className="text-sm uppercase tracking-widest text-white/40 mb-3">{t.name}</h2>
          <div className="flex gap-3 overflow-x-auto">
            {(rows[t.name] || []).slice(0, 12).map((m: any) => (
              <button key={m.id} className="w-28 flex-shrink-0 text-left" onClick={() => open(m)}>
                {m.poster_path && <img src={`${POSTER_URL}${m.poster_path}`} className="w-28 h-40 object-cover rounded-lg" alt="" />}
                <div className="text-xs mt-1 truncate">{m.title}</div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {tab === 'looks' && (
        <p className="text-white/60 text-sm max-w-xl">Related titles share a TMDB keyword with a title you open. Open any poster on Enter the scene, then use Themes on the title page.</p>
      )}

      {tab === 'talk' && (
        <div>
          <p className="text-white/60 text-sm mb-6">Unwatched titles in themes that also appear in your history — when history is empty this shows popular theme rows.</p>
          {THEMES.map((t) => (
            <section key={t.id} className="mb-8">
              <h2 className="text-sm uppercase tracking-widest text-white/40 mb-1">{t.name}</h2>
              <p className="text-xs text-white/35 mb-3">Also found in titles people watch in this theme on TMDB.</p>
              <div className="flex gap-3 overflow-x-auto">
                {(rows[t.name] || []).filter((m: any) => !watchedIds.has(m.id)).slice(0, 12).map((m: any) => (
                  <button key={m.id} className="w-28 flex-shrink-0 text-left" onClick={() => open(m)}>
                    {m.poster_path && <img src={`${POSTER_URL}${m.poster_path}`} className="w-28 h-40 object-cover rounded-lg" alt="" />}
                    <div className="text-xs mt-1 truncate">{m.title}</div>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
