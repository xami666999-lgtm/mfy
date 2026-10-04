const KEY = 'mfy-faces'

type Rec = { name: string; titles: string[] }

function read(): Record<string, Rec> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

export function rememberCast(cast: { id: number; name: string }[], title: string) {
  if (!title || !cast?.length) return
  const map = read()
  for (const p of cast.slice(0, 16)) {
    if (!p?.id || !p.name) continue
    const cur = map[String(p.id)] || { name: p.name, titles: [] }
    const titles = [title, ...cur.titles.filter((t) => t !== title)].slice(0, 8)
    map[String(p.id)] = { name: p.name, titles }
  }
  const entries = Object.entries(map).slice(-500)
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries))) } catch {}
}

export function facesInCommon(cast: { id: number; name: string }[], title: string) {
  const map = read()
  return (cast || []).flatMap((p) => {
    const hit = map[String(p.id)]
    if (!hit) return []
    const elsewhere = hit.titles.filter((t) => t && t !== title)
    if (!elsewhere.length) return []
    return [{ id: p.id, name: p.name, titles: elsewhere }]
  }).slice(0, 8)
}
