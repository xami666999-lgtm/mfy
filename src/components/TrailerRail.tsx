import { useEffect, useState } from 'react'
import { tmdb, BACKDROP_URL, pickTrailer, trailerEmbed } from '../api/tmdb'

type Item = { id: number; type: 'movie' | 'tv'; title: string; backdrop?: string | null }

export function TrailerRail({ title, items }: { title: string; items: Item[] }) {
  const [clips, setClips] = useState<{ id: number; type: 'movie' | 'tv'; title: string; key: string; backdrop?: string | null }[]>([])
  const [play, setPlay] = useState<string | null>(null)

  useEffect(() => {
    const list = (items || []).filter((x) => x?.id).slice(0, 8)
    if (!list.length) { setClips([]); return }
    let dead = false
    Promise.all(list.map(async (item) => {
      try {
        const v = await tmdb.getVideos(item.type, item.id)
        const key = pickTrailer(v?.results)
        return key ? { ...item, key } : null
      } catch { return null }
    })).then((rows) => { if (!dead) setClips(rows.filter(Boolean) as any) })
    return () => { dead = true }
  }, [items.map((x) => `${x.type}:${x.id}`).join('|')])

  if (!clips.length) return null
  return (
    <section className="media-row">
      <div className="media-row-header"><h2 className="media-row-title">{title}</h2></div>
      <div className="tr-row">
        {clips.map((c) => (
          <button key={`${c.type}-${c.id}`} type="button" className="tr-card" onClick={() => setPlay(c.key)}>
            <img src={c.backdrop ? `${BACKDROP_URL}${c.backdrop}` : `https://i.ytimg.com/vi/${c.key}/hqdefault.jpg`} alt="" />
            <span>Trailer</span>
            <b>{c.title}</b>
          </button>
        ))}
      </div>
      {play && (
        <div className="tr-modal" onClick={() => setPlay(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe
              title="Trailer"
              src={trailerEmbed(play)}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
            <button type="button" onClick={() => setPlay(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  )
}
