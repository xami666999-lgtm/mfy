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
      <div className="text-center">
        <div className="text-white text-6xl font-black tracking-[0.35em]">MFY</div>
        <div className="mt-3 text-[11px] tracking-[0.28em] text-white/40">MOVIES FOR YOU</div>
      </div>
    </div>
  )
}
