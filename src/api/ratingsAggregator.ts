export type AggRating = { key: string; label: string; value: string }

async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 12000 })
    return r?.json || {}
  }
  try { return await (await fetch(url)).json() } catch { return {} }
}

export async function fetchAggregatedRatings(imdbId: string, type: 'movie' | 'series' = 'movie'): Promise<AggRating[]> {
  const id = String(imdbId || '')
  if (!id.startsWith('tt')) return []
  const d = await getJson(`https://rating-aggregator.elfhosted.com/stream/${type}/${id}.json`)
  const text = String((d.streams || []).map((s: any) => s.description || s.name || '').join('\n'))
  const rows: AggRating[] = []
  const push = (key: string, label: string, m: RegExpMatchArray | null) => {
    if (m?.[1]) rows.push({ key, label, value: m[1].trim() })
  }
  push('tmdb', 'TMDb', text.match(/TMDb\s*[:|]?\s*([0-9.]+\/10)/i))
  push('rt', 'RT', text.match(/RT\s*[:|]?\s*([0-9]+\/100|[0-9]+%)/i))
  push('mc', 'MC', text.match(/Metacritic[^0-9]*([0-9]+)/i))
  push('cs', 'CSM', text.match(/Common Sense[^0-9]*([0-9+\-]+)/i))
  push('age', 'Age', text.match(/👶\s*([0-9]+\+?)/))
  const cringe = text.match(/CringeMDB\s*[:|]?\s*([0-9.]+)/i)
  if (cringe) rows.push({ key: 'cringe', label: 'Cringe', value: cringe[1] })
  return rows
}
