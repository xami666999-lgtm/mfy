import { useEffect, useState } from 'react'
import { useStore } from '../store'

const AVATARS = Array.from({ length: 8 }, (_, i) => `https://api.dicebear.com/9.x/adventurer/svg?seed=mfy${i + 1}`)
const EPOCH = '1713'

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function LoginGate() {
  const { profiles, addProfile, setProfilePin, switchProfile, setAuthenticated, setCurrentPage, setProfiles } = useStore()
  useEffect(() => {
    try {
      if (localStorage.getItem('mfy-epoch') === EPOCH) return
      localStorage.setItem('mfy-epoch', EPOCH)
      setProfiles([])
      setAuthenticated(false)
    } catch {}
  }, [])
  const hasAccount = useStore.getState().profiles.length > 0
  const [step, setStep] = useState<'auth' | 'trackers' | 'who'>(hasAccount ? 'who' : 'auth')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [simkl, setSimkl] = useState('')
  const [discord, setDiscord] = useState('')
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
    const id = addProfile(username.trim(), avatar, email.trim().toLowerCase())
    setProfilePin(id, password)
    setPicked(id)
    setStep('trackers')
  }

  function signin() {
    setErr('')
    const q = email.trim().toLowerCase()
    const p = useStore.getState().profiles.find((x) => (x.email || '').toLowerCase() === q || x.name.toLowerCase() === q || x.name.toLowerCase() === username.trim().toLowerCase())
    if (!p) return setErr('No account for that Gmail / username.')
    if (p.pin && p.pin !== password) return setErr('Wrong password.')
    setPicked(p.id)
    setStep('trackers')
  }

  function sendReset() {
    const p = useStore.getState().profiles.find((x) => (x.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!p) return setErr('No account uses that Gmail.')
    const c = String(Math.floor(100000 + Math.random() * 900000))
    setSent(c)
    setErr('')
  }

  function applyReset() {
    const p = useStore.getState().profiles.find((x) => (x.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!p) return setErr('No account uses that Gmail.')
    if (code !== sent) return setErr('Wrong code.')
    if (password.length < 6 || password !== confirm) return setErr('Set a matching password (6+).')
    setProfilePin(p.id, password)
    setMode('signin')
    setErr('Password saved. Sign in.')
  }

  const field = 'w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-white/40'

  if (step === 'trackers') {
    return (
      <div className="h-screen grid place-items-center bg-black text-white px-6">
        <div className="w-full max-w-md">
          <p className="text-white/50 text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
          <h1 className="text-2xl font-bold mb-2">Connect trackers</h1>
          <p className="text-sm text-white/50 mb-5">Simkl is required. AniList, Letterboxd and Discord are extra.</p>
          <input className={field + ' mb-2'} placeholder="Simkl client / token (required)" value={simkl} onChange={(e) => setSimkl(e.target.value)} />
          <input className={field + ' mb-2'} placeholder="AniList token" value={anilistTok} onChange={(e) => setAnilistTok(e.target.value)} />
          <input className={field + ' mb-2'} placeholder="Letterboxd username" value={letterboxd} onChange={(e) => setLetterboxd(e.target.value)} />
          <input className={field + ' mb-2'} placeholder="Serializd email" value={serializdMail} onChange={(e) => setSerializdMail(e.target.value)} />
          <input className={field + ' mb-2'} type="password" placeholder="Serializd password" value={serializdPass} onChange={(e) => setSerializdPass(e.target.value)} />
          <input className={field + ' mb-4'} placeholder="Discord username (optional login label)" value={discord} onChange={(e) => setDiscord(e.target.value)} />
          {err && <p className="text-red-400 text-xs mb-2">{err}</p>}
          <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={() => {
            if (!simkl.trim()) return setErr('Simkl login is required to continue.')
            try {
              localStorage.setItem('mfy-simkl', simkl.trim())
              if (anilistTok) localStorage.setItem('mfy-anilist-token', anilistTok)
              if (letterboxd) localStorage.setItem('mfy-letterboxd-user', letterboxd)
              if (discord) localStorage.setItem('mfy-discord', discord)
              if (serializdMail) useStore.getState().setSerializdEmail(serializdMail)
            } catch {}
            setStep('who')
          }}>Continue</button>
        </div>
      </div>
    )
  }

  if (step === 'who') {
    const list = useStore.getState().profiles
    return (
      <div className="h-screen grid place-items-center bg-black">
        <div className="text-center px-6">
          <p className="text-white/40 text-xs tracking-[0.35em] font-bold mb-3">MFY</p>
          <h1 className="text-4xl font-bold text-white mb-10">Who’s watching?</h1>
          <div className="flex justify-center gap-8 flex-wrap">
            {list.map((p) => (
              <button key={p.id} type="button" onClick={() => setPicked(p.id)} className="w-28">
                <div className={`w-24 h-24 mx-auto rounded-md overflow-hidden border-2 ${picked === p.id ? 'border-white' : 'border-white/15'}`}>
                  {p.avatar ? <img src={p.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center bg-[#1a1a1a] text-2xl">{p.name[0]}</div>}
                </div>
                <p className={`mt-3 text-sm ${picked === p.id ? 'text-white' : 'text-white/50'}`}>{p.name}</p>
              </button>
            ))}
          </div>
          {picked && list.find((p) => p.id === picked)?.pin && (
            <input className={`${field} max-w-xs mx-auto mt-8`} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          <button type="button" className="mt-8 h-11 px-10 rounded bg-white text-black font-semibold" onClick={() => {
            const p = list.find((x) => x.id === picked)
            if (!p) return
            if (p.pin && p.pin !== password) return setErr('Wrong password.')
            enter(picked)
          }}>Enter MFY</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen grid place-items-center bg-black px-4">
      <div className="w-full max-w-sm">
        <p className="text-center text-white/40 text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
        <h1 className="text-center text-2xl font-bold text-white mb-6">{mode === 'create' ? 'Create profile' : mode === 'reset' ? 'Reset password' : 'Sign in'}</h1>
        {mode === 'create' && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {AVATARS.map((src) => (
              <button key={src} type="button" onClick={() => setAvatar(src)} className={`w-12 h-12 rounded-md overflow-hidden border ${avatar === src ? 'border-white' : 'border-white/15'}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {mode === 'create' && <input className={field} placeholder="Name" value={username} onChange={(e) => setUsername(e.target.value)} />}
          <input className={field} placeholder="Gmail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== 'reset' && <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          {mode === 'create' && <input className={field} type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
          {mode === 'reset' && !sent && <button type="button" className="w-full h-11 rounded-xl bg-white/10 text-white text-sm" onClick={sendReset}>Send code</button>}
          {mode === 'reset' && sent && (
            <>
              <p className="text-[11px] text-white/50">Code preview: <b>{sent}</b></p>
              <input className={field} placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
              <input className={field} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className={field} type="password" placeholder="Confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={applyReset}>Save password</button>
            </>
          )}
          {err && <p className="text-red-400 text-xs">{err}</p>}
          {mode === 'create' && <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={create}>Continue</button>}
          {mode === 'signin' && <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={signin}>Sign in</button>}
        </div>
        <div className="mt-4 text-center text-[11px] text-white/35 space-y-1">
          {mode !== 'signin' && <button type="button" onClick={() => setMode('signin')}>Sign in</button>}
          {mode !== 'create' && <div><button type="button" onClick={() => setMode('create')}>Create profile</button></div>}
        </div>
      </div>
    </div>
  )
}
