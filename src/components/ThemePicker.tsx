import { useEffect, useState } from 'react'

export const THEME_PACKS = [
  { id: 'mfy', name: 'MFY' },
  { id: 'netflix', name: 'Netflix' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'paramount', name: 'Paramount+' },
  { id: 'appletv', name: 'Apple TV' },
  { id: 'hbo', name: 'HBO Max' },
  { id: 'sleekfin', name: 'SleekFin' },
] as const

export type PackId = typeof THEME_PACKS[number]['id']

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
  const [jf, setJf] = useState('')

  useEffect(() => {
    applyPack(pack)
    const api = (window as any).electronAPI
    api?.jellyfinStatus?.().then((s: any) => {
      setPlugins([...(s?.plugins || [])].map(String).sort((a, b) => a.localeCompare(b)))
      setJf(s?.running ? s.url : '')
    }).catch(() => {})
  }, [pack])

  return (
    <section className="p-8 max-w-2xl pb-0">
      <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Themes</h2>
      <p className="text-xs text-white/40 mb-4">Skins MFY itself. Catalog stays movies / shows / anime. SleekFin also skins local Jellyfin Web when that sidecar is running.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
        {THEME_PACKS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPack(p.id)}
            className={`h-11 rounded-xl text-sm font-semibold border ${
              pack === p.id ? 'bg-white text-black border-white' : 'bg-white/[0.04] text-white/80 border-white/10'
            }`}
          >{p.name}</button>
        ))}
      </div>
      {pack === 'sleekfin' && (
        <p className="text-xs text-white/45 mb-4">
          SleekFin look on MFY is on. For the real SleekFin plugin, start local Jellyfin, install File Transformation + SleekFin, then open the dashboard.
          {jf ? <> · <button type="button" className="underline" onClick={() => (window as any).electronAPI?.jellyfinOpenDashboard?.()}>{jf}</button></> : null}
        </p>
      )}
      <h3 className="text-sm font-medium text-white/70 mb-2">Installed Jellyfin plugins</h3>
      <p className="text-[11px] text-white/35 mb-2">Sorted A–Z. After you add the next 20, tell me where each should live and I will pin them here.</p>
      {plugins.length === 0 ? (
        <p className="text-xs text-white/30 mb-6">None yet. Menu → Jellyfin → install a zip, then they show up here.</p>
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
