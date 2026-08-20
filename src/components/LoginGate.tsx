import { useEffect, useState } from 'react'
import { Film, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export default function LoginGate() {
  const { profiles, currentProfile, addProfile, setProfilePin, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const [mode, setMode] = useState<'login' | 'create'>(profiles.length === 0 ? 'create' : 'login')
  const [selectedId, setSelectedId] = useState<string | null>(currentProfile?.id || null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  // New-account fields
  const [name, setName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    if (profiles.length === 0) setMode('create')
  }, [profiles.length])

  function select(id: string) {
    setSelectedId(id)
    setPin('')
    setError('')
  }

  function unlock() {
    if (!selectedId) return
    const profile = profiles.find((p) => p.id === selectedId)
    if (!profile) return
    if (!profile.pin) {
      // No PIN set — just switch in
      switchProfile(selectedId)
      setAuthenticated(true)
      setCurrentPage('home')
      return
    }
    if (pin.length < 4) {
      setError('Enter your PIN to continue.')
      return
    }
    if (useStore.getState().verifyProfilePin(selectedId, pin)) {
      switchProfile(selectedId)
      setAuthenticated(true)
      setCurrentPage('home')
    } else {
      setError('Wrong PIN. Try again.')
    }
  }

  function create() {
    if (!name.trim()) {
      setCreateError('Enter a name for your account.')
      return
    }
    if (newPin && newPin.length < 4) {
      setCreateError('PIN must be at least 4 characters.')
      return
    }
    if (newPin !== confirmPin) {
      setCreateError('PINs do not match.')
      return
    }
    const api = (window as any).electronAPI
    addProfile(name.trim())
    const created = useStore.getState().profiles.find((p) => p.name === name.trim())
    if (created) {
      if (newPin) setProfilePin(created.id, newPin)
      setAuthenticated(true)
      switchProfile(created.id)
      if (api) api.set('currentProfileId', created.id)
    }
    setCurrentPage('home')
  }

  return (
    <div className="h-screen flex items-center justify-center bg-[#06050a] relative overflow-hidden p-6">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 25% 20%, rgba(255,20,147,0.12), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(0,229,255,0.06), transparent 45%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="./icon.png" alt="MFY" className="w-11 h-11 rounded-xl shadow-[0_0_24px_rgba(255,20,147,0.4)]" />
          <div>
            <div className="text-lg font-extrabold tracking-tight text-white">MFY</div>
            <div className="text-[10px] text-white/30 tracking-wide">Movies For You</div>
          </div>
        </div>

        <div className="glass-card p-7">
          {mode === 'create' ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <UserPlus className="w-4 h-4 text-[#FF1493]" />
                <h2 className="text-base font-bold text-white tracking-tight">Create your account</h2>
              </div>
              <p className="text-xs text-white/35 mb-6 leading-relaxed">
                This is stored only on this PC. You'll use this profile every time you open MFY.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-1.5 block">Profile name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Noah"
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/45 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-1.5 block">PIN (optional)</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/45 transition-all"
                  />
                </div>
                {newPin && (
                  <div>
                    <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-1.5 block">Confirm PIN</label>
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Repeat the PIN"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/45 transition-all"
                    />
                  </div>
                )}
                {createError && <p className="text-xs text-red-400">{createError}</p>}
                <button
                  type="button"
                  onClick={create}
                  className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF4FA3] text-sm font-bold text-white shadow-[0_0_24px_rgba(255,20,147,0.35)] hover:brightness-110 transition-all"
                >
                  Create Account <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-[#FF1493]" />
                <h2 className="text-base font-bold text-white tracking-tight">Who's watching?</h2>
              </div>
              <p className="text-xs text-white/35 mb-6 leading-relaxed">Pick your profile and enter its PIN.</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => select(p.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                      selectedId === p.id
                        ? 'bg-[#FF1493]/12 border-[#FF1493]/40'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
                    )}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10">
                      <img src={p.avatar || './icon.png'} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] text-white/70 truncate max-w-full">{p.name}</span>
                  </button>
                ))}
              </div>

              {selectedId && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-1.5 block">
                      PIN {profiles.find((p) => p.id === selectedId)?.pin ? '' : '(none set — just continue)'}
                    </label>
                    <input
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && unlock()}
                      placeholder="Enter PIN"
                      autoFocus
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/45 transition-all"
                    />
                  </div>
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    type="button"
                    onClick={unlock}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-r from-[#FF1493] to-[#FF4FA3] text-sm font-bold text-white shadow-[0_0_24px_rgba(255,20,147,0.35)] hover:brightness-110 transition-all"
                  >
                    <LogIn className="w-4 h-4" /> Enter MFY
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => { setMode('create'); setName(''); setNewPin(''); setConfirmPin(''); setCreateError('') }}
                className="mt-5 w-full flex items-center justify-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create a new account
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 mt-5">
          <Film className="w-3 h-3 inline mr-1" style={{ verticalAlign: '-2px' }} />
          Accounts and PINs are stored locally on this device only.
        </p>
      </div>
    </div>
  )
}