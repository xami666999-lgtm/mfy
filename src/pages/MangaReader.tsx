import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { fireflyManga } from '../api/fireflyManga'
import RateModal from '../components/RateModal'
import { syncRating } from '../lib/trackers'

async function md(path: string) {
  const url = `https://api.mangadex.org${path}`
  const api = typeof window !== 'undefined' ? (window as any).electronAPI : null
  if (api?.fetchJson) {
    const r = await api.fetchJson(url, { timeoutMs: 25000 })
    if (r?.ok && r.json) return r.json
    throw new Error(r?.error || 'MangaDex failed')
  }
  return (await fetch(url)).json()
}

function cleanTitle(raw: string) {
  return String(raw || '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*\[.*?\]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function MangaReader() {
  const { selectedMedia, setCurrentPage } = useStore()
  const title = String((selectedMedia as any)?.title || (selectedMedia as any)?.name || selectedMedia?.id || 'Manga')
  const [chapters, setChapters] = useState<any[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [ffId, setFfId] = useState('')
  const [rateOpen, setRateOpen] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true)
      setErr('')
      const queries = [cleanTitle(title), title, title.split(' ').slice(0, 3).join(' ')].filter(Boolean)
      try {
        let found: any = null
        for (const q of queries) {
          const s = await md(`/manga?title=${encodeURIComponent(q)}&limit=8&availableTranslatedLanguage[]=en&order[relevance]=desc`)
          found = s?.data?.[0]
          if (found) break
        }
        if (!found) {
          const s = await md(`/manga?title=${encodeURIComponent(cleanTitle(title) || title)}&limit=8`)
          found = s?.data?.[0]
        }
        let list: any[] = []
        if (found?.id) {
          const feed = await md(`/manga/${found.id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=100`)
          list = feed?.data || []
          if (!list.length) {
            const any = await md(`/manga/${found.id}/feed?order[chapter]=asc&limit=100`)
            list = any?.data || []
          }
        }
        if (!list.length) {
          const hits = await fireflyManga.search(cleanTitle(title) || title)
          const pick = hits[0]
          if (pick?.id) {
            setFfId(String(pick.id))
            const ffch = await fireflyManga.chapters(String(pick.id))
            list = ffch.map((c) => ({ id: c.id, attributes: { chapter: c.number, title: c.title }, ff: true }))
          }
        }
        if (!live) return
        setChapters(list)
        if (!list.length) setErr('No readable chapters yet')
        else {
          const first = list[0]
          openChapter(first.id, first.ff).catch(() => {})
        }
      } catch {
        try {
          const hits = await fireflyManga.search(cleanTitle(title) || title)
          const pick = hits[0]
          if (pick?.id && live) {
            setFfId(String(pick.id))
            const ffch = await fireflyManga.chapters(String(pick.id))
            setChapters(ffch.map((c) => ({ id: c.id, attributes: { chapter: c.number, title: c.title }, ff: true })))
            if (!ffch.length) setErr('No readable chapters yet')
          } else if (live) setErr('Could not load manga')
        } catch {
          if (live) setErr('Could not load manga')
        }
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
  }, [title])

  async function openChapter(id: string, ff?: boolean) {
    setPages([])
    setIdx(0)
    setErr('')
    try {
      if (ff || ffId) {
        const imgs = await fireflyManga.pages(ffId || String(selectedMedia?.id), id)
        if (imgs.length) { setPages(imgs); return }
      }
      const at = await md(`/at-home/server/${id}`)
      const base = at.baseUrl
      const hash = at.chapter.hash
      const files = at.chapter.dataSaver || at.chapter.data || []
      setPages(files.map((f: string) => `${base}/data-saver/${hash}/${f}`))
    } catch {
      setErr('Chapter pages failed')
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx((n) => n + 1)
      if (e.key === 'ArrowLeft') setIdx((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="page-fade-enter p-6 text-white max-w-5xl mx-auto">
      <button type="button" className="text-sm text-white/50 mb-4 inline-flex items-center gap-2" onClick={() => setCurrentPage('manga')}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <button type="button" className="text-xs px-3 h-8 rounded-lg bg-[#FF1493]" onClick={() => setRateOpen(true)}>Rate on AniList</button>
      </div>
      <p className="text-xs text-[#FF1493] mb-5">MFY Reader · MangaDex / FireFly</p>
      {rateOpen && (
        <RateModal
          title={title}
          kind={/novel/i.test(String((selectedMedia as any)?.type)) ? 'novel' : 'manga'}
          onSubmit={(s, n) => {
            syncRating({ title, type: /novel/i.test(String((selectedMedia as any)?.type)) ? 'novel' : 'manga', score: s, serializdOn: false, note: n }).catch(() => {})
            setRateOpen(false)
          }}
          onSkip={() => setRateOpen(false)}
        />
      )}
      {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
      {loading && <p className="text-white/40 text-sm">Loading chapters…</p>}
      {pages.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <button type="button" disabled={idx === 0} onClick={() => setIdx((n) => Math.max(0, n - 1))} className="px-3 h-9 rounded-lg bg-white/10"><ChevronLeft size={16} /></button>
            <span className="text-xs text-white/50">{Math.min(idx + 1, pages.length)} / {pages.length}</span>
            <button type="button" disabled={idx >= pages.length - 1} onClick={() => setIdx((n) => Math.min(pages.length - 1, n + 1))} className="px-3 h-9 rounded-lg bg-white/10"><ChevronRight size={16} /></button>
          </div>
          <img src={pages[Math.min(idx, pages.length - 1)]} alt="" className="w-full rounded-lg bg-black" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="grid gap-2">
          {chapters.map((c) => (
            <button key={c.id} type="button" className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#FF1493]/40" onClick={() => openChapter(c.id, c.ff)}>
              Chapter {c.attributes?.chapter || '?'} {c.attributes?.title ? `· ${c.attributes.title}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
