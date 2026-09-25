import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { tmdb } from '../api/tmdb'
import { fetchIntroSegments } from '../api/introdb'
import { isAnimeItem } from '../lib/trackers'

export default function IntroSkip() {
  const { selectedMedia, currentPage } = useStore()
  const [seg, setSeg] = useState<{ start: number; end: number; kind: string } | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setSeg(null)
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
        const intro = rows.find((r) => r.kind === 'intro') || rows.find((r) => r.kind === 'recap') || rows[0]
        if (live) setSeg(intro || null)
      } catch {
        if (live) setSeg(null)
      }
    })()
    return () => { live = false }
  }, [currentPage, selectedMedia?.id, selectedMedia?.season, selectedMedia?.episode, selectedMedia?.type])

  function seekTo(t: number) {
    const w = document.querySelector('webview') as any
    try { w?.executeJavaScript?.(`(() => { const v = document.querySelector('video'); if (v) v.currentTime = ${t}; })()`) } catch {}
    const v = document.querySelector('video') as HTMLVideoElement | null
    if (v) try { v.currentTime = t } catch {}
  }

  function skip() {
    if (!seg) return
    seekTo(Math.max(0, seg.end + 0.4))
  }

  function resync() {
    const next = Math.round((offset + 0.5) * 10) / 10
    setOffset(next)
    try { localStorage.setItem('mfy-sub-offset', String(next)) } catch {}
    window.dispatchEvent(new CustomEvent('mfy-sub-resync', { detail: next }))
    const w = document.querySelector('webview') as any
    try {
      w?.executeJavaScript?.(`(() => { document.querySelectorAll('video').forEach(v => { [...(v.textTracks||[])].forEach(tr => { try { tr.mode = 'showing' } catch {} }) }) })()`)
    } catch {}
  }

  if (currentPage !== 'player') return null

  return (
    <div className="fixed bottom-24 right-8 z-[80] flex flex-col items-end gap-2">
      {seg && (
        <button type="button" onClick={skip} className="h-11 px-5 rounded-full bg-white text-black text-sm font-semibold shadow-2xl">
          Skip {seg.kind}
        </button>
      )}
      <button type="button" onClick={resync} className="h-10 px-4 rounded-full bg-black/70 border border-white/20 text-white text-xs font-semibold">
        Resync subs {offset ? `+${offset}s` : ''}
      </button>
    </div>
  )
}
