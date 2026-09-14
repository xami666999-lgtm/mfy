/** The Black Hole Bay aggregator — https://docs.theblackholebay.lol/api */

export type BhbHit = {
  name: string
  magnet: string
  seeders: number
  sizeLabel: string
  source: string
  quality: string
}

function qualityOf(name: string) {
  const t = name.toUpperCase()
  if (/2160|4K|UHD/.test(t)) return '4K'
  if (/1080/.test(t)) return '1080P'
  if (/720/.test(t)) return '720P'
  return 'SD'
}

export async function blackholeSearch(query: string): Promise<BhbHit[]> {
  const q = String(query || '').trim()
  if (!q) return []
  const url = `https://theblackholebay.lol/api/search?q=${encodeURIComponent(q)}&category=200`
  try {
    const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
    let data: any = null
    if (api?.fetchJson) data = (await api.fetchJson(url, { timeoutMs: 12000 }))?.json ?? (await api.fetchJson(url))
    else data = await (await fetch(url)).json()
    const rows = Array.isArray(data?.results) ? data.results : []
    return rows
      .filter((r: any) => r?.magnet || r?.info_hash)
      .slice(0, 24)
      .map((r: any) => ({
        name: String(r.name || 'Torrent'),
        magnet: String(r.magnet || (r.info_hash ? `magnet:?xt=urn:btih:${r.info_hash}` : '')),
        seeders: Number(r.seeders || 0),
        sizeLabel: String(r.sizeLabel || ''),
        source: String(r.source || 'BHB'),
        quality: qualityOf(String(r.name || '')),
      }))
  } catch {
    return []
  }
}

export function titleLogoFromDetail(detail: any): string {
  const logos = detail?.images?.logos || []
  const pick = logos.find((l: any) => l.iso_639_1 === 'en' && l.file_path)
    || logos.find((l: any) => !l.iso_639_1 && l.file_path)
    || logos.find((l: any) => l.file_path)
  return pick?.file_path ? `https://image.tmdb.org/t/p/w500${pick.file_path}` : ''
}
