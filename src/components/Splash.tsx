import { useEffect } from 'react'

function playIntro() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.18, now + 0.12)
    master.gain.exponentialRampToValueAtTime(0.08, now + 1.4)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4)
    master.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(196, now)
    osc.frequency.exponentialRampToValueAtTime(392, now + 0.55)
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 1.35)
    osc.connect(master)
    osc.start(now)
    osc.stop(now + 2.45)

    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    noise.buffer = buf
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.04, now)
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    noise.connect(ng)
    ng.connect(ctx.destination)
    noise.start(now)
  } catch { /* autoplay blocked */ }
}

export default function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    playIntro()
    const t = setTimeout(onDone, 2800)
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
    <button type="button" className="mfy-splash" onClick={onDone} aria-label="Skip intro">
      <div className="mfy-splash-tunnel" />
      <div className="mfy-splash-mark">
        <img src="./icons/mfy-512.png" alt="" />
        <span>MFY</span>
      </div>
    </button>
  )
}
