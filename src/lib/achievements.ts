import type { WatchHistoryItem } from '../types'

export type ViewingBadge = {
  id: string
  name: string
  detail: string
  progress: string
  earned: boolean
}

function hourOf(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? -1 : d.getHours()
}

function dayKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function viewingBadges(history: WatchHistoryItem[]): ViewingBadge[] {
  const rows = (history || []).filter((h) => h && (Number(h.progress) > 0 || h.completed))
  const unique = new Set(rows.map((h) => `${h.mediaType}:${h.mediaId}`))
  const night = rows.some((h) => {
    const hour = hourOf(h.watchedAt)
    return hour >= 0 && (hour >= 23 || hour < 5)
  })
  const byShowDay = new Map<string, number>()
  const moviesByDay = new Map<string, number>()
  const episodesByShow = new Map<string, number>()
  let weekend = false
  for (const h of rows) {
    const day = dayKey(h.watchedAt)
    if (!day) continue
    const d = new Date(h.watchedAt)
    if (d.getDay() === 0 || d.getDay() === 6) weekend = true
    if (h.mediaType === 'tv') {
      const key = `${h.mediaId}|${day}`
      byShowDay.set(key, (byShowDay.get(key) || 0) + 1)
      episodesByShow.set(String(h.mediaId), (episodesByShow.get(String(h.mediaId)) || 0) + 1)
    }
    if (h.mediaType === 'movie') moviesByDay.set(day, (moviesByDay.get(day) || 0) + 1)
  }
  const binge = [...byShowDay.values()].some((n) => n >= 3)
  const doubleFeature = [...moviesByDay.values()].some((n) => n >= 2)
  const seasoned = [...episodesByShow.values()].some((n) => n >= 8)
  const bingeBest = Math.max(0, ...byShowDay.values(), 0)

  return [
    {
      id: 'first',
      name: 'First Watch',
      detail: 'Press play on anything.',
      progress: rows.length ? 'Done' : '0 of 1',
      earned: rows.length > 0,
    },
    {
      id: 'binge',
      name: 'Binge Session',
      detail: 'Three episodes of the same show in one day.',
      progress: binge ? 'Done' : `${Math.min(3, bingeBest)} of 3`,
      earned: binge,
    },
    {
      id: 'night',
      name: 'Night Owl',
      detail: 'Watch something between 11pm and 5am.',
      progress: night ? 'Done' : 'Not yet',
      earned: night,
    },
    {
      id: 'double',
      name: 'Double Feature',
      detail: 'Two movies on the same day.',
      progress: doubleFeature ? 'Done' : '0 of 2',
      earned: doubleFeature,
    },
    {
      id: 'ten',
      name: 'Ten Titles',
      detail: 'Start ten different movies or shows.',
      progress: `${Math.min(10, unique.size)} of 10`,
      earned: unique.size >= 10,
    },
    {
      id: 'season',
      name: 'Seasoned',
      detail: 'Log eight episodes of one show.',
      progress: seasoned ? 'Done' : `${Math.min(8, Math.max(0, ...episodesByShow.values(), 0))} of 8`,
      earned: seasoned,
    },
    {
      id: 'weekend',
      name: 'Weekend Watch',
      detail: 'Watch on a Saturday or Sunday.',
      progress: weekend ? 'Done' : 'Not yet',
      earned: weekend,
    },
  ]
}
