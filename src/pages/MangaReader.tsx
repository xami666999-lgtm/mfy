import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { titleOf } from '../components/MediaShelf'

async function md(path: string) {
  const url = `https://api.mangadex.org${path}`
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 20000 })
    if (r?.ok && r.json) return r.json
    throw new Error(r?.error || 'MangaDex failed')
  }
  return (await fetch(url)).json()
}

export default function MangaReader() {
  const { selectedMedia, setCurrentPage } = useStore()
  const title = String((selectedMedia as any)?.title || selectedMedia?.id || 'Manga')
  const [mangaId, setMangaId] = useState('')
  const [chapters, setChapters] = useState<any[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [err, setErr] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const s = await md(`/manga?title=${encodeURIComponent(title)}&limit=5`)
        const id = s?.data?.[0]?.id
        if (!id) { setErr('No manga chapters found'); return }
        setMangaId(id)
        const feed = await md(`/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=40`)
        setChapters(feed?.data || [])
      } catch {
        setErr('Could not load manga')
      }
    })()
  }, [title])

  async function openChapter(id: string) {
    setPages([])
    setIdx(0)
    try {
      const at = await md(`/at-home/server/${id}`)
      const base = at.baseUrl
      const hash = at.chapter.hash
      const files = at.chapter.dataSaver || at.chapter.data || []
      setPages(files.map((f: string) => `${base}/data-saver/${hash}/${f}`))
    } catch {
      setErr('Chapter pages failed')
    }
  }

  return (
    <div className="page-fade-enter p-6 text-white max-w-5xl mx-auto">
      <button type="button" className="text-sm text-white/50 mb-4 inline-flex items-center gap-2" onClick={() => setCurrentPage('manga')}>
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-2xl font-bold mb-1">{title}</h1>
      <p className="text-xs text-[#FF1493] mb-5">MFY Reader · MangaDex</p>
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
      {pages.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button type="button" disabled={idx === 0} onClick={() => setIdx((n) => Math.max(0, n - 1))} className="px-3 h-9 rounded-lg bg-white/10"><ChevronLeft size={16} /></button>
            <span className="text-xs text-white/50">{idx + 1} / {pages.length}</span>
            <button type="button" disabled={idx >= pages.length - 1} onClick={() => setIdx((n) => Math.min(pages.length - 1, n + 1))} className="px-3 h-9 rounded-lg bg-white/10"><ChevronRight size={16} /></button>
          </div>
          <img src={pages[idx]} alt="" className="w-full rounded-lg bg-black" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="grid gap-2">
          {chapters.map((c) => (
            <button key={c.id} type="button" className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF1493]/40" onClick={() => openChapter(c.id)}>
              Chapter {c.attributes?.chapter || '?'} {c.attributes?.title ? `· ${c.attributes.title}` : ''}
            </button>
          ))}
          {!chapters.length && !err && <p className="text-white/40 text-sm">Looking up chapters…</p>}
        </div>
      )}
    </div>
  )
}
