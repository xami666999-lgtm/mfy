import { useState } from 'react'
import { Film, ArrowRight, Check, Key, Globe, Link2, Server, Sparkles, ExternalLink } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey } from '../api/tmdb'
import { cn } from '../lib/utils'

const steps = [
  { id: 'welcome', label: 'Welcome', icon: Film },
  { id: 'tmdb', label: 'TMDB', icon: Key },
  { id: 'services', label: 'Services', icon: Link2 },
  { id: 'library', label: 'Library', icon: Server },
  { id: 'done', label: 'Done', icon: Sparkles },
]

export default function Wizard() {
  const store = useStore()
  const [step, setStep] = useState(0)
  const [tmdbKey, setTmdbKey] = useState(store.tmdbApiKey || '')
  const [traktTok, setTraktTok] = useState(store.traktToken || '')
  const [rdKey, setRdKey] = useState(store.realDebridKey || '')
  const [aiosUrl, setAiosUrl] = useState(store.aiostreamsUrl || '')
  const [jellyfinUrl, setJellyfinUrl] = useState(store.jellyfinUrl || '')
  const [jellyfinKey, setJellyfinKey] = useState(store.jellyfinApiKey || '')
  const [saving, setSaving] = useState(false)
  const [tmdbError, setTmdbError] = useState('')

  async function finish() {
    setSaving(true)
    const api = (window as any).electronAPI

    store.setTmdbApiKey(tmdbKey)
    setRuntimeTmdbKey(tmdbKey)
    store.setTraktToken(traktTok)
    store.setRealDebridKey(rdKey)
    store.setAiostreamsUrl(aiosUrl)
    store.setJellyfinUrl(jellyfinUrl)
    store.setJellyfinApiKey(jellyfinKey)
    store.setSetupComplete(true)

    if (api) {
      try {
        await api.set('tmdbApiKey', tmdbKey)
        await api.set('traktToken', traktTok)
        await api.set('realDebridKey', rdKey)
        await api.set('aiostreamsUrl', aiosUrl)
        await api.set('jellyfinUrl', jellyfinUrl)
        await api.set('jellyfinApiKey', jellyfinKey)
        await api.setSetupComplete()
      } catch {
        // still continue into the app
      }
    }
    setSaving(false)
  }

  function canNext() {
    if (step === 1 && !tmdbKey.trim()) {
      setTmdbError('TMDB API key is required to load the catalog.')
      return false
    }
    setTmdbError('')
    return true
  }

  function next() {
    if (!canNext()) return
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }

  function openLink(url: string) {
    const api = (window as any).electronAPI
    if (api?.openExternal) api.openExternal(url)
    else window.open(url, '_blank')
  }

  return (
    <div className="h-screen flex bg-[#06050a] relative overflow-hidden">
      {/* Ambient mesh background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 15% 20%, rgba(255,20,147,0.14), transparent 50%), radial-gradient(ellipse at 85% 80%, rgba(0,229,255,0.08), transparent 45%)',
        }}
      />

      {/* Left sidebar */}
      <aside className="relative z-10 w-64 flex-shrink-0 border-r border-white/[0.06] bg-black/30 backdrop-blur-xl p-6 flex flex-col">
        <div className="flex items-center gap-2.5 mb-10">
          <img src="/icon.png" alt="MFY" className="w-9 h-9 rounded-xl shadow-[0_0_20px_rgba(255,20,147,0.35)]" />
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white">MFY</div>
            <div className="text-[10px] text-white/30 tracking-wide">Setup</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {steps.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => i < step && setStep(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all',
                  active && 'bg-[#FF1493]/12 text-[#FF1493] border border-[#FF1493]/25',
                  done && !active && 'text-[#00E5FF]/80 hover:bg-white/[0.03]',
                  !active && !done && 'text-white/25'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center border text-[10px]',
                    done && 'bg-[#00E5FF]/15 border-[#00E5FF]/35 text-[#00E5FF]',
                    active && 'bg-[#FF1493]/15 border-[#FF1493]/40 text-[#FF1493]',
                    !active && !done && 'border-white/10 text-white/20'
                  )}
                >
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                </span>
                {s.label}
              </button>
            )
          })}
        </nav>

        <p className="text-[10px] text-white/20 leading-relaxed mt-4">
          You can change every setting later in Settings.
        </p>
      </aside>

      {/* Main panel */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-10">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="h-1 rounded-full bg-white/[0.06] mb-8 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF1493] to-[#00E5FF] transition-all duration-300"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="glass-card p-8">
            {step === 0 && (
              <Step title="Welcome to MFY" desc="Movies For You — a private desktop catalog and player.">
                <div className="space-y-3 text-sm text-white/45 leading-relaxed">
                  <p>
                    MFY uses <strong className="text-white/70">TMDB</strong> for metadata and posters.
                    Optional services (Trakt, Real-Debrid, AIOStreams, Jellyfin) can be added now or later.
                  </p>
                  <p>
                    The player only plays stream URLs you are authorized to use.
                  </p>
                </div>
              </Step>
            )}

            {step === 1 && (
              <Step
                title="TMDB API Key"
                desc="Required. Free key from themoviedb.org — powers the entire catalog."
              >
                <Input
                  value={tmdbKey}
                  onChange={(v) => { setTmdbKey(v); setTmdbError('') }}
                  placeholder="Paste your TMDB API key (v3) or read access token"
                  type="password"
                />
                {tmdbError && <p className="text-xs text-red-400 mt-2">{tmdbError}</p>}
                <button
                  type="button"
                  onClick={() => openLink('https://www.themoviedb.org/settings/api')}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors"
                >
                  Get a free TMDB key <ExternalLink className="w-3 h-3" />
                </button>
              </Step>
            )}

            {step === 2 && (
              <Step title="Optional services" desc="Skip any you don’t use. You can add them later in Settings.">
                <div className="space-y-4">
                  <Field label="Trakt token" hint="Sync watch progress">
                    <Input value={traktTok} onChange={setTraktTok} placeholder="Optional Trakt access token" type="password" />
                    <LinkBtn onClick={() => openLink('https://trakt.tv/oauth/authorize')} />
                  </Field>
                  <Field label="Real-Debrid API" hint="Debrid for faster streams">
                    <Input value={rdKey} onChange={setRdKey} placeholder="Optional Real-Debrid token" type="password" />
                    <LinkBtn onClick={() => openLink('https://realdebrid.com/apitoken')} />
                  </Field>
                  <Field label="AIOStreams URL" hint="Your stream resolver endpoint">
                    <Input value={aiosUrl} onChange={setAiosUrl} placeholder="e.g. http://localhost:3000 or your hosted URL" />
                  </Field>
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step title="Local library (optional)" desc="Connect Jellyfin if you self-host media.">
                <div className="space-y-4">
                  <Field label="Jellyfin server URL">
                    <Input value={jellyfinUrl} onChange={setJellyfinUrl} placeholder="http://127.0.0.1:8096" />
                  </Field>
                  <Field label="Jellyfin API key">
                    <Input value={jellyfinKey} onChange={setJellyfinKey} placeholder="Optional API key" type="password" />
                  </Field>
                </div>
              </Step>
            )}

            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF1493]/20 to-[#00E5FF]/20 border border-[#FF1493]/30 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">You’re all set</h2>
                <p className="text-sm text-white/35 max-w-sm mx-auto leading-relaxed">
                  {tmdbKey ? 'TMDB is configured.' : 'Add a TMDB key in Settings to load the catalog.'}
                  {' '}Everything can be changed anytime.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-10">
              <button
                type="button"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-xs text-white/30 hover:text-white/55 disabled:opacity-20 transition-colors"
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                {step > 0 && step < steps.length - 1 && step !== 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className="h-9 px-4 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    Skip
                  </button>
                )}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex items-center gap-1.5 h-9 px-5 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finish}
                    disabled={saving}
                    className="flex items-center gap-1.5 h-9 px-6 rounded-full bg-gradient-to-r from-[#FF1493] to-[#00E5FF] text-xs font-bold text-white shadow-[0_0_24px_rgba(255,20,147,0.35)] hover:brightness-110 transition-all disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'Saving…' : 'Launch MFY'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-1 tracking-tight">{title}</h2>
      <p className="text-sm text-white/35 mb-6 leading-relaxed">{desc}</p>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-[11px] font-semibold text-white/50 tracking-wide uppercase">{label}</label>
        {hint && <span className="text-[10px] text-white/25">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/45 focus:ring-1 focus:ring-[#FF1493]/20 transition-all"
    />
  )
}

function LinkBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1.5 text-[11px] text-[#00E5FF]/55 hover:text-[#00E5FF] transition-colors"
    >
      Open setup page →
    </button>
  )
}
