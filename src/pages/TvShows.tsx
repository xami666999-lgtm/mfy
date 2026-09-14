import { useEffect, useState } from 'react'
import { tmdb } from '../api/tmdb'
import { useStore } from '../store'
import { MediaShelf } from '../components/MediaShelf'
import CineHero from '../components/CineHero'
import { streamingServices } from '../api/streaming'
import { isFinished } from '../lib/watchProgress'

const GENRES = [
  { id: 10759, name: 'Action & Adventure' }, { id: 16, name: 'Animation' }, { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' }, { id: 99, name: 'Documentary' }, { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' }, { id: 10762, name: 'Kids' }, { id: 9648, name: 'Mystery' },
  { id: 10764, name: 'Reality' }, { id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' }, { id: 10768, name: 'War & Politics' },
]

export default function TvShows() {
  const { setSelectedMedia, setCurrentPage, setSelectedProviderId, watchHistory } = useStore()
  const [popular, setPopular] = useState<any[]>([])
  const [airing, setAiring] = useState<any[]>([])
  const [top, setTop] = useState<any[]>([])
  const [rows, setRows] = useState<Record<number, any[]>>({})

  function open(item: any) {
    setSelectedMedia({ id: item.id, type: 'tv', season: item.season, episode: item.episode })
    setCurrentPage('detail')
  }

  useEffect(() => {
    Promise.all([1, 2, 3].map((n) => tmdb.discoverTV({ page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] })))).then((all) => {
      const list = all.flatMap((d: any) => d?.results || [])
      const seen = new Set()
      setPopular(list.filter((x: any) => x && !seen.has(x.id) && seen.add(x.id)))
    })
    tmdb.getOnTheAir().then((d) => setAiring(d?.results || [])).catch(() => setAiring([]))
    tmdb.getTopRated('tv').then((d) => setTop(d?.results || [])).catch(() => setTop([]))
    Promise.all(GENRES.map(async (g) => {
      const pages = await Promise.all([1, 2].map((n) => tmdb.discoverTV({ with_genres: String(g.id), page: String(n), sort_by: 'popularity.desc' }).catch(() => ({ results: [] }))))
      return [g.id, pages.flatMap((d: any) => d?.results || [])] as const
    })).then((pairs) => setRows(Object.fromEntries(pairs)))
  }, [])

  const continueTv = watchHistory.filter((h) => h.mediaType === 'tv' && !isFinished(h)).slice(0, 16).map((h) => ({
    id: h.mediaId, name: h.title, poster_path: h.posterPath, media_type: 'tv', season: h.season, episode: h.episode,
  }))

  return (
    <div className="board page-fade-enter">
      <CineHero items={airing.length ? airing : popular} kicker="SERIES" mediaType="tv" />
      <div className="board-content px-6 pt-6">
        <section className="media-row">
          <div className="media-row-header"><h2 className="media-row-title">Providers</h2></div>
          <div className="scroll-row">
            {streamingServices.slice(0, 14).map((s) => (
              <button key={s.id} type="button" className="mfy-brand-tile shrink-0 h-16 w-28 rounded-xl border border-white/10 bg-white/5 grid place-items-center px-2" onClick={() => { setSelectedProviderId(s.id); setCurrentPage('provider') }}>
                <img src={s.logo} alt={s.name} className="max-h-8 object-contain" />
              </button>
            ))}
          </div>
        </section>
        {continueTv.length > 0 && <MediaShelf title="Continue Watching" items={continueTv} onOpen={open} />}
        <MediaShelf title="Top 10 Series" items={(airing.length ? airing : popular).slice(0, 10)} onOpen={open} />
        <MediaShelf title="Airing Now" items={airing} onOpen={open} />
        <MediaShelf title="Popular" items={popular} onOpen={open} />
        <MediaShelf title="Top Rated" items={top} onOpen={open} />
        {GENRES.map((g) => (
          <MediaShelf key={g.id} title={g.name} items={rows[g.id] || []} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
