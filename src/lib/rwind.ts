import type { WatchHistoryItem } from '../types'

const HIDE = 'mfy-rwind-hide'

export function hiddenUpNext() {
  try { return new Set(JSON.parse(localStorage.getItem(HIDE) || '[]')) } catch { return new Set<string>() }
}

export function hideUpNext(id: string) {
  const next = hiddenUpNext()
  next.add(id)
  try { localStorage.setItem(HIDE, JSON.stringify([...next])) } catch {}
}

export function upNext(rows: WatchHistoryItem[]) {
  const hidden = hiddenUpNext()
  const map = new Map<string, WatchHistoryItem>()
  for (const row of rows || []) {
    if (!row || row.mediaType === 'iptv') continue
    const key = `${row.mediaType}|${row.mediaId}`
    const prev = map.get(key)
    if (!prev || Date.parse(row.watchedAt || '') >= Date.parse(prev.watchedAt || '')) map.set(key, row)
  }
  return [...map.values()]
    .filter((row) => row.mediaType !== 'movie' && !row.seriesCompleted && !hidden.has(String(row.mediaId)))
    .map((row) => ({
      ...row,
      nextEpisode: row.completed ? Number(row.episode || 1) + 1 : Number(row.episode || 1),
    }))
    .slice(0, 24)
}

export function rwindStats(rows: WatchHistoryItem[]) {
  const list = rows || []
  const hours = Math.round(list.reduce((n, row) => n + Number(row.progress || 0), 0) / 360) / 10
  const days = new Set(list.map((row) => String(row.watchedAt || '').slice(0, 10)).filter(Boolean))
  const sorted = [...days].sort()
  let streak = 0
  let best = 0
  let prev = ''
  for (const day of sorted) {
    const next = prev ? (Date.parse(day) - Date.parse(prev)) / 86400000 : 1
    streak = next === 1 ? streak + 1 : 1
    best = Math.max(best, streak)
    prev = day
  }
  const shows = new Map<string, number>()
  const movies = new Map<string, number>()
  for (const row of list) {
    const bag = row.mediaType === 'movie' ? movies : shows
    bag.set(row.title || 'Untitled', (bag.get(row.title || 'Untitled') || 0) + 1)
  }
  const top = (bag: Map<string, number>) => [...bag.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
  return { hours, plays: list.length, streak: best, topShow: top(shows), topMovie: top(movies) }
}
