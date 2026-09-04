import { tmdb } from './tmdb'

const HOSTS = [
  'https://mediafusionfortheweebs.midnightignite.me',
  'https://mediafusion.elfhosted.com',
  'https://mediafusion-dev.elfhosted.com',
]

async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 18000 })
    return r?.json || {}
  }
  const res = await fetch(url)
  return res.ok ? res.json() : {}
}

export async function mediafusionStreams(opts: {
  type: 'movie' | 'tv'
  tmdbId: number | string
  season?: number
  episode?: number
  anime?: boolean
  malId?: string | number
}) {
  const s = opts.season ?? 1
  const e = opts.episode ?? 1
  const kind = opts.type === 'movie' ? 'movie' : 'series'
  const ids: string[] = []
  try {
    const ext = await tmdb.getExternalIds(opts.type, Number(opts.tmdbId))
    if (ext?.imdb_id) ids.push(opts.type === 'movie' ? ext.imdb_id : `${ext.imdb_id}:${s}:${e}`)
  } catch {}
  if (opts.anime && opts.malId) {
    ids.unshift(opts.type === 'movie' ? `mal:${opts.malId}` : `mal:${opts.malId}:${s}:${e}`)
  }
  ids.push(opts.type === 'movie' ? `tmdb:${opts.tmdbId}` : `tmdb:${opts.tmdbId}:${s}:${e}`)
  const hosts = opts.anime ? [HOSTS[1], HOSTS[0], HOSTS[2]] : HOSTS
  for (const host of hosts) {
    for (const id of ids) {
      try {
        const d = await getJson(`${host}/stream/${kind}/${encodeURIComponent(id)}.json`)
        const rows = (d.streams || []).map((st: any) => ({
          title: st.title || st.name || st.description || 'MediaFusion',
          url: st.url || (st.infoHash ? `magnet:?xt=urn:btih:${st.infoHash}` : ''),
        })).filter((st: any) => st.url)
        const http = rows.filter((st: any) => /^https?:/i.test(st.url))
        if (http.length) return http
        if (rows.length) return rows
      } catch {}
    }
  }
  return []
}
