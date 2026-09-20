import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, ListVideo, Play, X } from 'lucide-react'
import { tmdb, STILL_URL } from '../api/tmdb'
import { useStore } from '../store'
import { isEpisodeWatched } from '../lib/watchProgress'
import { isAnimeItem } from '../lib/trackers'

export default function EpisodePanel() {
  const { currentPage, selectedMedia, setSelectedMedia, watchHistory } = useStore()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [season, setSeason] = useState(1)
  const [seasonData, setSeasonData] = useState<any>(null)

  const show =
    currentPage === 'player' &&
    selectedMedia &&
    selectedMedia.type !== 'movie' &&
    selectedMedia.type !== 'iptv' &&
    (selectedMedia.type === 'tv' || isAnimeItem(selectedMedia))

  useEffect(() => {
    if (!show || !selectedMedia) return
    const start = Number(selectedMedia.season || 1)
    setSeason(start || 1)
    tmdb.getTVDetail(Number(selectedMedia.id)).then((d) => {
      setDetail(d)
      const s = Number(selectedMedia.season || d?.seasons?.find((x: any) => x.season_number > 0)?.season_number || 1)
      setSeason(s)
    }).catch(() => {})
  }, [show, selectedMedia?.id])

  useEffect(() => {
    if (!show || !selectedMedia || !season) return
    tmdb.getSeasonDetail(Number(selectedMedia.id), season).then(setSeasonData).catch(() => setSeasonData(null))
  }, [show, selectedMedia?.id, season])

  useEffect(() => {
    if (!show) {
      setOpen(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'e' || e.key === 'E' || e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [show, open])

  const seasons = useMemo(
    () => (detail?.seasons || []).filter((s: any) => s.season_number >= 0),
    [detail]
  )
  const seasonNums = seasons.map((s: any) => s.season_number)
  const idx = Math.max(0, seasonNums.indexOf(season))
  const episodes = seasonData?.episodes || []
  const title = detail?.name || selectedMedia?.title || 'Series'
  const currentEp = Number(selectedMedia?.episode || 0)

  if (!show) return null

  function playEpisode(ep: any) {
    if (!selectedMedia) return
    setSelectedMedia({
      ...selectedMedia,
      season,
      episode: ep.episode_number,
      name: ep.name,
      title: title,
    } as any)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="fixed z-[85] right-5 bottom-24 h-11 px-4 rounded-full bg-black/70 border border-white/15 text-white text-sm font-medium backdrop-blur-md hover:bg-black/85"
        onClick={() => setOpen(true)}
        title="Episodes (E)"
      >
        <span className="inline-flex items-center gap-2"><ListVideo size={16} /> Episodes</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/35" onClick={() => setOpen(false)}>
          <aside
            className="h-full w-[min(420px,92vw)] bg-[#121212]/97 border-l border-white/10 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate font-display">{title}</div>
                <div className="text-[11px] text-white/40">{detail?.number_of_episodes || episodes.length} episodes</div>
              </div>
              <button type="button" className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/10" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2">
              <button
                type="button"
                className="h-8 w-8 grid place-items-center rounded-full bg-white/8 disabled:opacity-30"
                disabled={idx <= 0}
                onClick={() => setSeason(seasonNums[idx - 1])}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex-1 h-9 rounded-lg bg-white/8 border border-white/10 grid place-items-center text-sm font-medium">
                {season === 0 ? 'Specials' : `Season ${season}`}
              </div>
              <button
                type="button"
                className="h-8 w-8 grid place-items-center rounded-full bg-white/8 disabled:opacity-30"
                disabled={idx >= seasonNums.length - 1}
                onClick={() => setSeason(seasonNums[idx + 1])}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-6">
              {episodes.map((ep: any) => {
                const on = Number(selectedMedia?.season || 0) === season && currentEp === ep.episode_number
                const seen = isEpisodeWatched(watchHistory, selectedMedia?.id, season, ep.episode_number)
                return (
                  <button
                    key={ep.id || ep.episode_number}
                    type="button"
                    onClick={() => playEpisode(ep)}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left ${on ? 'bg-white/12 ring-1 ring-white/20' : 'hover:bg-white/6'}`}
                  >
                    <div className="relative w-[88px] h-[50px] rounded-md overflow-hidden bg-white/8 flex-shrink-0">
                      {ep.still_path ? (
                        <img src={`${STILL_URL}${ep.still_path}`} alt="" className="w-full h-full object-cover" />
                      ) : null}
                      {on && (
                        <div className="absolute inset-0 grid place-items-center bg-black/35">
                          <Play size={16} fill="#fff" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] text-white/90 truncate">
                        E{ep.episode_number} · {ep.name || `Episode ${ep.episode_number}`}
                      </div>
                      <div className="text-[11px] text-white/35">{ep.runtime ? `${ep.runtime} min` : ''}</div>
                    </div>
                    {seen && <span className="text-white/50 text-sm flex-shrink-0">✓</span>}
                  </button>
                )
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
