import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { tmdb } from '../api/tmdb'
import { fetchIntroSegments } from '../api/introdb'

export default function IntroSkip() {
  const { selectedMedia, currentPage } = useStore()
  const [seg, setSeg] = useState<{ start: number; end: number; kind: string } | null>(null)
  const [now, setNow] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    setSeg(null)
    setNow(0)
    setGone(false)
    if (currentPage !== 'player' || !selectedMedia) return
    if (selectedMedia.type === 'iptv') return
    let live = true
    ;(async () => {
      try {
        const kind = selectedMedia.type === 'movie' ? 'movie' : 'tv'
        const ext = await tmdb.getExternalIds(kind as any, Number(selectedMedia.id))
        const rows = await fetchIntroSegments({
          imdbId: ext?.imdb_id,
          season: selectedMedia.season || 1,
          episode: selectedMedia.episode || 1,
          isMovie: selectedMedia.type === 'movie',
        })
        const intro = rows.find((r) => r.kind === 'intro') || rows.find((r) => r.kind === 'recap') || null
        if (live) setSeg(intro)
      } catch {
        if (live) setSeg(null)
      }
    })()
    return () => { live = false }
  }, [currentPage, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  useEffect(() => {
    if (currentPage !== 'player' || !seg) return
    const id = window.setInterval(() => {
      const v = document.querySelector('video') as HTMLVideoElement | null
      if (v && Number.isFinite(v.currentTime) && v.currentTime > 0) setNow(v.currentTime)
    }, 500)
    return () => window.clearInterval(id)
  }, [currentPage, seg])

  if (currentPage !== 'player' || !seg || gone) return null
  const readable = now > 0.4
  const inWindow = !readable || (now >= Math.max(0, seg.start - 1) && now <= seg.end + 0.4)
  if (!inWindow) return null

  function skip() {
    const t = Math.max(0, seg!.end + 0.4)
    const w = document.querySelector('webview') as any
    try { w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (v) v.currentTime = ${t}; })()`) } catch {}
    const v = document.querySelector('video') as HTMLVideoElement | null
    if (v) try { v.currentTime = t } catch {}
    setGone(true)
  }

  return (
    <button type="button" className="intro-skip" onClick={skip}>
      Skip {seg.kind}
    </button>
  )
}
