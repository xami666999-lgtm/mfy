export async function animeThemeTracks(title: string) {
  const q = String(title || '').trim()
  if (!q) return [] as { name: string; url: string }[]
  try {
    const u = `https://api.animethemes.moe/search?q=${encodeURIComponent(q)}&limit=5`
    const d = await fetch(u).then((r) => r.json())
    const rows = d?.search?.anime || d?.anime || []
    const out: { name: string; url: string }[] = []
    for (const a of rows.slice(0, 3)) {
      const themes = a.animethemes || a.themes || []
      for (const t of themes.slice(0, 4)) {
        const vid = t.animethemeentries?.[0]?.videos?.[0]?.link || t.video || ''
        out.push({ name: `${t.type || 'OP'} ${t.slug || t.name || ''}`.trim(), url: String(vid) })
      }
    }
    return out.filter((x) => x.url).slice(0, 8)
  } catch {
    return []
  }
}
