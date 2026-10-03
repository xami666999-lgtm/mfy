import { useEffect } from 'react'

type Props = { onDone: () => void }

export default function Intro({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1400)
    const skip = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') onDone()
    }
    window.addEventListener('keydown', skip)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', skip)
    }
  }, [onDone])

  return (
    <div className="h-screen grid place-items-center bg-black" onClick={onDone} role="presentation">
      <div className="nf-intro" aria-label="MFY">
        <span>M</span><span>F</span><span>Y</span>
      </div>
    </div>
  )
}
