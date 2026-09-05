import { useState } from 'react'
import { useStore } from '../store'

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function LoginGate() {
  const { profiles, addProfile, setProfilePin, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const hasAccount = profiles.length > 0
  const [step, setStep] = useState<'auth' | 'trackers' | 'who'>(hasAccount ? 'who' : 'auth')
  const [anilistTok, setAnilistTok] = useState('')
  const [letterboxd, setLetterboxd] = useState('')
  const [serializdMail, setSerializdMail] = useState('')
  const [serializdPass, setSerializdPass] = useState('')
  const [mode, setMode] = useState<'signin' | 'create' | 'reset'>(hasAccount ? 'signin' : 'create')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState('')
  const [picked, setPicked] = useState(profiles[0]?.id || '')
  const [err, setErr] = useState('')

  function enter(id: string) {
    switchProfile(id)
    setAuthenticated(true)
    setCurrentPage('home')
  }

  function create() {
    setErr('')
    if (!username.trim()) return setErr('Username required.')
    if (!validEmail(email)) return setErr('Enter a Gmail / email.')
    if (password.length < 6) return setErr('Password min 6 characters.')
    if (password !== confirm) return setErr('Passwords do not match.')
    const id = addProfile(username.trim(), '', email.trim().toLowerCase())
    setProfilePin(id, password)
    setPicked(id)
    setStep('trackers')
  }

  function signin() {
    setErr('')
    const q = email.trim().toLowerCase()
    const p = profiles.find((x) => (x.email || '').toLowerCase() === q || x.name.toLowerCase() === q || x.name.toLowerCase() === username.trim().toLowerCase())
    if (!p) return setErr('No account for that Gmail / username.')
    if (p.pin && p.pin !== password) return setErr('Wrong password.')
    setPicked(p.id)
    setStep('trackers')
  }

  function sendReset() {
    const p = profiles.find((x) => (x.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!p) return setErr('No account uses that Gmail.')
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setSent(c)
    setErr('')
  }

  function applyReset() {
    const p = profiles.find((x) => (x.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!p) return setErr('No account uses that Gmail.')
    if (code !== sent) return setErr('Wrong code.')
    if (password.length < 6 || password !== confirm) return setErr('Set a matching password (6+).')
    setProfilePin(p.id, password)
    setMode('signin')
    setErr('Password saved. Sign in.')
  }

  const field = 'w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-[#FF1493]/50'

  if (step === 'trackers') {
    return (
      <div className="h-screen grid place-items-center bg-[#08080e] text-white px-6">
        <div className="w-full max-w-md">
          <p className="text-[#FF1493] text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
          <h1 className="text-2xl font-bold mb-2">Connect your trackers</h1>
          <p className="text-sm text-white/50 mb-5">After each movie / episode you can rate and sync: AniList for anime, Serializd for series, Letterboxd for movies.</p>
          <input className={field + ' mb-2'} placeholder="AniList token" value={anilistTok} onChange={(e) => setAnilistTok(e.target.value)} />
          <input className={field + ' mb-2'} placeholder="Letterboxd username" value={letterboxd} onChange={(e) => setLetterboxd(e.target.value)} />
          <input className={field + ' mb-2'} placeholder="Serializd email" value={serializdMail} onChange={(e) => setSerializdMail(e.target.value)} />
          <input className={field + ' mb-4'} type="password" placeholder="Serializd password" value={serializdPass} onChange={(e) => setSerializdPass(e.target.value)} />
          <button type="button" className="w-full h-11 rounded-xl bg-[#FF1493] font-semibold" onClick={() => {
            try {
              if (anilistTok) localStorage.setItem('mfy-anilist-token', anilistTok)
              if (letterboxd) localStorage.setItem('mfy-letterboxd-user', letterboxd)
              if (serializdMail) useStore.getState().setSerializdEmail(serializdMail)
            } catch {}
            setStep('who')
          }}>Save and continue</button>
        </div>
      </div>
    )
  }

  if (step === 'who') {
    return (
      <div className="h-screen grid place-items-center bg-[#08080e]">
        <div className="text-center px-6">
          <p className="text-[#FF1493] text-xs tracking-[0.35em] font-bold mb-3">MFY</p>
          <h1 className="text-4xl font-bold text-white mb-10">Who’s watching?</h1>
          <div className="flex justify-center gap-8 flex-wrap">
            {profiles.map((p) => (
              <button key={p.id} type="button" onClick={() => setPicked(p.id)} className="w-28">
                <div className={`w-24 h-24 mx-auto rounded-full overflow-hidden border-2 ${picked === p.id ? 'border-[#FF1493]' : 'border-white/15'}`}>
                  {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center bg-[#1a1220] text-2xl text-[#FF1493]">{p.name[0]}</div>}
                </div>
                <p className={`mt-3 text-sm ${picked === p.id ? 'text-white' : 'text-white/50'}`}>{p.name}</p>
              </button>
            ))}
          </div>
          {picked && profiles.find((p) => p.id === picked)?.pin && (
            <input className={`${field} max-w-xs mx-auto mt-8`} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (profiles.find((p) => p.id === picked)?.pin === password ? enter(picked) : setErr('Wrong password.'))} />
          )}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          <button
            type="button"
            className="mt-8 h-11 px-10 rounded-full bg-[#FF1493] text-white font-semibold"
            onClick={() => {
              const p = profiles.find((x) => x.id === picked)
              if (!p) return
              if (p.pin && p.pin !== password) return setErr('Wrong password.')
              enter(picked)
            }}
          >
            Enter MFY
          </button>
          <div className="mt-4 text-[11px] text-white/35 space-x-3">
            <button type="button" onClick={() => { setStep('auth'); setMode('reset'); setErr('') }}>Forgot password? Reset with Gmail</button>
            <button type="button" onClick={() => { setStep('auth'); setMode('create'); setErr('') }}>Add account</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen grid place-items-center bg-[#08080e] px-4">
      <div className="w-full max-w-sm">
        <p className="text-center text-[#FF1493] text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
        <h1 className="text-center text-2xl font-bold text-white mb-6">{mode === 'create' ? 'Create account' : mode === 'reset' ? 'Reset password' : 'Sign in'}</h1>
        <div className="space-y-3">
          {mode === 'create' && <input className={field} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />}
          <input className={field} placeholder="Gmail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== 'reset' && <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          {mode === 'create' && <input className={field} type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
          {mode === 'reset' && !sent && <button type="button" className="w-full h-11 rounded-xl bg-white/10 text-white text-sm" onClick={sendReset}>Send code</button>}
          {mode === 'reset' && sent && (
            <>
              <p className="text-[11px] text-white/50">Code for this PC preview: <b className="text-[#FF1493]">{sent}</b></p>
              <input className={field} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
              <input className={field} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className={field} type="password" placeholder="Confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <button type="button" className="w-full h-11 rounded-xl bg-[#FF1493] text-white font-semibold" onClick={applyReset}>Save password</button>
            </>
          )}
          {err && <p className="text-red-400 text-xs">{err}</p>}
          {mode === 'create' && <button type="button" className="w-full h-11 rounded-xl bg-[#FF1493] text-white font-semibold" onClick={create}>Create account</button>}
          {mode === 'signin' && <button type="button" className="w-full h-11 rounded-xl bg-[#FF1493] text-white font-semibold" onClick={signin}>Sign in</button>}
        </div>
        <div className="mt-4 text-center text-[11px] text-white/35 space-y-1">
          {mode !== 'signin' && <button type="button" onClick={() => setMode('signin')}>Already have an account? Sign in</button>}
          {mode !== 'create' && <div><button type="button" onClick={() => setMode('create')}>Create account</button></div>}
          {mode !== 'reset' && <div><button type="button" onClick={() => setMode('reset')}>Forgot password?</button></div>}
        </div>
      </div>
    </div>
  )
}
