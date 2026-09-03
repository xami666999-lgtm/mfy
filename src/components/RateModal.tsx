import { useState } from 'react'

export default function RateModal({
  title,
  kind,
  onSubmit,
  onSkip,
}: {
  title: string
  kind: 'movie' | 'tv' | 'anime' | 'manga'
  onSubmit: (score: number) => void
  onSkip: () => void
}) {
  const [score, setScore] = useState(8)
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#140810] border border-white/10 p-6 text-white">
        <p className="text-[11px] tracking-[0.2em] text-[#FF1493] font-bold">FINISHED</p>
        <h2 className="text-xl font-black mt-1 mb-1">{title}</h2>
        <p className="text-sm text-white/50 mb-4">Rate this {kind}. Syncs to your trackers if they’re signed in.</p>
        <div className="flex gap-1 mb-4 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => setScore(n)} className={`w-8 h-8 rounded-lg text-sm font-bold ${score === n ? 'bg-[#FF1493]' : 'bg-white/10'}`}>{n}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="flex-1 h-11 rounded-xl bg-[#FF1493] font-bold" onClick={() => onSubmit(score)}>Save</button>
          <button type="button" className="h-11 px-4 rounded-xl bg-white/10" onClick={onSkip}>Skip</button>
        </div>
      </div>
    </div>
  )
}
