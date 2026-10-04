import { viewingBadges } from '../lib/achievements'
import type { WatchHistoryItem } from '../types'

export function Achievements({ history }: { history: WatchHistoryItem[] }) {
  const badges = viewingBadges(history)
  const earned = badges.filter((b) => b.earned).length
  return (
    <div>
      <p className="text-sm text-white/45 mb-4">{earned} of {badges.length} unlocked from what you have actually watched.</p>
      <div className="ach-grid">
        {badges.map((b) => (
          <article key={b.id} className={b.earned ? 'ach on' : 'ach'}>
            <strong>{b.name}</strong>
            <span>{b.detail}</span>
            <small>{b.earned ? 'Unlocked' : b.progress}</small>
          </article>
        ))}
      </div>
    </div>
  )
}
