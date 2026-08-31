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
  { name: 'free-tv/iptv index', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/index.m3u' },
  { name: 'free-tv/iptv countries', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/countries.m3u' },
  { name: 'free-tv/iptv categories', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/categories.m3u' },
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
    <div className="p-6 md:p-8 bg-black/30 min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white">IPTV</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/40">Free live channels</span>
          <button
            onClick={() => setSortAlpha(!sortAlpha)}
            className="text-white/50 hover:text-white/70 text-xs transition-colors"
          >
            {sortAlpha ? '↕ Sort A-Z' : '↕ Sort Default'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur rounded-xl p-5">
            <div className="flex gap-2 mb-4">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load(url)}
                placeholder="Paste playlist URL or search..."
                className="flex-1 bg-white/10 border border-white/15 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              />
              <button
                onClick={() => load(url)}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-500 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-2" /> : 'Load'}
              </button>
              <button
                onClick={importFile}
                className="px-4 py-2 rounded-lg bg-white/10 text-white/40 hover:text-white/60 transition-colors"
              >
                Import .m3u
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {SAMPLE_PLAYLISTS.map((p) => (
                <button
                  key={p.url}
                  type="button"
                  onClick={() => load(p.url)}
                  className="px-3 py-1.5 rounded-full text-[10px] border border-white/15 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>

            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Categories</h2>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-1.5 rounded text-[10px] border border-white/15 text-white/40 hover:bg-white/10 hover:text-black transition-colors">All</button>
            <button className="px-3 py-1.5 rounded text-[10px] border border-white/15 text-white/40 hover:bg-white/10 hover:text-black transition-colors">Series</button>
            <button className="px-3 py-1.5 rounded text-[10px] border border-white/15 text-white/40 hover:bg-white/10 hover:text-black transition-colors">Movies</button>
            <button className="px-3 py-1.5 rounded text-[10px] border border-white/15 text-white/40 hover:bg-white/10 hover:text-black transition-colors">Sports</button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {channels.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {visible.map((c, i) => (
              <a
                key={`${c.url}-${i}`}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all p-4 flex flex-col items-center gap-2"
              >
                {c.logo ? (
                  <img
                    src={c.logo}
                    alt={c.name}
                    loading="lazy"
                    className="w-10 h-10 object-contain rounded-md"
                    onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Tv className="w-5 h-5 text-white/30" />
                  </div>
                )}
                <span className="text-xs text-white/70 line-clamp-1">{c.name}</span>
              </a>
            ))}
          </div>
        )}

        {channels.length === 0 && !loading && !error && (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 w-16 h-16 grid place-items-center rounded-2xl bg-white/5 border border-white/10 text-white/30">
              <Tv className="w-7 h-7" />
            </div>
            <p className="text-base text-white/40 mb-2">Load an IPTV playlist above to start watching live channels.</p>
            <p className="text-sm text-white/30">Paste any public or personal .m3u URL, or pick one of the free sample playlists.</p>
          </div>
        )}
      </div>
    </div>
  )
}