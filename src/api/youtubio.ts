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

export async function youtubioSearch(term: string): Promise<YtItem[]> {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  const url = `${BASE}/${CFG}/catalog/YouTube/${encodeURIComponent('yt_id::ytsearch')}/search=${encodeURIComponent(term)}.json`
  try {
    const d = api?.fetchJson ? (await api.fetchJson(url, { timeoutMs: 15000 }))?.json : await (await fetch(url)).json()
    return (d?.metas || []).map((m: any) => ({
      id: vid(m.id),
      title: m.name || 'Video',
      poster: m.poster || `https://i.ytimg.com/vi/${vid(m.id)}/hqdefault.jpg`,
      author: m.links?.[0]?.name || '',
    })).filter((x: YtItem) => x.id)
  } catch {
    return []
  }
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
