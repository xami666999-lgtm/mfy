import { useEffect } from 'react'

type Props = { onDone: () => void }

export default function Intro({ onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1600)
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
      <img src="./logo-mark.png" alt="MFY" className="nf-intro-logo" />
    </div>
  )
}
