const BASE = 'https://youtubio.elfhosted.com'
const CFG = encodeURIComponent('{}')

export type YtItem = {
  id: string
  title: string
  poster: string
  author?: string
}

export function vid(id: string) {
  return String(id || '')
    .replace(/^yt_id:/, '')
    .replace(/^ytsearch:/, '')
    .trim()
}

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

async function fetchJson(url: string, timeoutMs = 12000): Promise<any> {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs })
    return r?.json ?? r
  }
  const res = await fetch(url)
  return res.json()
}

async function invidiousSearch(term: string): Promise<YtItem[]> {
  const path = `/api/v1/search?q=${encodeURIComponent(term || 'music')}&type=video`
  for (const h of INVIDIOUS) {
    try {
      const rows = await fetchJson(h + path, 10000)
      const list = Array.isArray(rows) ? rows : []
      const mapped = list.filter((v: any) => v.videoId).map((v: any) => ({
        id: String(v.videoId),
        title: v.title || 'Video',
        poster: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        author: v.author || '',
      }))
      if (mapped.length) return mapped
    } catch {}
  }
  return []
}

function mapMetas(d: any): YtItem[] {
  return (d?.metas || [])
    .map((m: any) => ({
      id: vid(m.id),
      title: m.name || 'Video',
      poster: m.poster || `https://i.ytimg.com/vi/${vid(m.id)}/hqdefault.jpg`,
      author: m.links?.[0]?.name || m.releaseInfo || '',
    }))
    .filter((x: YtItem) => x.id && x.id.length >= 6)
}

export async function youtubioCatalog(catalogId: string, extra = ''): Promise<YtItem[]> {
  const paths = [
    `${BASE}/${CFG}/catalog/YouTube/${encodeURIComponent(catalogId)}${extra}.json`,
    `${BASE}/catalog/YouTube/${encodeURIComponent(catalogId)}${extra}.json`,
  ]
  for (const url of paths) {
    try {
      const d = await fetchJson(url)
      const rows = mapMetas(d)
      if (rows.length) return rows
    } catch {}
  }
  return []
}

export async function youtubioSearch(term: string): Promise<YtItem[]> {
  const q = term.trim()
  const extras = [
    `/search=${encodeURIComponent(q)}`,
    `/search=${encodeURIComponent(q)}`,
  ]
  const ids = ['yt_id::ytsearch', 'yt_id:ytsearch']
  for (const id of ids) {
    for (const extra of extras) {
      const rows = await youtubioCatalog(id, extra)
      if (rows.length) return rows
    }
  }
  return invidiousSearch(q || 'trending')
}

export async function youtubioDiscover(): Promise<YtItem[]> {
  const rows = await youtubioCatalog('yt_id::ytrec')
  if (rows.length) return rows
  return youtubioSearch('trending')
}

export async function youtubioStream(id: string) {
  const youtubeId = vid(id)
  const urls = [
    `${BASE}/${CFG}/stream/YouTube/${encodeURIComponent('yt_id:' + youtubeId)}.json`,
    `${BASE}/stream/YouTube/${encodeURIComponent('yt_id:' + youtubeId)}.json`,
  ]
  let file: string | undefined
  let external: string | undefined
  for (const url of urls) {
    try {
      const d = await fetchJson(url)
      const streams = d?.streams || []
      const yt = streams.find((s: any) => s.ytId)?.ytId
      if (yt) return { ytId: vid(yt), file: streams.find((s: any) => s.url)?.url as string | undefined, external: streams.find((s: any) => s.externalUrl)?.externalUrl as string | undefined }
      file = streams.find((s: any) => s.url)?.url
      external = streams.find((s: any) => s.externalUrl)?.externalUrl
    } catch {}
  }
  return {
    ytId: youtubeId,
    file,
    external: external || `https://www.youtube.com/watch?v=${youtubeId}`,
  }
}

export function youtubeWatchUrl(id: string) {
  return `https://www.youtube.com/watch?v=${vid(id)}`
}

export function youtubeEmbedUrl(id: string) {
  return `https://www.youtube-nocookie.com/embed/${vid(id)}?autoplay=1&rel=0&modestbranding=1`
}

export const YOUTUBIO_CONFIG = 'https://youtubio.elfhosted.com'
