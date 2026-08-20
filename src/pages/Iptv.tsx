import { useEffect, useRef, useState } from 'react'
import { Tv, Radio, RefreshCw, Link2, Play } from 'lucide-react'
import { useStore } from '../store'

interface Channel {
  name: string
  url: string
  logo: string | null
  group: string | null
}

function parseM3U(text: string): Channel[] {
  const lines = text.split(/\r?\n/)
  const channels: Channel[] = []
  let pending: { attrs: string; name: string } | null = null
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#EXTINF')) {
      const attrs = line.slice(line.indexOf(':') + 1)
      const nameMatch = attrs.match(/,(.+)$/)
      const name = nameMatch ? nameMatch[1].trim() : 'Channel'
      pending = { attrs, name }
    } else if (!line.startsWith('#')) {
      if (pending) {
        const logoMatch = pending.attrs.match(/tvg-logo="([^"]*)"/)
        const groupMatch = pending.attrs.match(/group-title="([^"]*)"/)
        channels.push({
          name: pending.name,
          url: line,
          logo: logoMatch ? logoMatch[1] || null : null,
          group: groupMatch ? groupMatch[1] || null : null,
        })
      } else {
        channels.push({ name: 'Channel', url: line, logo: null, group: null })
      }
      pending = null
    }
  }
  return channels
}

const SAMPLE_PLAYLISTS: { name: string; url: string }[] = [
  { name: 'iptv-org (free public)', url: 'https://iptv-org.github.io/iptv/index.m3u' },
  { name: 'iptv-org countries', url: 'https://iptv-org.github.io/iptv/countries.m3u' },
  { name: 'iptv-org categories', url: 'https://iptv-org.github.io/iptv/categories.m3u' },
]

export default function Iptv() {
  const { setCurrentStreamUrl, setCurrentPage } = useStore()
  const [url, setUrl] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [sortAlpha, setSortAlpha] = useState(false)

  async function load(urlToLoad: string) {
    const u = (urlToLoad || url).trim()
    if (!u) return
    setLoading(true)
    setError('')
    try {
      let text = ''
      const api = (window as any).electronAPI
      if (api?.fetchText) {
        const r = await api.fetchText(u)
        if (r?.ok) {
          text = r.text
        } else {
          throw new Error(r?.error || 'fetch failed')
        }
      } else {
        const res = await fetch(u)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        text = await res.text()
      }
      const parsed = parseM3U(text)
      if (parsed.length === 0) throw new Error('No channels found in that playlist')
      setChannels(parsed)
      setUrl(u)
    } catch {
      setError('Could not load that playlist. Check the URL and that it points to an .m3u file.')
    }
    setLoading(false)
  }

  async function importFile() {
    const api = (window as any).electronAPI
    if (!api?.selectFileText) return
    setError('')
    const r = await api.selectFileText()
    if (!r?.text) return
    const parsed = parseM3U(r.text)
    if (parsed.length === 0) { setError('No channels found in that file.'); return }
    setChannels(parsed)
    setUrl(r.path || '')
  }

  function play(ch: Channel) {
    setCurrentStreamUrl(ch.url)
    setCurrentPage('player')
  }

  const groups = Array.from(new Set(channels.map((c) => c.group).filter(Boolean) as string[])).sort()
  const visible = channels
    .filter((c) => (group ? c.group === group : true))
    .filter((c) => (filter ? c.name.toLowerCase().includes(filter.toLowerCase()) : true))
    .sort((a, b) => (sortAlpha ? a.name.localeCompare(b.name) : 0))

  return (
    <div className="p-6 md:p-8 page-fade-enter">
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2"><Tv className="w-4.5 h-4.5" /> IPTV</h2>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setSortAlpha(!sortAlpha)}
          className="h-7 px-3 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/50 hover:text-white/70"
        >
          {sortAlpha ? 'Sort: A–Z' : 'Sort: Default'}
        </button>
      </div>

      <div className="mb-5 max-w-2xl">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Link2 className="w-3.5 h-3.5 text-white/30" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(url)}
              placeholder="Paste an .m3u playlist URL, e.g. https://iptv-org.github.io/iptv/index.m3u"
              className="flex-1 bg-transparent text-xs text-white placeholder-white/20 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => load(url)}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.08] border border-white/[0.1] text-xs text-white/80 hover:bg-white/[0.12] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Load
          </button>
          <button
            type="button"
            onClick={importFile}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#FF1493]/10 border border-[#FF1493]/25 text-xs text-[#FF1493]/80 hover:bg-[#FF1493]/20"
          >
            Import .m3u file…
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SAMPLE_PLAYLISTS.map((p) => (
            <button
              key={p.url}
              type="button"
              onClick={() => load(p.url)}
              className="px-3 py-1.5 rounded-full text-[11px] border border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/60 hover:border-white/10"
            >
              {p.name}
            </button>
          ))}
        </div>
        {error && <p className="text-xs text-red-400/80 mt-3">{error}</p>}
      </div>

      {channels.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search channels…"
              className="h-8 px-3 rounded-md bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/20 focus:outline-none w-56"
            />
            <div className="flex-1" />
            <span className="text-[11px] text-white/30">{visible.length} channels</span>
          </div>
          {groups.length > 0 && (
            <div className="flex gap-1.5 mb-5 flex-wrap">
              <button
                type="button"
                onClick={() => setGroup(null)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${group === null ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/[0.06] hover:text-white/50'}`}
              >
                All
              </button>
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGroup(g)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all ${group === g ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-white/30 border-white/[0.06] hover:text-white/50'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3">
            {visible.map((c, i) => (
              <button
                key={`${c.url}-${i}`}
                type="button"
                onClick={() => play(c)}
                className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/15 transition-all text-center"
              >
                {c.logo ? (
                  <img src={c.logo} alt="" loading="lazy" className="w-12 h-12 object-contain"
                    onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }} />
                ) : (
                  <div className="w-12 h-12 grid place-items-center rounded-full bg-white/[0.06] text-white/30">
                    <Radio className="w-5 h-5" />
                  </div>
                )}
                <span className="text-[11px] text-white/70 leading-snug line-clamp-2">{c.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {channels.length === 0 && !loading && !error && (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 w-16 h-16 grid place-items-center rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/25">
            <Tv className="w-7 h-7" />
          </div>
          <p className="text-sm text-white/30">Load an IPTV playlist above to start watching live channels.</p>
          <p className="text-[11px] text-white/20 mt-2 max-w-md mx-auto">Paste any public or personal .m3u URL, or pick one of the free sample playlists. Channels play through the built-in HLS player.</p>
        </div>
      )}
    </div>
  )
}