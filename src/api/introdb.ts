/** Intro / recap skip for TV and anime only. Uses the public IntroDB read API. */
export type IntroSeg = { start: number; end: number; kind: string }

export async function fetchIntroSegments(opts: {
  imdbId?: string | null
  season?: number
  episode?: number
  isMovie?: boolean
}): Promise<IntroSeg[]> {
  if (opts.isMovie) return []
  const imdb = String(opts.imdbId || '')
  if (!/^tt\d+$/i.test(imdb)) return []
  const season = Number(opts.season || 1)
  const episode = Number(opts.episode || 1)
  const urls = [
    `https://api.introdb.app/segments?imdb_id=${encodeURIComponent(imdb)}&season=${season}&episode=${episode}`,
    `https://api.introdb.app/intro?imdb=${encodeURIComponent(imdb)}`,
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const out: IntroSeg[] = []
      const push = (arr: any, kind: string) => {
        if (!Array.isArray(arr)) return
        for (const s of arr) {
          const start = Number(s.start_sec ?? s.start ?? (s.start_ms != null ? s.start_ms / 1000 : 0)) || 0
          const end = Number(s.end_sec ?? s.end ?? (s.end_ms != null ? s.end_ms / 1000 : 0)) || 0
          if (end > start + 2) out.push({ start, end, kind })
        }
      }
      if (data?.start != null && data?.end != null) {
        out.push({ start: Number(data.start), end: Number(data.end), kind: 'intro' })
      }
      push(data?.intro || data?.intros, 'intro')
      push(data?.recap || data?.recaps, 'recap')
      if (Array.isArray(data?.segments)) {
        for (const s of data.segments) {
          const kind = String(s.segment_type || s.type || 'intro')
          if (kind === 'credits' || kind === 'preview') continue
          const start = Number(s.start_sec ?? s.start ?? 0)
          const end = Number(s.end_sec ?? s.end ?? 0)
          if (end > start + 2) out.push({ start, end, kind })
        }
      }
      if (out.length) return out
    } catch {}
  }
  return []
}
