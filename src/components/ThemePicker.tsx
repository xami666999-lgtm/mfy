import { useEffect, useState } from 'react'
import { addLinks, loadCatalog, saveCatalog, type CatalogItem } from '../jellyfin/pluginCatalog'

export const THEME_PACKS = [
  { id: 'mfy', name: 'MFY' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'appletv', name: 'Apple TV' },
  { id: 'hbo', name: 'Max' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'paramount', name: 'Paramount+' },
  { id: 'sleekfin', name: 'SleekFin' },
] as const

export function applyPack(id: string) {
  const pack = THEME_PACKS.some((p) => p.id === id) ? id : 'mfy'
  document.documentElement.dataset.pack = pack
  try { localStorage.setItem('mfy-theme-pack', pack) } catch {}
}

export function bootPack() {
  try { applyPack(localStorage.getItem('mfy-theme-pack') || 'mfy') } catch { applyPack('mfy') }
}

export default function ThemePicker() {
  const [pack, setPack] = useState<string>(() => {
    try { return localStorage.getItem('mfy-theme-pack') || 'mfy' } catch { return 'mfy' }
  })
  const [plugins, setPlugins] = useState<string[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadCatalog())
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  async function loadPlugins() {
    const api = (window as any).electronAPI
    if (!api?.jellyfinStatus) return
    try {
      const s = await api.jellyfinStatus()
      setPlugins([...(s?.plugins || [])].map(String).sort((a: string, b: string) => a.localeCompare(b)))
      if (s?.error) setMsg(String(s.error))
    } catch (e: any) {
      setMsg(e?.message || 'plugin list failed')
    }
  }

  useEffect(() => {
    applyPack(pack)
    loadPlugins().catch(() => {})
  }, [pack])

  const api = (window as any).electronAPI

  async function installUrl(url: string) {
    if (!api?.jellyfinInstallUrl) {
      setMsg('Install only works in the Windows app')
      return
    }
    setBusy(url)
    setMsg('')
    try {
      const s = await api.jellyfinInstallUrl(url)
      if (s?.error) setMsg(s.error)
      else setMsg('Installed. Restarted local Jellyfin if it was running.')
      await loadPlugins()
    } catch (e: any) {
      setMsg(e?.message || 'install failed')
    }
    setBusy('')
  }

  return (
    <section className="p-8 max-w-2xl pb-0">
      <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Themes</h2>
      <p className="text-xs text-white/40 mb-4">Restyles MFY. Catalog stays movies / shows / anime. Plugin zips go to local Jellyfin, not into these theme buttons.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {THEME_PACKS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPack(p.id)} className={`h-11 rounded-xl text-sm font-semibold border ${pack === p.id ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/80 border-white/10'}`}>{p.name}</button>
        ))}
      </div>

      <h3 className="text-sm font-medium text-white/70 mb-2">Add plugin links</h3>
      <p className="text-[11px] text-white/35 mb-2">Paste many lines. Name optional: SleekFin https://.../x.zip</p>
      <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-3 mb-2" placeholder="https://github.com/.../plugin.zip" />
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className="h-9 px-3 rounded-lg bg-white text-black text-xs font-semibold" onClick={() => { setCatalog(addLinks(paste, catalog)); setPaste('') }}>Save links</button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinStart?.().then(loadPlugins)}>
          Start local Jellyfin
        </button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinPickPlugin?.().then(loadPlugins)}>
          Install from file
        </button>
      </div>

      {catalog.length > 0 && (
        <ul className="mb-4 space-y-1">
          {catalog.map((item) => (
            <li key={item.url} className="flex items-center gap-2 text-xs text-white/80 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">
              <span className="flex-1 truncate">{item.name}</span>
              <button type="button" disabled={!!busy} className="shrink-0 h-7 px-2 rounded-md bg-white text-black font-semibold" onClick={() => installUrl(item.url)}>
                {busy === item.url ? '...' : 'Install'}
              </button>
              <button type="button" className="text-white/40" onClick={() => setCatalog(saveCatalog(catalog.filter((x) => x.url !== item.url)))}>x</button>
            </li>
          ))}
        </ul>
      )}

      {msg && <p className="text-xs text-red-300 mb-3">{msg}</p>}

      <h3 className="text-sm font-medium text-white/70 mb-2">Installed</h3>
      {plugins.length === 0 ? (
        <p className="text-xs text-white/30 mb-6">None yet.</p>
      ) : (
        <ul className="mb-6 space-y-1">
          {plugins.map((name) => (
            <li key={name} className="text-xs text-white/70 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">{name}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
