import { useEffect, useRef, useState } from 'react'
import { Film, Lock, UserPlus, LogIn, ArrowRight, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const AVATAR_BASE = 'https://image.tmdb.org/t/p/w185'

interface AvatarOption {
  path: string
  name: string
}

export default function LoginGate() {
  const { profiles, currentProfile, addProfile, removeProfile, setProfilePin, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const userWantCreate = useRef(false)
  const [mode, setMode] = useState<'login' | 'create'>('create')
  const [selectedId, setSelectedId] = useState<string | null>(currentProfile?.id || null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  // New-account fields
  const [name, setName] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [createError, setCreateError] = useState('')
  const [avatar, setAvatar] = useState<string>('')
  const [avatarOptions, setAvatarOptions] = useState<AvatarOption[]>([])
  const [avatarsLoading, setAvatarsLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => {
    if (profiles.length === 0) {
      setMode('create')
      return
    }
    if (!userWantCreate.current) {
      setMode('login')
      setSelectedId((cur) => cur || currentProfile?.id || profiles[0]?.id || null)
    }
  }, [profiles, currentProfile])

  // Load a batch of actor/character portraits for the avatar picker.
  useEffect(() => {
    if (mode !== 'create' || avatarOptions.length > 0) return
    let cancelled = false
    setAvatarsLoading(true)
    ;(async () => {
      try {
        const { tmdb } = await import('../api/tmdb')
        const res = await tmdb.getPopularPeople(1)
        const people: any[] = res?.results || []
        const opts = people
          .filter((p) => p?.profile_path)
          .slice(0, 24)
          .map((p) => ({ path: p.profile_path, name: p.name || 'Actor' }))
        if (!cancelled) {
          setAvatarOptions(opts)
          setAvatar((cur) => cur || opts[0]?.path || '')
        }
      } catch {
        // fall through — avatar stays empty
      } finally {
        if (!cancelled) setAvatarsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [mode, avatarOptions.length])

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
    addProfile(name.trim(), avatar ? `${AVATAR_BASE}${avatar}` : '')
    const created = useStore.getState().profiles.find((p) => p.name === name.trim())
    if (created) {
      if (newPin) setProfilePin(created.id, newPin)
      setAuthenticated(true)
      switchProfile(created.id)
      if (api) api.set('currentProfileId', created.id)
      userWantCreate.current = false
    }
    setCurrentPage('home')
  }

  function remove(id: string) {
    removeProfile(id)
    setConfirmDelete(null)
    setSelectedId((cur) => (cur === id ? null : cur))
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
              <p className="text-xs text-white/35 mb-5 leading-relaxed">
                This is stored only on this PC. You'll use this profile every time you open MFY.
              </p>

              <div className="space-y-4">
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
                  <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest mb-1.5 block">Pick an avatar</label>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#FF1493]/40 flex-shrink-0">
                      {avatar ? (
                        <img src={`${AVATAR_BASE}${avatar}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/[0.06] grid place-items-center"><Film className="w-4 h-4 text-white/25" /></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className={cn(
                          'w-10 h-10 rounded-full grid place-items-center border flex-shrink-0 transition-all',
                          avatar === '' ? 'bg-[#FF1493]/15 border-[#FF1493]/40' : 'border-white/[0.08] bg-white/[0.04]'
                        )}
                      >
                        <img src="./icon.png" alt="Default" className="w-6 h-6 rounded-full" />
                      </button>
                      {!avatarsLoading && (
                        <span className="text-[10px] text-white/25 truncate">
                          {avatarOptions.find((o) => o.path === avatar)?.name || 'Tap an actor below'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-1">
                    {avatarsLoading
                      ? Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="aspect-square rounded-full bg-white/[0.04] animate-pulse" />
                        ))
                      : avatarOptions.map((o) => (
                          <button
                            key={o.path}
                            type="button"
                            title={o.name}
                            onClick={() => setAvatar(o.path)}
                            className={cn(
                              'aspect-square rounded-full overflow-hidden border-2 transition-all',
                              avatar === o.path ? 'border-[#FF1493] shadow-[0_0_14px_rgba(255,20,147,0.35)]' : 'border-transparent hover:border-white/25'
                            )}
                          >
                            <img src={`${AVATAR_BASE}${o.path}`} alt={o.name} className="w-full h-full object-cover" loading="lazy" />
                          </button>
                        ))}
                  </div>
                  {avatarOptions.length === 0 && !avatarsLoading && (
                    <p className="text-[10px] text-white/20 mt-1">Couldn't load avatars — the default icon will be used.</p>
                  )}
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
              <p className="text-xs text-white/35 mb-5 leading-relaxed">Pick your profile and enter its PIN.</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {profiles.map((p) => (
                  <div key={p.id} className="relative">
                    {confirmDelete === p.id ? (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3 text-center">
                        <p className="text-[10px] text-red-300/80 mb-2">Delete "{p.name}"?</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => remove(p.id)}
                            className="h-7 px-2.5 rounded-md bg-red-500/20 border border-red-500/40 text-[10px] text-red-300 font-semibold hover:bg-red-500/30"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="h-7 px-2.5 rounded-md bg-white/[0.06] text-[10px] text-white/50 hover:bg-white/[0.1]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => select(p.id)}
                          className={cn(
                            'w-full flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
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
                        {profiles.length > 1 && (
                          <button
                            type="button"
                            title={`Delete ${p.name}`}
                            onClick={() => setConfirmDelete(p.id)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 grid place-items-center rounded-full bg-[#1a1620] border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/40 transition-all"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
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
                onClick={() => { userWantCreate.current = true; setMode('create'); setName(''); setNewPin(''); setConfirmPin(''); setCreateError(''); setAvatar(''); setConfirmDelete(null) }}
                className="mt-5 w-full flex items-center justify-center gap-1.5 text-[11px] text-white/30 hover:text-white/55 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create a new account
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 mt-5">
          <Film className="w-3 h-3 inline mr-1" style={{ verticalAlign: '-2px' }} />
          Accounts, avatars, and PINs are stored locally on this device only.
        </p>
      </div>
    </div>
  )
}