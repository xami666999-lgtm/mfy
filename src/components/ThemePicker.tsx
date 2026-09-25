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
  const [msg, setMsg] = useState('')

  async function loadPlugins() {
    const api = (window as any).electronAPI
    if (!api?.jellyfinStatus) return
    const s = await api.jellyfinStatus()
    setPlugins([...(s?.plugins || [])].map(String).sort((a: string, b: string) => a.localeCompare(b)))
    setJf(s?.running ? s.url : '')
    if (s?.error) setMsg(s.error)
  }

  useEffect(() => {
    applyPack(pack)
    loadPlugins().catch(() => {})
  }, [pack])

  const api = (window as any).electronAPI

  return (
    <section className="p-8 max-w-2xl pb-0">
      <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Themes</h2>
      <p className="text-xs text-white/40 mb-4">Skins MFY. Catalog stays movies / shows / anime. After you drop plugins, they list below — tell me where each should go and I will pin them.</p>
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
      <div className="flex flex-wrap gap-2 mb-4">
        <button type="button" className="h-9 px-3 rounded-lg bg-white text-black text-xs font-semibold" onClick={() => api?.jellyfinStart?.().then(loadPlugins)}>
          Start local Jellyfin
        </button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinPickPlugin?.().then(loadPlugins)}>
          Install plugin zip
        </button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinOpenDashboard?.()}>
          Dashboard
        </button>
        <button type="button" className="h-9 px-3 rounded-lg bg-white/10 text-white text-xs" onClick={() => api?.jellyfinOpenPlugins?.()}>
          Plugins folder
        </button>
      </div>
      {msg && <p className="text-xs text-red-400 mb-2">{msg}</p>}
      {pack === 'sleekfin' && (
        <p className="text-xs text-white/45 mb-4">
          SleekFin tint is on MFY. Real SleekFin plugin: start Jellyfin, install File Transformation + SleekFin, open Dashboard.
          {jf ? ` ${jf}` : ''}
        </p>
      )}
      <h3 className="text-sm font-medium text-white/70 mb-2">Installed Jellyfin plugins</h3>
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
