async function getJson(url: string) {
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 18000 })
    if (r?.ok && r.json) return r.json
    throw new Error(r?.error || 'FireFly failed')
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FireFly ${res.status}`)
  return res.json()
}

function bases(): string[] {
  const extra: string[] = []
  try {
    const s = localStorage.getItem('mfy-firefly-manga')
    if (s) extra.push(s.replace(/\/$/, ''))
  } catch {}
  return [
    ...extra,
    'https://manga-api-firefly.onrender.com',
    'https://firefly-manga-api.vercel.app',
    'https://mangaapi-firefly.vercel.app',
  ]
}

function listOf(data: any): any[] {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.result)) return data.result
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.manga)) return data.manga
  return []
}

export const fireflyManga = {
  search: async (q: string) => {
    for (const b of bases()) {
      try {
        const d = await getJson(`${b}/search?query=${encodeURIComponent(q)}&page=1`)
        const rows = listOf(d)
        if (rows.length) {
          return rows.map((x: any) => ({
            id: x.id || x.mangaId || x.slug || x.title,
            title: x.title || x.name,
            image: x.image || x.thumbnail || x.img,
            poster_path: x.image || x.thumbnail || x.img,
            media_type: 'manga',
          }))
        }
      } catch {}
    }
    return []
  },
  latest: async () => {
    for (const b of bases()) {
      try {
        const d = await getJson(`${b}/latest-manga?page=1`)
        const rows = listOf(d)
        if (rows.length) {
          return rows.map((x: any) => ({
            id: x.id || x.mangaId || x.slug || x.title,
            title: x.title || x.name,
            image: x.image || x.thumbnail || x.img,
            poster_path: x.image || x.thumbnail || x.img,
            media_type: 'manga',
          }))
        }
      } catch {}
    }
    return []
  },
  chapters: async (id: string) => {
    for (const b of bases()) {
      try {
        const d = await getJson(`${b}/chapter-info?id=${encodeURIComponent(id)}`)
        const ch = d?.chapters || d?.chapterList || d?.data?.chapters || listOf(d)
        if (Array.isArray(ch) && ch.length) {
          return ch.map((c: any) => ({
            id: String(c.id || c.chapterID || c.chapterId || c.slug || c.href || c.chapter),
            title: c.title || c.name || `Chapter ${c.chapter || c.number || ''}`,
            number: c.chapter || c.number,
          }))
        }
      } catch {}
    }
    return []
  },
  pages: async (mangaId: string, chapterId: string) => {
    for (const b of bases()) {
      try {
        const d = await getJson(`${b}/fetch-chapter?id=${encodeURIComponent(mangaId)}&chapterID=${encodeURIComponent(chapterId)}`)
        const imgs = d?.images || d?.chapter?.images || d?.data?.images || listOf(d)
        const urls = (imgs || []).map((x: any) => (typeof x === 'string' ? x : x.url || x.image || x.img)).filter(Boolean)
        if (urls.length) return urls
        const d2 = await getJson(`${b}/fetch-chapter/${encodeURIComponent(mangaId)}/${encodeURIComponent(chapterId)}`)
        const imgs2 = d2?.images || d2?.chapter?.images || listOf(d2)
        const urls2 = (imgs2 || []).map((x: any) => (typeof x === 'string' ? x : x.url || x.image || x.img)).filter(Boolean)
        if (urls2.length) return urls2
      } catch {}
    }
    return []
  },
}
