import { useEffect, useRef, useState, useCallback } from 'react'
import { Tv, Radio, RefreshCw, Link2, Play, Grid, Layout, Search, ChevronDown, MoreHorizontal, Maximize2, Minimize2, Volume2, VolumeX, Settings2, SkipBack, SkipForward, ArrowLeft, Cast } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

interface Channel {
  name: string
  url: string
  logo: string | null
  group: string | null
  tvgId: string | null
  tvgName: string | null
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
        const tvgIdMatch = pending.attrs.match(/tvg-id="([^"]*)"/)
        const tvgNameMatch = pending.attrs.match(/tvg-name="([^"]*)"/)
        channels.push({
          name: pending.name,
          url: line,
          logo: logoMatch ? logoMatch[1] || null : null,
          group: groupMatch ? groupMatch[1] || null : null,
          tvgId: tvgIdMatch ? tvgIdMatch[1] || null : null,
          tvgName: tvgNameMatch ? tvgNameMatch[1] || null : null,
        })
      } else {
        channels.push({ name: 'Channel', url: line, logo: null, group: null, tvgId: null, tvgName: null })
      }
      pending = null
    }
  }
  return channels
}

const SAMPLE_PLAYLISTS: { name: string; url: string; category: 'general' | 'countries' | 'categories' | 'iptvgen' }[] = [
  { name: 'iptv-org (all)', url: 'https://iptv-org.github.io/iptv/index.m3u', category: 'general' },
  { name: 'iptv-org countries', url: 'https://iptv-org.github.io/iptv/index.country.m3u', category: 'countries' },
  { name: 'iptv-org categories', url: 'https://iptv-org.github.io/iptv/index.category.m3u', category: 'categories' },
  { name: 'iptv-org US', url: 'https://iptv-org.github.io/iptv/countries/us.m3u', category: 'countries' },
  { name: 'iptv-org UK', url: 'https://iptv-org.github.io/iptv/countries/uk.m3u', category: 'countries' },
  { name: 'PlayTorrio IPTV', url: 'https://iptv-org.github.io/iptv/index.m3u', category: 'general' },
  { name: 'free-tv (all)', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/index.m3u', category: 'general' },
  { name: 'free-tv (countries)', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/countries.m3u', category: 'countries' },
  { name: 'free-tv (categories)', url: 'https://raw.githubusercontent.com/free-tv/iptv/master/categories.m3u', category: 'categories' },
  { name: 'iptvgen (all)', url: 'https://iptvgen.pages.dev/api/playlist.m3u', category: 'iptvgen' },
  { name: 'iptvgen (sports)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=sports', category: 'iptvgen' },
  { name: 'iptvgen (news)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=news', category: 'iptvgen' },
  { name: 'iptvgen (movies)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=movies', category: 'iptvgen' },
  { name: 'iptvgen (kids)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=kids', category: 'iptvgen' },
  { name: 'iptvgen (music)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=music', category: 'iptvgen' },
  { name: 'iptvgen (documentary)', url: 'https://iptvgen.pages.dev/api/playlist.m3u?category=documentary', category: 'iptvgen' },
]

export default function Iptv() {
  const {
    setCurrentStreamUrl,
    setCurrentPage,
    setSelectedMedia,
    iptvMultiview,
    setIptvMultiview,
    iptvMultiviewUrls,
    setIptvMultiviewUrls,
  } = useStore()

  const [url, setUrl] = useState('')
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [sortAlpha, setSortAlpha] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSidebar, setShowSidebar] = useState(true)
  const [multiviewMode, setMultiviewMode] = useState(false)
  const [selectedForMultiview, setSelectedForMultiview] = useState<string[]>([])

  const load = useCallback(async (urlToLoad: string) => {
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
  }, [url])

  useEffect(() => {
    load('https://iptv-org.github.io/iptv/index.m3u')
  }, [])

  const importFile = async () => {
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

  const playChannel = (ch: Channel) => {
    if (multiviewMode) {
      const newSelection = [...selectedForMultiview, ch.url]
      if (newSelection.length > 4) newSelection.shift()
      setSelectedForMultiview(newSelection)
      setIptvMultiviewUrls(newSelection)
      setIptvMultiview(true)
      setCurrentPage('player')
    } else {
      setSelectedMedia({ type: 'iptv', id: ch.url, channel: ch })
      setCurrentStreamUrl(ch.url)
      setCurrentPage('player')
    }
  }

  const toggleMultiview = () => {
    if (!multiviewMode) {
      setMultiviewMode(true)
      setSelectedForMultiview(channels.slice(0, 4).map(c => c.url))
    } else {
      setMultiviewMode(false)
      setSelectedForMultiview([])
    }
  }

  const groups = Array.from(new Set(channels.map((c) => c.group).filter(Boolean) as string[])).sort()

  const visible = channels
    .filter((c) => (group ? c.group === group : true))
    .filter((c) => (filter ? c.name.toLowerCase().includes(filter.toLowerCase()) : true))
    .sort((a, b) => (sortAlpha ? a.name.localeCompare(b.name) : 0))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.value) {
      load(e.target.value)
    }
  }

  return (
    <div className="p-6 md:p-8 bg-black/30 min-h-screen">
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">IPTV</h1>
          <span className="text-sm text-white/40 px-2 py-1 rounded-full bg-white/5 border border-white/10">Live Channels</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          >
            {showSidebar ? <Layout className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMultiview}
            className={cn(
              'p-2 rounded-lg text-white/60 hover:text-white transition-colors',
              multiviewMode && 'bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30'
            )}
            title={multiviewMode ? 'Exit multiview' : 'Enter multiview (max 4)'}
          >
            {multiviewMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <Layout className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSortAlpha(!sortAlpha)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            title={sortAlpha ? 'Sort A-Z' : 'Sort default'}
          >
            {sortAlpha ? <ArrowLeft className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className={`grid gap-6 ${showSidebar ? 'lg:grid-cols-[280px_1fr]' : 'lg:grid-cols-[1fr]'} grid-cols-1`}>
        {showSidebar && (
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste playlist URL (.m3u) or search..."
                  className="flex-1 bg-white/10 border border-white/15 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => load(url)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm hover:bg-cyan-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Load'}
                  </button>
                  <button
                    onClick={importFile}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white/40 hover:text-white/60 transition-colors"
                  >
                    Import .m3u
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div>
                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Quick Playlists</h3>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                  {SAMPLE_PLAYLISTS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => load(p.url)}
                      className="px-3 py-1.5 rounded-full text-[10px] border border-white/15 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-all whitespace-nowrap"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {groups.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2">Categories ({groups.length})</h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => setGroup(null)}
                      className={cn(
                        'w-full px-3 py-2 rounded-lg text-left text-sm transition-all',
                        group === null
                          ? 'bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      )}
                    >
                      All channels ({visible.length})
                    </button>
                    {groups.map((g) => {
                      const count = channels.filter(c => c.group === g).length
                      return (
                        <button
                          key={g}
                          onClick={() => setGroup(g)}
                          className={cn(
                            'w-full px-3 py-2 rounded-lg text-left text-sm transition-all',
                            group === g
                              ? 'bg-[#FF1493]/20 text-[#FF1493] border border-[#FF1493]/30'
                              : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                          )}
                        >
                          {g} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="lg:col-span-1 min-w-0">
          {multiviewMode && selectedForMultiview.length > 0 && (
            <div className="mb-6 p-4 bg-[#FF1493]/10 border border-[#FF1493]/30 rounded-xl flex items-center justify-between">
              <span className="text-sm text-[#FF1493]">Multiview active: {selectedForMultiview.length}/4 channels selected</span>
              <button
                onClick={() => {
                  setIptvMultiview(true)
                  setIptvMultiviewUrls(selectedForMultiview)
                  setCurrentPage('player')
                }}
                className="px-4 py-2 rounded-lg bg-[#FF1493] text-white text-sm hover:bg-[#FF1493]/80 transition-colors"
              >
                Launch Multiview
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter channels..."
                className="w-full bg-white/10 border border-white/15 rounded-lg px-10 py-2 text-sm text-white focus:outline-none focus:border-white/30 pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{visible.length} / {channels.length} channels</span>
            </div>
          </div>

          {channels.length > 0 && (
            <div className={cn(
              'gap-3',
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
                : 'space-y-2'
            )}>
              {visible.map((c, i) => (
                <button
                  key={`${c.url}-${i}`}
                  onClick={() => playChannel(c)}
                  className={cn(
                    'group relative rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all',
                    viewMode === 'grid'
                      ? 'flex flex-col items-center gap-2 p-4 min-h-[140px]'
                      : 'flex items-center gap-4 p-3 min-h-[80px] text-left'
                  )}
                >
                  <div className={cn(
                    'relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden',
                    viewMode === 'grid' ? 'w-12 h-12 mx-auto' : ''
                  )}>
                    {c.logo ? (
                      <img
                        src={c.logo}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; el.parentElement?.querySelector('.fallback')?.classList.remove('hidden') }}
                      />
                    ) : null}
                    <div className={cn(
                      'fallback absolute inset-0 w-full h-full rounded-lg bg-white/10 flex items-center justify-center',
                      c.logo ? 'hidden' : ''
                    )}>
                      <Tv className="w-5 h-5 text-white/30" />
                    </div>
                    {multiviewMode && selectedForMultiview.includes(c.url) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#FF1493] flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    'text-white/70 truncate',
                    viewMode === 'grid' ? 'text-xs text-center w-full' : 'text-sm flex-1'
                  )}>
                    {c.name}
                  </div>
                  {viewMode === 'list' && c.group && (
                    <span className="text-[10px] text-white/30 px-2 py-0.5 rounded bg-white/5 whitespace-nowrap">{c.group}</span>
                  )}
                </button>
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

          {loading && (
            <div className="py-20 text-center">
              <RefreshCw className="mx-auto w-8 h-8 animate-spin text-cyan-400 mb-4" />
              <p className="text-white/60">Loading playlist...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}