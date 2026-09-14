export function ageRating(detail: any): string {
  const movie = detail?.release_dates?.results || []
  const tv = detail?.content_ratings?.results || []
  const pick = (rows: any[]) => {
    const us = rows.find((r) => r.iso_3166_1 === 'US')
    const cert = us?.release_dates?.find((x: any) => x.certification)?.certification || us?.rating
    return String(cert || '').trim()
  }
  return pick(movie) || pick(tv) || ''
}

export function keywordNames(detail: any): string[] {
  const list = detail?.keywords?.keywords || detail?.keywords?.results || detail?.keywords || []
  return (Array.isArray(list) ? list : []).map((k: any) => k.name).filter(Boolean).slice(0, 8)
}

export function studioNames(detail: any): { name: string; logo?: string }[] {
  const cos = detail?.production_companies || detail?.networks || []
  return (cos || []).slice(0, 6).map((c: any) => ({
    name: c.name,
    logo: c.logo_path ? `https://image.tmdb.org/t/p/w154${c.logo_path}` : '',
  }))
}
