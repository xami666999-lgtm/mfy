export function dedupeContinue(hist: any[]) {
  const map = new Map<string, any>()
  for (const h of hist || []) {
    const id = String(h.mediaId || h.id || '')
    const type = String(h.mediaType || 'movie')
    const key = `${type}|${id}`
    const prev = map.get(key)
    const score = Number(h.progress || 0) + Number(h.updatedAt ? Date.parse(h.updatedAt) : 0) / 1e13
    const prevScore = prev ? Number(prev.progress || 0) + Number(prev.updatedAt ? Date.parse(prev.updatedAt) : 0) / 1e13 : -1
    if (!prev || score >= prevScore) map.set(key, h)
  }
  return [...map.values()]
}

export function monthRewind(hist: any[]) {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const rows = (hist || []).filter((h) => String(h.updatedAt || h.addedAt || '').startsWith(ym) || !h.updatedAt)
  const seconds = rows.reduce((n, h) => n + Number(h.progress || 0), 0)
  const hours = Math.round((seconds / 3600) * 10) / 10
  const titles = new Set(rows.map((h) => String(h.mediaId))).size
  return { hours, titles, month: ym }
}

export function badges(hist: any[]) {
  const n = new Set((hist || []).map((h) => String(h.mediaId))).size
  const hours = (hist || []).reduce((s, h) => s + Number(h.progress || 0), 0) / 3600
  const out: { id: string; name: string; on: boolean }[] = [
    { id: 'first', name: 'First play', on: n >= 1 },
    { id: 'ten', name: '10 titles', on: n >= 10 },
    { id: 'binge', name: '24h logged', on: hours >= 24 },
    { id: 'marathon', name: '100 titles', on: n >= 100 },
  ]
  return out
}
