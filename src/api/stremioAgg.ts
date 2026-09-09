import { tmdb } from './tmdb'
import { ezRank } from './ezremux'

export type AggStream = { title: string; url: string; quality: string; addon: string }

const ADDONS = [
  { id: 'pipe', base: 'https://pipe.boringways.workers.dev' },
  { id: 'torrentio', base: 'https://torrentio.strem.fun' },
  { id: 'comet', base: 'https://comet.elfhosted.com' },
]

async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    if (api?.fetchJson) {
      const r = await api.fetchJson(url, { timeoutMs: 16000 })
      return r?.json || {}
    }
    const res = await fetch(url)
    return res.ok ? res.json() : {}
  } catch {
    return {}
  }
}

function toUrl(s: any) {
  if (s?.url) return String(s.url)
  if (s?.infoHash) {
    const hash = String(s.infoHash)
    const fileIdx = s.fileIdx != null ? `&so=${s.fileIdx}` : ''
    return `magnet:?xt=urn:btih:${hash}${fileIdx}`
  }
  return ''
}

function qualityOf(s: any, title: string) {
  const t = `${s.name || ''} ${title}`
  const m = t.match(/\b(2160p|1080p|720p|480p|4K|UHD)\b/i)
  return m ? m[1] : ''
}

export async function kitsuSearch(title: string) {
  if (!title) return ''
  const d = await getJson(`https://anime-kitsu.strem.fun/catalog/anime/kitsu-anime-list/search=${encodeURIComponent(title)}.json`)
  const hit = (d?.metas || []).find((m: any) => String(m.id || '').startsWith('kitsu:'))
  return hit ? String(hit.id) : ''
}

export async function aggregateStreams(opts: {
  type: 'movie' | 'tv'
  tmdbId: number | string
  season?: number
  episode?: number
  anime?: boolean
  title?: string
}) {
  const s = opts.season ?? 1
  const e = opts.episode ?? 1
  const kind = opts.type === 'movie' ? 'movie' : 'series'
  const ids: string[] = []
  try {
    const ext = await tmdb.getExternalIds(opts.type, Number(opts.tmdbId))
    if (ext?.imdb_id) ids.push(opts.type === 'movie' ? ext.imdb_id : `${ext.imdb_id}:${s}:${e}`)
  } catch {}
  if (opts.anime && opts.title) {
    const kid = await kitsuSearch(opts.title)
    if (kid) ids.unshift(opts.type === 'movie' ? kid : `${kid}:${s}:${e}`)
  }
  ids.push(opts.type === 'movie' ? `tmdb:${opts.tmdbId}` : `tmdb:${opts.tmdbId}:${s}:${e}`)

  const out: AggStream[] = []
  const seen = new Set<string>()
  await Promise.all(ADDONS.map(async (addon) => {
    for (const id of ids) {
      const d = await getJson(`${addon.base}/stream/${kind}/${encodeURIComponent(id)}.json`)
      for (const st of d?.streams || []) {
        const url = toUrl(st)
        if (!url || seen.has(url)) continue
        seen.add(url)
        const title = String(st.title || st.name || st.description || addon.id)
        out.push({ title, url, quality: qualityOf(st, title), addon: addon.id })
      }
      if (out.filter((x) => x.addon === addon.id).length) break
    }
  }))
  const ranked = ezRank(out)
  const http = ranked.filter((x) => /^https?:/i.test(x.url) && !x.url.includes('magnet:'))
  const rest = ranked.filter((x) => !http.includes(x))
  return [...http, ...rest].slice(0, 40)
}

export async function bestPlayable(opts: Parameters<typeof aggregateStreams>[0]) {
  const rows = await aggregateStreams(opts)
  return rows.find((r) => /^https?:/i.test(r.url)) || rows[0] || null
}
