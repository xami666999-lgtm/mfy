import { useState } from 'react'

export default function RateModal({
  title,
  kind,
  onSubmit,
  onSkip,
}: {
  title: string
  kind: 'movie' | 'tv' | 'anime' | 'manga' | 'novel'
  onSubmit: (score: number, note: string) => void
  onSkip: () => void
}) {
  const [score, setScore] = useState(4)
  const [note, setNote] = useState('')
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#140810] border border-white/10 p-6 text-white">
        <p className="text-[11px] tracking-[0.2em] text-[#e50914] font-bold">FINISHED</p>
        <h2 className="text-xl font-black mt-1 mb-1">{title}</h2>
        <p className="text-sm text-white/50 mb-4">Rate this {kind} from 1 to 5.</p>
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setScore(n)} className={`w-10 h-10 rounded-lg text-lg font-bold ${score === n ? 'bg-[#e50914]' : 'bg-white/10'}`}>{n <= score ? '★' : '☆'}</button>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note" className="w-full mb-4 h-20 rounded-xl bg-white/5 border border-white/10 p-3 text-sm" />
        <div className="flex gap-2">
          <button type="button" className="flex-1 h-11 rounded-xl bg-[#e50914] font-bold" onClick={() => onSubmit(score * 2, note)}>Save</button>
          <button type="button" className="h-11 px-4 rounded-xl bg-white/10" onClick={onSkip}>Skip</button>
        </div>
      </div>
    </div>
  )
}
