import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { fetchIntroSegments, type IntroSeg } from '../api/introdb'

export default function IntroSkip() {
  const { selectedMedia, currentPage } = useStore()
  const [segs, setSegs] = useState<IntroSeg[]>([])
  const show = currentPage === 'player' && selectedMedia && selectedMedia.type !== 'movie' && selectedMedia.type !== 'iptv'

  useEffect(() => {
    setSegs([])
    if (!show || !selectedMedia) return
    let live = true
    fetchIntroSegments({
      tmdbId: selectedMedia.id,
      season: selectedMedia.season || 1,
      episode: selectedMedia.episode || 1,
      isMovie: false,
    }).then((rows) => { if (live) setSegs(rows) }).catch(() => {})
    return () => { live = false }
  }, [show, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode])

  if (!show) return null

  function seekTo(sec: number) {
    const v = document.querySelector('.player-stage video, video') as HTMLVideoElement | null
    if (v) { try { v.currentTime = sec; return } catch {} }
    const w = document.querySelector('webview') as any
    try { w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (v) v.currentTime = ${sec}; })()`) } catch {}
    const frame = document.querySelector('.player-stage iframe') as HTMLIFrameElement | null
    if (frame?.src) {
      const u = new URL(frame.src, location.href)
      u.searchParams.set('start', String(Math.round(sec)))
      u.searchParams.set('t', String(Math.round(sec)))
      frame.src = u.toString()
    }
  }

  function skipIntro() {
    const hit = segs.find((s) => s.kind === 'intro' || s.kind === 'recap')
    seekTo(hit ? hit.end + 1 : 90)
  }

  function skipCredits() {
    const hit = segs.find((s) => s.kind === 'credits' || s.kind === 'preview')
    if (hit) seekTo(hit.end + 1)
    window.dispatchEvent(new CustomEvent('mfy-skip-credits'))
  }

  return (
    <div className="mfy-skip-row">
      <button type="button" className="intro-skip" onClick={skipIntro}>Skip intro</button>
      <button type="button" className="intro-skip" onClick={skipCredits}>Skip credits</button>
    </div>
  )
}
