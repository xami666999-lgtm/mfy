import { useEffect, useState } from 'react'
import { addLinks, loadCatalog, saveCatalog, type CatalogItem } from '../jellyfin/pluginCatalog'
import { badges, monthRewind } from '../lib/addonsLive'
import { useStore } from '../store'

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
  const hist = useStore((s) => s.watchHistory)
  const [pack, setPack] = useState<string>(() => {
    try { return localStorage.getItem('mfy-theme-pack') || 'mfy' } catch { return 'mfy' }
  })
  const [plugins, setPlugins] = useState<string[]>([])
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => loadCatalog())
  const [paste, setPaste] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')
  const r = monthRewind(hist || [])
  const b = badges(hist || [])

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
      setMsg('Zip install only works in the Windows app.')
      return
    }
    setBusy(url)
    setMsg('')
    try {
      const s = await api.jellyfinInstallUrl(url)
      if (s?.error) setMsg(s.error)
      else setMsg('Installed.')
      await loadPlugins()
    } catch (e: any) {
      setMsg(e?.message || 'install failed')
    }
    setBusy('')
  }

  const groups = Array.from(new Set(catalog.map((x) => x.slot)))

  return (
    <section className="p-8 max-w-3xl pb-16">
      <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Themes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
        {THEME_PACKS.map((p) => (
          <button key={p.id} type="button" onClick={() => setPack(p.id)} className={`h-11 rounded-xl text-sm font-semibold border ${pack === p.id ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/80 border-white/10'}`}>{p.name}</button>
        ))}
      </div>
      <div className="mb-8">
        <h3 className="text-sm font-medium text-white/70 mb-2">This month</h3>
        <p className="text-xs text-white/50 mb-3">{r.hours}h across {r.titles} titles ({r.month})</p>
        <div className="flex flex-wrap gap-2">
          {b.map((x) => (
            <span key={x.id} className={`text-[11px] px-2 py-1 rounded-lg border ${x.on ? 'border-white text-white' : 'border-white/10 text-white/30'}`}>{x.name}</span>
          ))}
        </div>
      </div>
      <h2 className="text-lg font-semibold text-white tracking-tight mb-1">Addons</h2>
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
                  </div>
                  {item.kind === 'jellyfin' && (
                    <button type="button" disabled={!!busy} className="shrink-0 h-8 px-3 rounded-lg bg-white text-black text-xs font-semibold" onClick={() => installUrl(item.manifest || item.url)}>{busy ? '...' : 'Install'}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {msg && <p className="text-xs text-red-300 mb-3">{msg}</p>}
    </section>
  )
}
