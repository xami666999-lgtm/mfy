const BASE = 'https://youtubio.elfhosted.com'
const CFG = encodeURIComponent('{}')

export type YtItem = {
  id: string
  title: string
  poster: string
  author?: string
}

function vid(id: string) {
  return String(id || '').replace(/^yt_id:/, '')
}

const INVIDIOUS = ['https://inv.nadeko.net', 'https://yewtu.be', 'https://invidious.flokinet.to']

async function invidiousSearch(term: string): Promise<YtItem[]> {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const path = `/api/v1/search?q=${encodeURIComponent(term || 'music')}&type=video`
  for (const h of INVIDIOUS) {
    try {
      const r = api?.fetchJson ? await api.fetchJson(h + path, { timeoutMs: 10000 }) : { json: await (await fetch(h + path)).json() }
      const rows = Array.isArray(r?.json) ? r.json : []
      const mapped = rows.filter((v: any) => v.videoId).map((v: any) => ({
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

export async function youtubioSearch(term: string): Promise<YtItem[]> {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const url = `${BASE}/${CFG}/catalog/YouTube/${encodeURIComponent('yt_id::ytsearch')}/search=${encodeURIComponent(term)}.json`
  try {
    const d = api?.fetchJson ? (await api.fetchJson(url, { timeoutMs: 12000 }))?.json : await (await fetch(url)).json()
    const rows = (d?.metas || []).map((m: any) => ({
      id: vid(m.id),
      title: m.name || 'Video',
      poster: m.poster || `https://i.ytimg.com/vi/${vid(m.id)}/hqdefault.jpg`,
      author: m.links?.[0]?.name || '',
    })).filter((x: YtItem) => x.id)
    if (rows.length) return rows
  } catch {}
  return invidiousSearch(term)
}

export async function youtubioStream(id: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const url = `${BASE}/${CFG}/stream/YouTube/${encodeURIComponent('yt_id:' + vid(id))}.json`
  try {
    const d = api?.fetchJson ? (await api.fetchJson(url, { timeoutMs: 12000 }))?.json : await (await fetch(url)).json()
    const streams = d?.streams || []
    const yt = streams.find((s: any) => s.ytId)?.ytId || vid(id)
    const file = streams.find((s: any) => s.url)?.url
    return { ytId: yt, file, external: streams.find((s: any) => s.externalUrl)?.externalUrl as string | undefined }
  } catch {
    return { ytId: vid(id) }
  }
}

export const YOUTUBIO_CONFIG = 'https://youtubio.elfhosted.com'
