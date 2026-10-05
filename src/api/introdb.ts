/** Intro, recap, credits, and preview times. TheIntroDB first, IntroDB as fallback. */
export type IntroSeg = { start: number; end: number; kind: string }

function pushSeg(out: IntroSeg[], kind: string, start: number, end: number, durationHint = 0) {
  const s = Number(start) || 0
  let e = Number(end) || 0
  if (e <= s && durationHint > s + 8) e = Math.min(durationHint, s + 90)
  if (e > s + 1) out.push({ start: s, end: e, kind })
}

function fromMs(row: any, kind: string, out: IntroSeg[]) {
  if (!row) return
  const list = Array.isArray(row) ? row : [row]
  for (const s of list) {
    const start = s.start_sec ?? (s.start_ms != null ? Number(s.start_ms) / 1000 : s.start)
    const end = s.end_sec ?? (s.end_ms != null ? Number(s.end_ms) / 1000 : s.end)
    pushSeg(out, kind, Number(start) || 0, Number(end) || 0)
  }
}

export async function fetchIntroSegments(opts: {
  imdbId?: string | null
  tmdbId?: number | string | null
  season?: number
  episode?: number
  isMovie?: boolean
}): Promise<IntroSeg[]> {
  const tmdb = Number(opts.tmdbId || 0)
  const imdb = String(opts.imdbId || '')
  const season = Number(opts.season || 1)
  const episode = Number(opts.episode || 1)
  const urls: string[] = []
  if (tmdb > 0) {
    const q = new URLSearchParams({ tmdb_id: String(tmdb) })
    if (!opts.isMovie) {
      q.set('season', String(season))
      q.set('episode', String(episode))
    }
    urls.push(`https://api.theintrodb.org/v3/media?${q}`)
  }
  if (/^tt\d+$/i.test(imdb)) {
    const q = new URLSearchParams({ imdb_id: imdb })
    if (opts.isMovie) q.set('is_movie', 'true')
    else {
      q.set('season', String(season))
      q.set('episode', String(episode))
    }
    urls.push(`https://api.introdb.app/segments?${q}`)
  }
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      if (data?.error) continue
      const out: IntroSeg[] = []
      fromMs(data?.intro || data?.intros, 'intro', out)
      fromMs(data?.recap || data?.recaps, 'recap', out)
      fromMs(data?.credits, 'credits', out)
      fromMs(data?.outro, 'credits', out)
      fromMs(data?.preview, 'preview', out)
      fromMs(data?.post_credits || data?.['post-credits'], 'preview', out)
      if (Array.isArray(data?.segments)) {
        for (const s of data.segments) {
          const kind = String(s.segment_type || s.type || 'intro')
          const mapped = kind === 'outro' || kind === 'credits' ? 'credits' : kind === 'post-credits' ? 'preview' : kind
          fromMs(s, mapped, out)
        }
      }
      if (out.length) return out
    } catch {}
  }
  return []
}
