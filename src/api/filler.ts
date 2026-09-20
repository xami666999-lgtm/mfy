export type FillerMap = Record<number, 'filler' | 'mixed' | 'canon'>

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-n9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace('n9', '0-9')
}

function slugFix(name: string) {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function fillerListUrl(title: string) {
  return `https://www.animefillerlist.com/shows/${slugFix(title)}`
}

export async function fetchFillerMap(title: string): Promise<FillerMap> {
  const url = fillerListUrl(title)
  try {
    const res = await fetch(url)
    if (!res.ok) return {}
    const html = await res.text()
    const out: FillerMap = {}
    const re = /<tr[^>]*class="[^"]*(filler|mixed|canon)[^"]*"[\s\S]*?<td[^>]*class="[^"]*Number[^"]*"[^>]*>\s*(\d+)/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const kind = m[1].toLowerCase()
      const n = Number(m[2])
      if (!n) continue
      out[n] = kind === 'filler' ? 'filler' : kind === 'mixed' ? 'mixed' : 'canon'
    }
    return out
  } catch {
    return {}
  }
}
