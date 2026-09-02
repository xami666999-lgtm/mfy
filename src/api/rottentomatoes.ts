export interface RtScore {
  critics: string | null
  audience: string | null
}

function pick(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null
  for (const k of keys) {
    const v = obj[k]
    if (v == null || v === '' || v === 'N/A') continue
    if (typeof v === 'number') return `${Math.round(v)}%`
    const s = String(v)
    if (/%$/.test(s)) return s
    if (/^\d+(\.\d+)?$/.test(s)) return `${s}%`
    return s
  }
  return null
}

function normalize(data: any): RtScore | null {
  const root = Array.isArray(data) ? data[0] : data?.result || data?.data || data?.movie || data
  if (!root) return null
  const critics = pick(root, [
    'tomatoMeter', 'tomatometer', 'tomatometer_score', 'criticsScore', 'critics_score',
    'meterScore', 'rating', 'score', 'rottenTomatoes', 'rtScore',
  ])
  const audience = pick(root, ['audienceScore', 'audience_score', 'audienceMeter', 'popcornMeter'])
  if (!critics && !audience) return null
  return { critics, audience }
}

export async function fetchRottenTomatoes(name: string): Promise<RtScore | null> {
  const key = (typeof localStorage !== 'undefined' && localStorage.getItem('mfy-rt-rapid-key')) || ''
  if (!key || !name.trim()) return null
  try {
    const res = await fetch(`https://rottentomato.p.rapidapi.com/?name=${encodeURIComponent(name.trim())}`, {
      headers: {
        'x-rapidapi-host': 'rottentomato.p.rapidapi.com',
        'x-rapidapi-key': key,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return null
    return normalize(await res.json())
  } catch {
    return null
  }
}
