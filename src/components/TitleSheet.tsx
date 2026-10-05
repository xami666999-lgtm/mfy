import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { tmdb, BACKDROP_URL, STILL_URL, pickTrailer, trailerEmbed } from '../api/tmdb'
import { useStore } from '../store'
import TitleLogo from './TitleLogo'
import { getPlayerUrl } from '../api/vidy'

function kindOf(item: any) {
  if (item?.type === 'movie' || item?.media_type === 'movie') return 'movie'
  return 'tv'
}

function titleOf(item: any) {
  const t = item?.title
  if (typeof t === 'string' && t) return t
  if (t?.english || t?.romaji) return t.english || t.romaji
  return item?.name || ''
}

function yearOf(item: any) {
  return String(item?.release_date || item?.first_air_date || '').slice(0, 4)
}

function scoreOf(item: any) {
  const n = Number(item?.vote_average || item?.averageScore || 0)
  if (!Number.isFinite(n) || n <= 0) return 0
  return n > 10 ? n / 10 : n
}

/** Title preview for a movie, show, or anime. Episodes stay as stills inside it. */
export default function TitleSheet({ item, onClose }: { item: any; onClose: () => void }) {
  const { setSelectedMedia, setCurrentPage, setCurrentStreamUrl } = useStore()
  const [extra, setExtra] = useState<any>(null)
  const [eps, setEps] = useState<any[]>([])
  const [trailer, setTrailer] = useState<string | null>(null)
  const [playBg, setPlayBg] = useState(false)
  const kind = kindOf(item)

  useEffect(() => {
    let dead = false
    setExtra(null)
    setEps([])
    setTrailer(null)
    setPlayBg(false)
    const fn = kind === 'movie' ? tmdb.getMovieDetail : tmdb.getTVDetail
    fn(Number(item.id)).then((d) => {
      if (dead) return
      setExtra(d)
      setTrailer(pickTrailer(d?.videos?.results))
      if (kind !== 'tv') return
      const sn = (d?.seasons || []).find((s: any) => s.season_number > 0)?.season_number || 1
      tmdb.getSeasonDetail(Number(item.id), sn).then((s) => {
        if (!dead) setEps((s?.episodes || []).slice(0, 8))
      }).catch(() => {})
    }).catch(() => {})
    const wait = window.setTimeout(() => { if (!dead) setPlayBg(true) }, 5000)
    return () => { dead = true; window.clearTimeout(wait) }
  }, [item?.id, kind])

  function play(ep?: { season_number?: number; episode_number?: number }) {
    const season = ep?.season_number || 1
    const episode = ep?.episode_number || 1
    setSelectedMedia({
      id: item.id,
      type: kind,
      title: titleOf(extra || item),
      season,
      episode,
      isAnime: !!item.isAnime,
    } as any)
    setCurrentStreamUrl(getPlayerUrl('playtorrio', kind, item.id, season, episode, !!item.isAnime))
    setCurrentPage('player')
    onClose()
  }

  function more() {
    setSelectedMedia({ id: item.id, type: kind, title: titleOf(item), isAnime: !!item.isAnime } as any)
    setCurrentPage('detail')
    onClose()
  }

  const score = scoreOf(extra || item)
  const match = score ? Math.round(score * 10) : 0
  const backdrop = (extra?.backdrop_path || item.backdrop_path) ? BACKDROP_URL + (extra?.backdrop_path || item.backdrop_path) : ''

  return (
    <div className="nf-modal" onClick={onClose}>
      <div className="nf-sheet" role="dialog" aria-label={titleOf(item)} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="nf-x" onClick={onClose} aria-label="Close">×</button>
        <div className="nf-sheet-hero" style={{ backgroundImage: backdrop ? `url(${backdrop})` : undefined }}>
          {playBg && trailer && (
            <iframe title="Trailer" className="bg-trailer" src={trailerEmbed(trailer, true)} allow="autoplay; encrypted-media" />
          )}
          <div>
            <TitleLogo id={item.id} type={kind} title={titleOf(item)} />
            <div className="nv-hero-actions">
              <button type="button" className="nv-play" onClick={() => play()}><Play size={16} fill="currentColor" /> Play</button>
              <button type="button" className="nv-more" onClick={more}>More Info</button>
            </div>
          </div>
        </div>
        <div className="nf-sheet-body">
          <div className="nf-match">
            {match > 0 && <b>{match}% Match</b>}
            <span>{yearOf(extra || item)}</span>
            {extra?.number_of_seasons ? <span>{extra.number_of_seasons} Season{extra.number_of_seasons === 1 ? '' : 's'}</span> : null}
            {kind === 'movie' && extra?.runtime ? <span>{extra.runtime}m</span> : null}
            {(extra?.genres || []).slice(0, 3).map((g: any) => <span key={g.id}>{g.name}</span>)}
          </div>
          <p>{extra?.overview || item.overview || ''}</p>
          {eps.length > 0 && (
            <>
              <h3>Episodes</h3>
              <div className="nf-eps">
                {eps.map((ep) => (
                  <button key={ep.id} type="button" onClick={() => play(ep)}>
                    {ep.still_path ? <img src={`${STILL_URL}${ep.still_path}`} alt="" /> : <div className="ph" />}
                    <strong>{ep.episode_number}. {ep.name}</strong>
                    <small>{ep.overview}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
