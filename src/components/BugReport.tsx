import { useState } from 'react'
import { useStore } from '../store'

export default function BugReport({ onClose }: { onClose: () => void }) {
  const page = useStore((s) => s.currentPage)
  const [what, setWhat] = useState('')
  const [sent, setSent] = useState(false)

  function send() {
    const body = [
      `Page: ${page}`,
      `App: MFY 1.2.78`,
      '',
      what.trim() || '(no details)',
    ].join('\n')
    try {
      const rows = JSON.parse(localStorage.getItem('mfy-bugs') || '[]')
      rows.unshift({ page, what, at: new Date().toISOString() })
      localStorage.setItem('mfy-bugs', JSON.stringify(rows.slice(0, 30)))
    } catch {}
    const url = `https://github.com/xami666999-lgtm/mfy/issues/new?title=${encodeURIComponent('MFY bug: ' + page)}&body=${encodeURIComponent(body)}`
    const api = (window as any).electronAPI
    if (api?.openExternal) api.openExternal(url)
    else window.open(url, '_blank')
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 grid place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#140810] border border-white/10 p-5 text-white">
        <p className="text-[11px] tracking-[0.2em] text-[#FF1493] font-bold">REPORT A BUG</p>
        <h2 className="text-lg font-black mt-1 mb-3">Tell Grok what broke</h2>
        <p className="text-xs text-white/40 mb-3">Current page: {page}</p>
        <textarea value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What did you click? What happened? (YouTube error, black Play, empty manga…)" className="w-full h-28 rounded-xl bg-white/5 border border-white/10 p-3 text-sm mb-3" />
        {sent ? <p className="text-sm text-[#FF1493] mb-3">GitHub issue window opened. Submit it there so I see it next time.</p> : null}
        <div className="flex gap-2">
          <button type="button" className="flex-1 h-11 rounded-xl bg-[#FF1493] font-bold" onClick={send}>Open GitHub issue</button>
          <button type="button" className="h-11 px-4 rounded-xl bg-white/10" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
