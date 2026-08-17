import { useEffect, useState } from 'react'

const FONTS = [
  { family: 'Georgia, serif', weight: 700, tracking: '0.35em' },
  { family: 'Impact, Haettenschweiler, sans-serif', weight: 400, tracking: '0.2em' },
  { family: 'system-ui, Segoe UI, sans-serif', weight: 900, tracking: '0.45em' },
  { family: 'Palatino Linotype, Book Antiqua, serif', weight: 600, tracking: '0.28em' },
  { family: 'Arial Black, Arial, sans-serif', weight: 900, tracking: '0.15em' },
]

type Props = { onDone: () => void }

export default function Intro({ onDone }: Props) {
  const [phase, setPhase] = useState<'logos' | 'exit'>('logos')
  const [fontIndex, setFontIndex] = useState(0)

  useEffect(() => {
    const timers: number[] = []
    // Cycle through font styles
    FONTS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setFontIndex(i), i * 420))
    })
    // Start slide-open exit
    timers.push(
      window.setTimeout(() => setPhase('exit'), FONTS.length * 420 + 500)
    )
    // Unmount
    timers.push(
      window.setTimeout(() => onDone(), FONTS.length * 420 + 500 + 900)
    )
    const safety = window.setTimeout(() => onDone(), 8000)
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

      <div className="mfy-intro-center">
        <img src="./icon.png" alt="" className="mfy-intro-mark" />
        <div
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
