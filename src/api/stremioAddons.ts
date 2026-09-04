async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 18000 })
    return r?.json || {}
  }
  try { return await (await fetch(url)).json() } catch { return {} }
}

export const ADDONS = {
  marvel: { base: 'https://addon-marvel.gonp.deno.net', type: 'Marvel', catalog: 'marvel-mcu' },
  dc: { base: 'https://addon-dc-cq85.onrender.com', type: 'DC', catalog: 'dc-movies' },
  starwars: { base: 'https://addon-star-wars-u9e3.onrender.com', type: 'StarWars', catalog: 'sw-movies-series-chronological' },
  streaming: { base: 'https://catalog.ers.pw', type: 'movie', catalog: 'nfx' },
  streamingTv: { base: 'https://catalog.ers.pw', type: 'series', catalog: 'nfx' },
  animestream: { base: 'https://animestream-addon.keypop3750.workers.dev', type: 'anime', catalog: 'top' },
  animeworld: { base: 'https://aw-catalog.vercel.app', type: 'anime', catalog: 'animeworld' },
  animecatalogs: { base: 'https://1fe84bc728af-stremio-anime-catalogs.baby-beamup.club', type: 'anime', catalog: 'kitsu-trending' },
  onepace: { base: 'https://fedew04.github.io/OnePaceStremio', type: 'series', catalog: 'seriesCatalog' },
  iptv: { base: 'https://fun.kort.workers.dev', type: 'tv', catalog: 'cat_all' },
  streailer: { base: 'https://streailer.elfhosted.com' },
  morelike: { base: 'https://bbab4a35b833-more-like-this.baby-beamup.club' },
  flix: { base: 'https://flixnest.app/flix-streams' },
  streamsppv: { base: 'https://addon3.gstream.stream' },
  sportsstreams: { base: 'https://sports.highfly.dev' },
  nyaa: { base: 'https://c5541ffce7d3-aniscraper.baby-beamup.club' },
  animeflv: { base: 'https://pigamer37.alwaysdata.net' },
  youtubio: { base: 'https://youtubio.elfhosted.com' },
}

export function toCard(m: any) {
  const id = String(m.id || '')
  const tmdb = id.startsWith('tmdb:') ? id.slice(5).split(':')[0] : ''
  const imdb = id.startsWith('tt') ? id : m.imdb_id
  return {
    id: tmdb || imdb || id,
    imdb,
    stremioId: id,
    title: m.name || m.title,
    name: m.name || m.title,
    poster_path: m.poster || m.poster_path || '',
    backdrop_path: m.background || m.logo,
    overview: m.description,
    media_type: m.type === 'series' || m.type === 'tv' ? 'tv' : (m.type === 'movie' ? 'movie' : m.type),
    vote_average: Number(m.imdbRating) || 0,
  }
}

export async function addonCatalog(key: keyof typeof ADDONS, type?: string, catalogId?: string) {
  const a: any = ADDONS[key]
  if (!a?.base) return []
  const t = type || a.type
  const c = catalogId || a.catalog
  if (!t || !c) return []
  const d = await getJson(`${a.base}/catalog/${t}/${c}.json`)
  return (d.metas || []).map(toCard)
}

export async function addonStreams(base: string, type: string, id: string) {
  const d = await getJson(`${base}/stream/${type}/${encodeURIComponent(id)}.json`)
  return (d.streams || []).map((s: any) => ({
    title: s.title || s.name || s.description || 'Stream',
    url: s.url || (s.ytId ? `https://www.youtube.com/watch?v=${s.ytId}` : '') || (s.infoHash ? `magnet:?xt=urn:btih:${s.infoHash}` : ''),
    quality: String(s.name || s.title || ''),
  })).filter((s: any) => s.url)
}

export async function trailerUrl(imdbOrTmdb: string, type: 'movie' | 'series' = 'movie') {
  const id = String(imdbOrTmdb)
  const tries = [id, id.startsWith('tt') ? id : `tt${id}`, `tmdb:${id}`]
  for (const sid of tries) {
    const rows = await addonStreams(ADDONS.streailer.base, type, sid)
    const hit = rows.find((r) => /youtube|youtu\.be|trailer/i.test(r.url + r.title)) || rows[0]
    if (hit) return hit.url
  }
  return ''
}

export async function moreLike(imdb: string, type: 'movie' | 'series' = 'movie') {
  const rows = await addonStreams(ADDONS.morelike.base, type, imdb)
  return rows
}

export function isOnePiece(title?: string) {
  return /one\s*piece/i.test(String(title || ''))
}

export const STREAM_HOST = {
  flix: ADDONS.flix.base,
  nyaa: ADDONS.nyaa.base,
  animeflv: ADDONS.animeflv.base,
  onepace: ADDONS.onepace.base,
  streamsppv: ADDONS.streamsppv.base,
  sportsstreams: ADDONS.sportsstreams.base,
}
