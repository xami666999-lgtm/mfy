export type CatalogItem = { name: string; url: string }

const KEY = 'mfy-jf-catalog'

export function loadCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list.filter((x) => x && x.url) : []
  } catch {
    return []
  }
}

export function saveCatalog(list: CatalogItem[]) {
  const clean = list
    .map((x) => ({ name: String(x.name || '').trim() || basename(x.url), url: String(x.url || '').trim() }))
    .filter((x) => /^https?:\/\//i.test(x.url))
  const seen = new Set<string>()
  const uniq = clean.filter((x) => {
    const k = x.url.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  try { localStorage.setItem(KEY, JSON.stringify(uniq)) } catch {}
  return uniq
}

export function addLinks(text: string, existing: CatalogItem[]) {
  const rows = String(text || '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
  const extra: CatalogItem[] = []
  for (const row of rows) {
    const parts = row.split(/\s+\|\s+|\s+-\s+|\s+/)
    const url = parts.find((p) => /^https?:\/\//i.test(p)) || row
    const name = parts.find((p) => !/^https?:\/\//i.test(p)) || basename(url)
    extra.push({ name, url })
  }
  return saveCatalog([...existing, ...extra])
}

function basename(url: string) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || 'plugin') }
  catch { return 'plugin' }
}
