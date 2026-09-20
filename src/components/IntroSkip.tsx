import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { tmdb } from '../api/tmdb'
import { fetchIntroSegments } from '../api/introdb'
import { isAnimeItem } from '../lib/trackers'

export default function IntroSkip() {
  const { selectedMedia, currentPage } = useStore()
  const [seg, setSeg] = useState<{ start: number; end: number; kind: string } | null>(null)

  useEffect(() => {
    setSeg(null)
    if (currentPage !== 'player' || !selectedMedia) return
    if (selectedMedia.type === 'movie' || selectedMedia.type === 'iptv') return
    const tvOrAnime = selectedMedia.type === 'tv' || isAnimeItem(selectedMedia)
    if (!tvOrAnime) return
    let live = true
    ;(async () => {
      try {
        const ext = await tmdb.getExternalIds('tv', Number(selectedMedia.id))
        const rows = await fetchIntroSegments({
          imdbId: ext?.imdb_id,
          season: selectedMedia.season || 1,
          episode: selectedMedia.episode || 1,
          isMovie: false,
        })
        const intro = rows.find((r) => r.kind === 'intro') || rows.find((r) => r.kind === 'recap') || rows[0]
        if (live) setSeg(intro || null)
      } catch {
        if (live) setSeg(null)
      }
    })()
    return () => {
      live = false
    }
  }, [currentPage, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  if (!seg || currentPage !== 'player') return null

  function skip() {
    const w = document.querySelector('webview') as any
    const t = Math.max(0, seg!.end + 0.4)
    try {
      w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (v) v.currentTime = ${t}; })()`)
    } catch {}
    const v = document.querySelector('video') as HTMLVideoElement | null
    if (v) {
      try {
        v.currentTime = t
      } catch {}
    }
  }

  return (
    <button
      type="button"
      onClick={skip}
      className="fixed bottom-24 right-8 z-[80] h-11 px-5 rounded-full bg-white text-black text-sm font-semibold shadow-2xl hover:bg-white/90"
    >
      Skip {seg.kind}
    </button>
  )
}
