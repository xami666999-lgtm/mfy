import { cueAt, type SeekCue } from '../api/seekr'

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const h = Math.floor(s / 3600)
  if (h) return `${h}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function SeekPreview({ cues, hoverSec, x }: { cues: SeekCue[]; hoverSec: number; x: number }) {
  if (!cues.length) return null
  const mid = cueAt(cues, hoverSec)
  const left = cueAt(cues, Math.max(0, hoverSec - 30))
  const right = cueAt(cues, hoverSec + 30)
  const tiles = [left, mid, right].filter(Boolean) as SeekCue[]
  return (
    <div style={{ position: 'absolute', left: Math.max(80, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 800) - 80)), bottom: 28, transform: 'translateX(-50%)', display: 'flex', alignItems: 'flex-end', gap: 8, pointerEvents: 'none', zIndex: 40 }}>
      {tiles.map((c, i) => {
        const big = c === mid
        return (
          <div key={`${c.start}-${i}`} style={{ textAlign: 'center' }}>
            <div style={{
              width: big ? 168 : 108,
              height: big ? 94 : 60,
              borderRadius: 8,
              overflow: 'hidden',
              border: big ? '2px solid #fff' : '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              background: '#111',
            }}>
              <div style={{
                width: c.w,
                height: c.h,
                backgroundImage: `url(${c.url})`,
                backgroundPosition: `-${c.x}px -${c.y}px`,
                transform: `scale(${(big ? 168 : 108) / Math.max(c.w, 1)})`,
                transformOrigin: 'top left',
              }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: '#fff', background: big ? 'rgba(0,0,0,0.7)' : 'transparent', display: 'inline-block', padding: '1px 6px', borderRadius: 6 }}>{fmt(c.start)}</div>
          </div>
        )
      })}
    </div>
  )
}
