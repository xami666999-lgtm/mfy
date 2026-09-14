import { useEffect, useState } from 'react'
import { Play, Plus, Check, Info, EyeOff } from 'lucide-react'
import { tmdb, BACKDROP_URL } from '../api/tmdb'
import { titleLogoFromDetail } from '../api/blackhole'
import { titleOf } from './MediaShelf'
import { useStore } from '../store'
import { getPlayerUrl } from '../api/vidy'

export default function CineHero({
  items,
  kicker,
  mediaType,
}: {
  items: any[]
  kicker: string
  mediaType: 'movie' | 'tv' | 'anime'
}) {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl, addToWatchlist, removeFromWatchlist, isInWatchlist, watchHistory } = useStore()
  const pool = (items || []).filter((x) => x && (x.backdrop_path || x.poster_path)).slice(0, 8)
  const [idx, setIdx] = useState(0)
  const [detail, setDetail] = useState<any>(null)
  const [hidden, setHidden] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mfy-hidden-' + mediaType) || '[]') } catch { return [] }
  })
  const item = pool.filter((x) => !hidden.includes(String(x.id)))[idx] || pool[0]
  const kind = mediaType === 'movie' ? 'movie' : 'tv'

  useEffect(() => {
    if (!item?.id) return
    const fn = (item.media_type === 'movie' || mediaType === 'movie') ? tmdb.getMovieDetail : tmdb.getTVDetail
    fn(item.id).then(setDetail).catch(() => setDetail(null))
  }, [item?.id, mediaType])

  if (!item) return null
  const hist = watchHistory.find((h) => String(h.mediaId) === String(item.id))
  const age =
    detail?.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US')?.rating
    || detail?.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US')?.release_dates?.find((x: any) => x.certification)?.certification
    || ''

  function play() {
    setSelectedMedia({ id: item.id, type: kind, isAnime: mediaType === 'anime', season: hist?.season || 1, episode: hist?.episode || 1 } as any)
    setCurrentStreamUrl(getPlayerUrl((localStorage.getItem('mfy-player-engine') as any) || 'playtorrio', kind, item.id, hist?.season || 1, hist?.episode || 1))
    setCurrentPage('player')
  }

  return (
    <section className="hero cine-hero" style={{ minHeight: '78vh', paddingBottom: 88 }}>
      <div className="hero-backdrop fade-in" style={{ backgroundImage: item.backdrop_path ? `url(${BACKDROP_URL}${item.backdrop_path})` : undefined }} />
      <div className="hero-overlay" />
      <div className="hero-content" style={{ maxWidth: '52%' }}>
        <div className="hero-copy fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="h-6 px-2 rounded-md bg-black/55 text-[10px] font-bold tracking-widest uppercase">{kicker}</span>
            {idx === 0 && <span className="h-6 px-2 rounded-md bg-[#FF1493] text-[10px] font-bold">#1</span>}
          </div>
          {titleLogoFromDetail(detail) ? (
            <img src={titleLogoFromDetail(detail)} alt={titleOf(item)} className="mb-4 max-h-28 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,.7)]" />
          ) : (
            <h1 className="cine-title">{titleOf(item)}</h1>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-white/70 mb-3">
            {kind === 'tv' && <span>S{hist?.season || 1} E{hist?.episode || detail?.next_episode_to_air?.episode_number || 1}</span>}
            {detail?.genres?.[0]?.name && <><span className="text-white/25">·</span><span>{detail.genres[0].name}</span></>}
            {age && <span className="h-5 px-1.5 rounded bg-white/15 text-[10px] font-bold">{age}</span>}
            {detail?.vote_average > 0 && <><span className="text-white/25">·</span><span>★ {Number(detail.vote_average).toFixed(1)}</span></>}
            {(item.release_date || item.first_air_date) && <><span className="text-white/25">·</span><span>{String(item.release_date || item.first_air_date).slice(0, 4)}</span></>}
          </div>
          <p className="text-[10px] text-white/30 mb-2">Fonte: TMDB</p>
          <p>{item.overview || detail?.overview || ''}</p>
          {detail?.credits?.cast?.length > 0 && (
            <p className="text-[12px] text-white/45 mb-4">With {detail.credits.cast.slice(0, 3).map((c: any) => c.name).join(', ')}</p>
          )}
          <div className="hero-actions">
            <button className="hero-play" type="button" onClick={play}>
              <Play fill="currentColor" size={16} /> {hist ? 'Resume' : 'Play'}
            </button>
            <button className="hero-secondary" type="button" onClick={() => {
              if (isInWatchlist(item.id, kind)) removeFromWatchlist(item.id, kind)
              else addToWatchlist({ mediaId: item.id, mediaType: kind, title: titleOf(item), posterPath: item.poster_path || null, addedAt: new Date().toISOString() })
            }}>
              {isInWatchlist(item.id, kind) ? <><Check size={16} /> In Library</> : <><Plus size={16} /> Add to Library</>}
            </button>
            <button className="hero-info" type="button" onClick={() => { setSelectedMedia({ id: item.id, type: kind, isAnime: mediaType === 'anime' } as any); setCurrentPage('detail') }}>
              <Info size={16} />
            </button>
            <button className="hero-info" type="button" onClick={() => {
              const next = [...hidden, String(item.id)]
              setHidden(next)
              try { localStorage.setItem('mfy-hidden-' + mediaType, JSON.stringify(next)) } catch {}
              setIdx(0)
            }}><EyeOff size={16} /></button>
          </div>
        </div>
      </div>
      <div className="absolute left-8 z-10 flex gap-1.5" style={{ bottom: 28 }}>
        {pool.slice(0, 8).map((_, i) => (
          <button key={i} type="button" className={`h-1.5 rounded-full ${i === idx ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} onClick={() => setIdx(i)} />
        ))}
      </div>
    </section>
  )
}
