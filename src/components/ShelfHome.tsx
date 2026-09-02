import { Play } from 'lucide-react'

export type ShelfItem = {
  id: string | number
  title: string
  image?: string
  sub?: string
  backdrop?: string
}

export function HeroBanner({
  item,
  kicker,
  onPlay,
}: {
  item?: ShelfItem | null
  kicker: string
  onPlay: () => void
}) {
  if (!item) return null
  return (
    <section className="hero mx-5 mt-4">
      <div
        className="hero-backdrop"
        style={{ backgroundImage: item.backdrop || item.image ? `url(${item.backdrop || item.image})` : undefined }}
      />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-copy">
          <div className="hero-kicker">{kicker}</div>
          <h1>{item.title}</h1>
          {item.sub && <p className="hero-overview text-white/70">{item.sub}</p>}
          <div className="hero-actions">
            <button type="button" className="hero-play" onClick={onPlay}>
              <Play fill="currentColor" size={16} /> Play
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function PosterShelf({
  title,
  items,
  onOpen,
  wide,
}: {
  title: string
  items: ShelfItem[]
  onOpen: (item: ShelfItem) => void
  wide?: boolean
}) {
  if (!items.length) return null
  return (
    <section className="px-5 mb-7">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {items.map((item) => (
          <button key={String(item.id)} type="button" className="flex-shrink-0 text-left" style={{ width: wide ? 220 : 140 }} onClick={() => onOpen(item)}>
            <div className={`rounded-xl overflow-hidden bg-[#14141c] ${wide ? 'aspect-video' : 'aspect-[2/3]'}`}>
              {item.image
                ? <img src={item.image} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center text-white/25 text-xs p-2">{item.title}</div>}
            </div>
            <p className="text-[12px] text-white mt-1.5 truncate">{item.title}</p>
            {item.sub && <p className="text-[10px] text-white/40 truncate">{item.sub}</p>}
          </button>
        ))}
      </div>
    </section>
  )
}

export function CategoryChips({
  labels,
  active,
  onPick,
}: {
  labels: string[]
  active: string
  onPick: (label: string) => void
}) {
  return (
    <div className="px-5 mb-5 flex gap-2 flex-wrap">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onPick(label)}
          className={`h-8 px-3 rounded-full text-[11px] font-medium ${active === label ? 'bg-[#FF1493] text-white' : 'bg-white/[0.06] text-white/45 hover:text-white/70'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
