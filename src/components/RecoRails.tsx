import { useEffect, useState } from 'react'
import { tmdb, POSTER_URL } from '../api/tmdb'
import { useStore } from '../store'

export default function RecoRails() {
  const { watchHistory, setSelectedMedia, setCurrentPage, hiddenTitles } = useStore()
  const [because, setBecause] = useState<{ seed: string; items: any[] } | null>(null)
  const [night, setNight] = useState<any[]>([])

  useEffect(() => {
    const last = watchHistory[0]
    if (!last) return
    const type = last.mediaType
    const fn = type === 'tv' ? tmdb.getTVDetail : tmdb.getMovieDetail
    fn(last.mediaId).then((d) => {
      const recs = (d?.recommendations?.results || d?.similar?.results || []).filter(
        (x: any) => !hiddenTitles.some((h) => h.mediaId === x.id)
      )
      setBecause({ seed: last.title, items: recs.slice(0, 14) })
      setNight(recs.slice(0, 8))
    })
  }, [watchHistory, hiddenTitles])

  function open(item: any, fallback: 'movie' | 'tv') {
    setSelectedMedia({ id: item.id, type: item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : fallback })
    setCurrentPage('detail')
  }

  if (!because?.items?.length) return null
  return (
    <>
      <section className="media-row">
        <div className="media-row-header">
          <h2 className="media-row-title">Because you watched {because.seed}</h2>
        </div>
        <div className="scroll-row">
          {because.items.map((m: any) => (
            <button key={m.id} className="poster-card" onClick={() => open(m, watchHistory[0]?.mediaType || 'movie')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : <div className="poster-fallback">{m.title || m.name}</div>}
              <div className="poster-overlay"><div className="poster-meta-title">{m.title || m.name}</div></div>
            </button>
          ))}
        </div>
      </section>
      <section className="media-row">
        <div className="media-row-header">
          <h2 className="media-row-title">Worth your night</h2>
        </div>
        <p className="px-1 text-xs text-white/40 mb-2">Because you watched {because.seed} — TMDB similar / recommendations, not invented reviews.</p>
        <div className="scroll-row">
          {night.map((m: any) => (
            <button key={m.id} className="poster-card" onClick={() => open(m, watchHistory[0]?.mediaType || 'movie')}>
              {m.poster_path ? <img src={`${POSTER_URL}${m.poster_path}`} alt="" /> : <div className="poster-fallback">{m.title || m.name}</div>}
              <div className="poster-overlay"><div className="poster-meta-title">{m.title || m.name}</div></div>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
