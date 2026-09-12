/** Seekr hover previews — https://seekr.tv/docs */

export type SeekCue = { start: number; end: number; url: string; x: number; y: number; w: number; h: number }

function key() {
  try { return String(localStorage.getItem('mfy-seekr-key') || '').trim() } catch { return '' }
}

function parseTime(s: string) {
  const p = s.trim().replace(',', '.').split(':')
  if (p.length === 3) return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2])
  if (p.length === 2) return (+p[0]) * 60 + (+p[1])
  return +p[0] || 0
}

export function parseVtt(text: string): SeekCue[] {
  const cues: SeekCue[] = []
  const blocks = text.replace(/\r/g, '').split('\n\n')
  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean)
    const time = lines.find((l) => l.includes('-->'))
    const img = lines.find((l) => /https?:\/\//.test(l) || /#xywh=/.test(l))
    if (!time || !img) continue
    const [a, c] = time.split('-->')
    const [urlPart, hash] = img.split('#')
    const m = String(hash || '').match(/xywh=([\d.]+),([\d.]+),([\d.]+),([\d.]+)/)
    cues.push({
      start: parseTime(a),
      end: parseTime(c || a),
      url: urlPart.trim(),
      x: m ? +m[1] : 0,
      y: m ? +m[2] : 0,
      w: m ? +m[3] : 320,
      h: m ? +m[4] : 180,
    })
  }
  return cues
}

export async function loadSeekr(opts: { tmdb?: number; imdb?: string; season?: number; episode?: number; movie?: boolean; durationSec: number }) {
  const k = key()
  if (!k || opts.durationSec < 30) return [] as SeekCue[]
  const dur = Math.round(opts.durationSec * 1000)
  const q = new URLSearchParams({ duration_ms: String(dur) })
  if (opts.movie && opts.tmdb) q.set('tmdb_id', String(opts.tmdb))
  else if (!opts.movie && opts.tmdb && opts.season && opts.episode) {
    q.set('show_tmdb_id', String(opts.tmdb))
    q.set('season', String(opts.season))
    q.set('episode', String(opts.episode))
  } else if (opts.imdb) q.set('imdb_id', opts.imdb)
  else if (opts.tmdb) q.set('tmdb_id', String(opts.tmdb))
  else return []
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  try {
    const url = `https://api.seekr.tv/sprites?${q.toString()}`
    let json: any = null
    if (api?.fetchJson) {
      json = await api.fetchJson(url, { headers: { 'X-API-Key': k }, timeoutMs: 12000 })
      json = json?.json ?? json
    } else {
      const res = await fetch(url, { headers: { 'X-API-Key': k } })
      if (!res.ok) return []
      json = await res.json()
    }
    const vttUrl = json?.vtt_url
    if (!vttUrl) return []
    let text = ''
    if (api?.fetchText) {
      const r = await api.fetchText(vttUrl, 12000)
      text = r?.text || ''
    } else {
      text = await (await fetch(vttUrl)).text()
    }
    return parseVtt(text)
  } catch {
    return []
  }
}

export function cueAt(cues: SeekCue[], sec: number) {
  if (!cues.length) return null
  let best = cues[0]
  for (const c of cues) {
    if (c.start <= sec) best = c
    else break
  }
  return best
}
