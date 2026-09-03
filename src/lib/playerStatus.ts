const KEY = 'mfy-source-status'

export function readStatus(): Record<string, { ok: number; fail: number }> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function markSource(id: string, ok: boolean) {
  const all = readStatus()
  const cur = all[id] || { ok: 0, fail: 0 }
  if (ok) cur.ok = Date.now()
  else cur.fail = Date.now()
  all[id] = cur
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch {}
}

export function sourceDot(id: string) {
  const s = readStatus()[id]
  if (!s) return 'gray'
  if (s.ok && s.ok > (s.fail || 0)) return 'green'
  if (s.fail && s.fail > (s.ok || 0)) return 'red'
  return 'yellow'
}

export function reportBroken(title: string, source: string) {
  const rows = JSON.parse(localStorage.getItem('mfy-broken') || '[]')
  rows.unshift({ title, source, at: new Date().toISOString() })
  localStorage.setItem('mfy-broken', JSON.stringify(rows.slice(0, 50)))
  markSource(source, false)
}
