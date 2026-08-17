import { useEffect, useState } from 'react'

const FONTS = [
  { family: 'Georgia, serif', weight: 700, tracking: '0.35em' },
  { family: 'Impact, Haettenschweiler, sans-serif', weight: 400, tracking: '0.2em' },
  { family: 'system-ui, Segoe UI, sans-serif', weight: 900, tracking: '0.45em' },
  { family: 'Palatino Linotype, Book Antiqua, serif', weight: 600, tracking: '0.28em' },
  { family: 'Arial Black, Arial, sans-serif', weight: 900, tracking: '0.15em' },
  { family: 'Courier New, monospace', weight: 700, tracking: '0.4em' },
]

const FONT_MS = 140
const HOLD_MS = 320
const EXIT_MS = 620

type Props = { onDone: () => void }

export default function Intro({ onDone }: Props) {
  const [fontIndex, setFontIndex] = useState(0)
  const [popping, setPopping] = useState(true)
  const [phase, setPhase] = useState<'show' | 'exit'>('show')

  useEffect(() => {
    const timers: number[] = []
    FONTS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setFontIndex(i), i * FONT_MS))
    })
    timers.push(
      window.setTimeout(() => {
        setPopping(false)
        setPhase('exit')
      }, FONTS.length * FONT_MS + HOLD_MS)
    )
    timers.push(
      window.setTimeout(() => onDone(), FONTS.length * FONT_MS + HOLD_MS + EXIT_MS)
    )
    const safety = window.setTimeout(() => onDone(), 3200)
    timers.push(safety)
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const font = FONTS[fontIndex] || FONTS[0]

  return (
    <div
      className={`mfy-intro ${phase === 'exit' ? 'mfy-intro-exit' : ''}`}
      onClick={onDone}
      role="presentation"
    >
      <div className="mfy-intro-panel mfy-intro-left" />
      <div className="mfy-intro-panel mfy-intro-right" />

      <div className={`mfy-intro-center ${popping ? 'mfy-intro-popping' : ''}`}>
        <svg className="mfy-intro-mark" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="mfyIntroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#FF1493', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#00E5FF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <rect x="10" y="15" width="18" height="70" rx="3" fill="#FF1493" />
          <rect x="32" y="15" width="18" height="70" rx="3" fill="#C71585" opacity="0.85" />
          <rect x="54" y="15" width="18" height="70" rx="3" fill="#FF1493" />
          <rect x="76" y="15" width="14" height="70" rx="3" fill="#C71585" opacity="0.85" />
          <polygon points="42,30 42,70 72,50" fill="url(#mfyIntroGrad)" />
        </svg>
        <div
          key={fontIndex}
          className="mfy-intro-word"
          style={{
            fontFamily: font.family,
            fontWeight: font.weight,
            letterSpacing: font.tracking,
          }}
        >
          MFY
        </div>
        <div className="mfy-intro-sub">MOVIES FOR YOU</div>
        <div className="mfy-intro-skip">Click to skip</div>
      </div>
    </div>
  )
}