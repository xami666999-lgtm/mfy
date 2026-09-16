import { useState } from 'react'
import { Save, Check, RefreshCw, UserPlus } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey } from '../api/tmdb'

export default function Settings() {
  const store = useStore()
  const [tmdbKey, setTmdbKey] = useState(store.tmdbApiKey)
  const [letterboxd, setLetterboxd] = useState(localStorage.getItem('mfy-letterboxd') || '')
  const [serializd, setSerializd] = useState(localStorage.getItem('mfy-serializd') || '')
  const [saved, setSaved] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  async function save() {
    const api = (window as any).electronAPI
    store.setTmdbApiKey(tmdbKey)
    setRuntimeTmdbKey(tmdbKey)
    localStorage.setItem('mfy-letterboxd', letterboxd)
    localStorage.setItem('mfy-serializd', serializd)
    if (api) {
      await api.set('tmdbApiKey', tmdbKey)
      await api.set('letterboxdUser', letterboxd)
      await api.set('serializdUser', serializd)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function checkUpdates() {
    const api = (window as any).electronAPI
    if (!api?.checkForUpdates) {
      setUpdateStatus('Auto-update only works in the installed app.')
      return
    }
    setUpdateStatus('Checking…')
    try {
      const res = await api.checkForUpdates()
      setUpdateStatus(res?.ok ? (res.updateInfo ? `Update found: ${res.updateInfo.version}` : 'You are up to date.') : (res?.reason || 'Check failed'))
    } catch {
      setUpdateStatus('Check failed')
    }
    setTimeout(() => setUpdateStatus(null), 6000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-white tracking-tight">Account</h2>
        <div className="flex items-center gap-2">
          <button onClick={checkUpdates} className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60">
            <RefreshCw className="w-3.5 h-3.5" />
            {updateStatus || 'Check Updates'}
          </button>
          <button onClick={save} className="flex items-center gap-2 h-8 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white/70">
            {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Box title="Updates">
          <p className="text-[10px] text-white/35">Check Updates downloads the latest MFY Setup from GitHub Releases.</p>
        </Box>

        <Box title="Account">
          <Field label="Display name / profile">
            <div className="flex gap-2 flex-wrap mb-2">
              {store.profiles.map((pr) => (
                <button key={pr.id} type="button" onClick={() => store.switchProfile(pr.id)} className={`h-8 px-3 rounded-lg text-xs border ${
                  store.currentProfile?.id === pr.id ? 'border-white/40 text-white' : 'border-white/10 text-white/40'
                }`}>{pr.name}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="New profile" className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white" />
              <button type="button" onClick={() => { if (profileName.trim()) { store.addProfile(profileName.trim()); setProfileName('') } }} className="h-9 px-3 rounded-lg border border-white/10 text-xs text-white/60 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </Field>
          <Field label="TMDB key (catalog)">
            <input value={tmdbKey} onChange={(e) => setTmdbKey(e.target.value)} placeholder="Required for posters and titles" className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white" />
          </Field>
        </Box>

        <Box title="Letterboxd">
          <p className="text-[10px] text-white/35">Letterboxd does not give apps a public rate API. Ratings stay in MFY and are stored under this username.</p>
          <Field label="Letterboxd username">
            <input value={letterboxd} onChange={(e) => setLetterboxd(e.target.value)} placeholder="your-letterboxd-name" className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white" />
          </Field>
        </Box>

        <Box title="Serializd">
          <p className="text-[10px] text-white/35">TV ratings in MFY are saved to this Serializd username. Official public login is limited; username links your in-app scores.</p>
          <Field label="Serializd username">
            <input value={serializd} onChange={(e) => setSerializd(e.target.value)} placeholder="your-serializd-name" className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white" />
          </Field>
        </Box>
      </div>
    </div>
  )
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      <h3 className="px-5 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/[0.04]">{title}</h3>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-white/50 mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
