const KEY = 'mfy-stremio-addons'

export type InstalledAddon = {
  id: string
  name: string
  description: string
  transport: string
  manifestUrl: string
  resources: string[]
}

export function addonTransport(input: string) {
  let raw = String(input || '').trim()
  if (!raw) throw new Error('Paste a Nuvio or Stremio addon link.')
  raw = raw.replace(/^stremio:\/\//i, 'https://')
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  const url = new URL(raw)
  let path = url.pathname.replace(/\/+$/, '')
  if (/\/configure$/i.test(path)) path = path.replace(/\/configure$/i, '')
  if (!/\/manifest\.json$/i.test(path)) path = `${path}/manifest.json`
  url.pathname = path
  url.hash = ''
  return url.toString()
}

function read(): InstalledAddon[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function write(rows: InstalledAddon[]) {
  try { localStorage.setItem(KEY, JSON.stringify(rows)) } catch {}
  return rows
}

export function installedAddons() {
  return read()
}

export function removeAddon(id: string) {
  return write(read().filter((row) => row.id !== id))
}

async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const result = await api.fetchJson(url, { timeoutMs: 18000 })
    if (result?.json) return result.json
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Addon did not answer (${res.status}).`)
  return res.json()
}

export async function installAddon(input: string) {
  const manifestUrl = addonTransport(input)
  const manifest = await getJson(manifestUrl)
  const id = String(manifest?.id || '')
  const name = String(manifest?.name || '')
  if (!id || !name) throw new Error('That link is not a Stremio or Nuvio addon.')
  const resources = (Array.isArray(manifest.resources) ? manifest.resources : []).map((row: any) => typeof row === 'string' ? row : row?.name).filter(Boolean)
  const transport = String(manifest.transportUrl || manifestUrl).replace(/\/manifest\.json$/i, '')
  const row: InstalledAddon = {
    id,
    name,
    description: String(manifest.description || '').slice(0, 180),
    transport,
    manifestUrl,
    resources,
  }
  const next = [row, ...read().filter((item) => item.id !== id)]
  write(next)
  return row
}

function streamUrl(stream: any) {
  if (stream?.url) return String(stream.url)
  if (stream?.externalUrl) return String(stream.externalUrl)
  if (stream?.ytId) return `https://www.youtube.com/watch?v=${stream.ytId}`
  if (stream?.infoHash) return `magnet:?xt=urn:btih:${stream.infoHash}`
  return ''
}

export async function streamsFromInstalled(opts: {
  type: 'movie' | 'tv'
  tmdbId: number | string
  imdb?: string
  season?: number
  episode?: number
}) {
  const addons = read().filter((row) => !row.resources.length || row.resources.includes('stream'))
  if (!addons.length) return []
  const kind = opts.type === 'movie' ? 'movie' : 'series'
  const season = opts.season || 1
  const episode = opts.episode || 1
  const ids = [
    opts.imdb ? (opts.type === 'movie' ? opts.imdb : `${opts.imdb}:${season}:${episode}`) : '',
    opts.type === 'movie' ? `tmdb:${opts.tmdbId}` : `tmdb:${opts.tmdbId}:${season}:${episode}`,
  ].filter(Boolean)
  const out: { title: string; url: string; quality: string; addon: string }[] = []
  const seen = new Set<string>()
  await Promise.all(addons.map(async (addon) => {
    for (const id of ids) {
      try {
        const data = await getJson(`${addon.transport}/stream/${kind}/${encodeURIComponent(id)}.json`)
        for (const stream of data?.streams || []) {
          const url = streamUrl(stream)
          if (!url || seen.has(url)) continue
          seen.add(url)
          out.push({
            title: String(stream.title || stream.name || addon.name),
            url,
            quality: String(stream.name || ''),
            addon: addon.name,
          })
        }
        if (out.some((row) => row.addon === addon.name)) break
      } catch {}
    }
  }))
  const http = out.filter((row) => /^https?:/i.test(row.url))
  return [...http, ...out.filter((row) => !http.includes(row))].slice(0, 40)
}
