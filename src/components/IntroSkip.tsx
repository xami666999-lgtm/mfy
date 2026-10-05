import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { fetchIntroSegments, type IntroSeg } from '../api/introdb'

const LABEL: Record<string, string> = {
  intro: 'intro',
  recap: 'recap',
  credits: 'credits',
  preview: 'preview',
}

export default function IntroSkip() {
  const { selectedMedia, currentPage } = useStore()
  const [segs, setSegs] = useState<IntroSeg[]>([])
  const [now, setNow] = useState(0)
  const [gone, setGone] = useState('')

  useEffect(() => {
    setSegs([])
    setNow(0)
    setGone('')
    if (currentPage !== 'player' || !selectedMedia || selectedMedia.type === 'iptv') return
    let live = true
    const id = Number(selectedMedia.id)
    if (!id) return
    fetchIntroSegments({
      tmdbId: id,
      season: selectedMedia.season || 1,
      episode: selectedMedia.episode || 1,
      isMovie: selectedMedia.type === 'movie',
    }).then((rows) => { if (live) setSegs(rows) }).catch(() => {})
    return () => { live = false }
  }, [currentPage, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  useEffect(() => {
    if (currentPage !== 'player' || !segs.length) return
    const id = window.setInterval(() => {
      let t = 0
      const v = document.querySelector('.player-stage video') as HTMLVideoElement | null
      if (v && Number.isFinite(v.currentTime) && v.currentTime > 0) t = v.currentTime
      else {
        const raw = (window as any).__mfyProgress
        if (typeof raw === 'number') t = raw
      }
      setNow(t)
    }, 500)
    return () => window.clearInterval(id)
  }, [currentPage, segs])

  const active = segs.find((s) => gone !== s.kind && now >= Math.max(0, s.start - 1.2) && now <= s.end + 0.6)
  if (currentPage !== 'player' || !active || now < 0.4) return null

  function skip() {
    const t = Math.max(0, active!.end + 0.4)
    const w = document.querySelector('webview') as any
    try { w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (v) v.currentTime = ${t}; })()`) } catch {}
    const v = document.querySelector('.player-stage video') as HTMLVideoElement | null
    if (v) try { v.currentTime = t } catch {}
    setGone(active!.kind)
  }

  return (
    <button type="button" className="intro-skip" onClick={skip}>
      Skip {LABEL[active.kind] || active.kind}
    </button>
  )
}
