function slug(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ratingFrom(html: string) {
  const m = html.match(/name="twitter:data2" content="([0-9.]+) out of 5"/)
  return m ? m[1] : ''
}

async function page(slugName: string) {
  const film = `https://letterboxd.com/film/${slugName}/`
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(film)}`)
  if (!res.ok) return ''
  const html = await res.text()
  if (html.length < 8000 || /just a moment/i.test(html)) return ''
  return ratingFrom(html)
}

export async function letterboxdScore(id: number | string, title: string, year?: string) {
  const key = `mfy-lb:${id}`
  try {
    const cached = localStorage.getItem(key)
    if (cached) return cached === '-' ? '' : cached
  } catch {}
  const tries = [slug(title)]
  if (year) tries.push(`${slug(title)}-${year}`)
  let score = ''
  for (const name of tries) {
    score = await page(name).catch(() => '')
    if (score) break
  }
  try { localStorage.setItem(key, score || '-') } catch {}
  return score
}
