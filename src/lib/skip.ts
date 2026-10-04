const KEY = 'mfy-skip'

export function skippedIds(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    return new Set(Array.isArray(raw) ? raw.map(String) : [])
  } catch {
    return new Set()
  }
}

export function skipTitle(id: string | number) {
  const next = skippedIds()
  next.add(String(id))
  try { localStorage.setItem(KEY, JSON.stringify([...next].slice(-400))) } catch {}
  window.dispatchEvent(new Event('mfy-skip'))
}
