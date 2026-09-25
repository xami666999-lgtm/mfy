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
      setMsg('Zip install only works in the Windows app. Copy the manifest into local Jellyfin Dashboard if there is no zip.')
      return
    }
    setBusy(url)
    setMsg('')
    try {
      const s = await api.jellyfinInstallUrl(url)
      if (s?.error) setMsg(s.error)
      else setMsg('Installed. Local Jellyfin restarted if it was running.')
      await loadPlugins()
    } catch (e: any) {
      setMsg(e?.message || 'install failed — use a direct .zip, not a GitHub page')
    }
    setBusy('')
  }

  const groups = Array.from(new Set(catalog.map((x) => x.slot)))

  return (
    <section className="p-8 max-w-3xl pb-16">
      <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Themes</h2>
      <p className="text-xs text-white/40 mb-4">Restyles MFY movies / shows / anime. SleekFin button is the same list as Netflix.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
        {THEME_PACKS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPack(p.id)} className={`h-11 rounded-xl text-sm font-semibold border ${pack === p.id ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/80 border-white/10'}`}>{p.name}</button>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white tracking-tight mb-1">Addons</h2>
      <p className="text-xs text-white/40 mb-4">Each row says where it lives. Jellyfin zips install into the local sidecar. GitHub pages and GTK apps cannot drop in as zips.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className="h-9 px-3 rounded-lg bg-white text-black text-xs font-semibold" onClick={() => api?.jellyfinStart?.().then(loadPlugins)}>Start local Jellyfin</button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinPickPlugin?.().then(loadPlugins)}>Install zip from file</button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinOpenDashboard?.()}>Dashboard</button>
      </div>

      {groups.map((slot) => (
        <div key={slot} className="mb-5">
          <h3 className="text-xs uppercase tracking-wider text-white/40 mb-2">{slot}</h3>
          <ul className="space-y-2">
            {catalog.filter((x) => x.slot === slot).map((item) => (
              <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{item.name}</p>
                    <p className="text-[11px] text-white/45 mt-1">{item.description}</p>
                    <p className="text-[10px] text-white/25 mt-1 truncate">{item.kind} · {item.platform}</p>
                  </div>
                  {item.kind === 'jellyfin' && (
                    <button type="button" disabled={!!busy} className="shrink-0 h-8 px-3 rounded-lg bg-white text-black text-xs font-semibold" onClick={() => installUrl(item.manifest || item.url)}>
                      {busy === (item.manifest || item.url) ? '...' : 'Install'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h3 className="text-sm font-medium text-white/70 mb-2">Paste more links</h3>
      <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white p-3 mb-2" />
      <button type="button" className="h-9 px-3 rounded-lg bg-white text-black text-xs font-semibold mb-6" onClick={() => { setCatalog(addLinks(paste, catalog)); setPaste('') }}>Save links</button>

      {msg && <p className="text-xs text-red-300 mb-3">{msg}</p>}
      <h3 className="text-sm font-medium text-white/70 mb-2">Installed in sidecar</h3>
      {plugins.length === 0 ? <p className="text-xs text-white/30">None yet.</p> : (
        <ul className="space-y-1">{plugins.map((name) => <li key={name} className="text-xs text-white/70 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2">{name}</li>)}</ul>
      )}
    </section>
  )
}
