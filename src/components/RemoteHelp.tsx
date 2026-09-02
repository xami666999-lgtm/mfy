import { useEffect, useState } from 'react'
import { useStore } from '../store'

const GLOBAL = [
  ['/', 'Search'],
  ['1 or H', 'Home'],
  ['3 or S', 'Search'],
  ['4 or L', 'My List'],
  ['Esc', 'Back'],
  ['?', 'This overlay'],
]

const PLAYER = [
  ['Space', 'Play / pause'],
  ['← →', 'Seek 10s'],
  ['F', 'Fullscreen'],
  ['M', 'Mute'],
  ['N', 'Next episode'],
]

export default function RemoteHelp() {
  const currentPage = useStore((s) => s.currentPage)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null
  const rows = currentPage === 'player' ? [...PLAYER, ...GLOBAL] : GLOBAL

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70" onClick={() => setOpen(false)}>
      <div className="w-[min(420px,92vw)] rounded-2xl border border-[#FF1493]/25 bg-[#0c0b12] p-5 shadow-[0_0_40px_rgba(255,20,147,0.15)]" onClick={(e) => e.stopPropagation()}>
        <p className="text-[10px] tracking-[0.2em] text-[#FF1493] font-bold mb-1">REMOTE</p>
        <h2 className="text-lg font-bold text-white mb-3">Keys</h2>
        <div className="space-y-1.5">
          {rows.map(([k, label]) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className="text-white/45">{label}</span>
              <kbd className="h-7 min-w-[52px] px-2 rounded-md bg-white/[0.06] border border-white/10 text-[11px] text-white/80 grid place-items-center">{k}</kbd>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/25 mt-4">Press ? or Esc to close</p>
      </div>
    </div>
  )
}
