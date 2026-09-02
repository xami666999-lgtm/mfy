import { useEffect, useState } from 'react'
import { useStore } from '../store'

type Kind = 'manga' | 'novels' | 'comics' | 'books' | 'youtube' | 'music'

const FILES: Record<Kind, string> = {
  manga: 'manga.json',
  novels: 'mangayomi.json',
  comics: 'manga.json',
  books: 'mangayomi.json',
  youtube: 'noutube.json',
  music: 'eclipse-music.json',
}

export default function CatalogSection({ kind, title }: { kind: Kind; title: string }) {
  const { setCurrentPage, setCurrentStreamUrl } = useStore()
  const [items, setItems] = useState<any[]>([])
  const [tab, setTab] = useState<'manga' | 'novels'>(kind === 'novels' ? 'novels' : 'manga')

  useEffect(() => {
    const file = kind === 'manga' || kind === 'novels' ? (tab === 'novels' ? 'mangayomi.json' : 'manga.json') : FILES[kind]
    fetch(`./data/${file}`)
      .then((r) => r.json())
      .then((d) => {
        if (kind === 'youtube') setItems(d.videos || [])
        else if (kind === 'music') setItems(d.tracks || [])
        else setItems(d.manga || [])
      })
      .catch(() => setItems([]))
  }, [kind, tab])

  const wide = kind === 'youtube' || kind === 'music'

  function open(item: any) {
    if (kind === 'youtube') {
      setCurrentStreamUrl(`https://www.youtube.com/embed/${item.videoId}`)
      setCurrentPage('player')
      return
    }
    if (kind === 'music' && item.url) {
      setCurrentStreamUrl(item.url)
      setCurrentPage('player')
    }
  }

  return (
    <div className="p-6 page-fade-enter">
      <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
      <p className="text-xs text-white/35 mb-5">MFY catalog · posters from local library</p>

      {(kind === 'manga' || kind === 'novels') && (
        <div className="flex gap-2 mb-5">
          {(['manga', 'novels'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-8 px-3 rounded-full text-[11px] font-semibold ${tab === t ? 'bg-[#FF1493] text-white' : 'bg-white/[0.06] text-white/50'}`}
            >
              {t === 'manga' ? 'Manga' : 'Novels'}
            </button>
          ))}
        </div>
      )}

      <div className={wide ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4'}>
        {items.map((item, i) => {
          const img = item.coverImage || item.artwork || item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[item.videoThumbnails.length - 1]?.url
          const name = item.title
          const sub = item.artist || item.author || item.genres?.slice?.(0, 2).join(' · ') || item.status
          return (
            <button key={item.id || item.videoId || i} type="button" className="text-left group" onClick={() => open(item)}>
              <div className={`rounded-xl overflow-hidden bg-[#14141c] border border-white/[0.06] ${wide ? 'aspect-video' : 'aspect-[2/3]'}`}>
                {img ? <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" /> : <div className="w-full h-full grid place-items-center text-white/25 text-xs p-2">{name}</div>}
              </div>
              <p className="text-[12px] text-white mt-2 truncate">{name}</p>
              {sub && <p className="text-[10px] text-white/40 truncate">{sub}</p>}
            </button>
          )
        })}
      </div>
      {items.length === 0 && (
        <div className="empty-state">
          <p className="text-sm mb-1">Nothing in this section yet</p>
          <p className="text-xs text-white/35">Data files live in the app’s /data folder.</p>
        </div>
      )}
    </div>
  )
}
