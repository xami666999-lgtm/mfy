import { useEffect, useState } from 'react'
import { fillerListUrl, fetchFillerMap } from '../api/filler'
import { isAnimeItem } from '../lib/trackers'

export default function DetailExtras({
  title,
  type,
  item,
  releaseDate,
  credits,
}: {
  title: string
  type?: string
  item?: any
  releaseDate?: string
  credits?: any
}) {
  const anime = isAnimeItem(item) || type === 'anime'
  const [fillers, setFillers] = useState<number[]>([])
  useEffect(() => {
    if (!anime || !title) return
    fetchFillerMap(title).then((map) => {
      setFillers(
        Object.entries(map)
          .filter(([, v]) => v === 'filler')
          .map(([k]) => Number(k))
          .slice(0, 40)
      )
    })
  }, [anime, title])

  const when = releaseDate ? new Date(releaseDate + 'T12:00:00') : null
  const upcoming = when && when.getTime() > Date.now()
  const days = upcoming ? Math.ceil((when!.getTime() - Date.now()) / 86400000) : 0
  const voices = (credits?.cast || []).filter((p: any) => /voice/i.test(p.character || '')).slice(0, 8)

  return (
    <div className="px-8 pb-8 space-y-4">
      {upcoming && (
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4">
          <div className="text-[11px] uppercase tracking-widest text-white/35">Countdown</div>
          <div className="text-2xl font-display font-bold">{days} day{days === 1 ? '' : 's'}</div>
          <div className="text-xs text-white/45">{releaseDate}</div>
        </div>
      )}
      {anime && (
        <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-4">
          <div className="text-[11px] uppercase tracking-widest text-white/35 mb-2">Filler</div>
          {fillers.length ? (
            <p className="text-sm text-white/70">Filler episodes: {fillers.join(', ')}</p>
          ) : (
            <p className="text-sm text-white/45">Open the full list if this title is indexed.</p>
          )}
          <button
            type="button"
            className="mt-2 text-xs text-[#7dd3fc]"
            onClick={() => (window as any).electronAPI?.openExternal?.(fillerListUrl(title))}
          >
            Anime Filler List →
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-white/10"
          onClick={() =>
            (window as any).electronAPI?.openExternal?.(
              `https://www.behindthevoiceactors.com/search/?search_value=${encodeURIComponent(title)}`
            )
          }
        >
          Voice actors
        </button>
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-white/10"
          onClick={() => (window as any).electronAPI?.openExternal?.('https://substital.com/')}
        >
          Substital subs
        </button>
        <button
          type="button"
          className="h-8 px-3 rounded-full bg-white/10"
          onClick={() =>
            (window as any).electronAPI?.openExternal?.(
              `https://www.seriesgraph.com/?s=${encodeURIComponent(title)}`
            )
          }
        >
          SeriesGraph
        </button>
      </div>
      {voices.length > 0 && (
        <div className="text-xs text-white/50">Voice credits: {voices.map((v: any) => v.name).join(', ')}</div>
      )}
    </div>
  )
}
