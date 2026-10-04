import { useState } from 'react'
import { useStore } from '../store'
import { GoogleUser, googleClientId, renderGoogleButton } from '../auth/google'
import ProfileManage from './ProfileManage'

const AVATARS = Array.from({ length: 8 }, (_, i) => `https://api.dicebear.com/9.x/adventurer/svg?seed=mfy${i + 1}`)

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

export default function LoginGate() {
  const { profiles, addProfile, setProfilePin, setProfileAvatar, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const hasAccount = profiles.length > 0
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
  const [picked, setPicked] = useState('')
  const [pinTry, setPinTry] = useState('')
  const [editing, setEditing] = useState(false)
  const [manageId, setManageId] = useState('')
  const [err, setErr] = useState('')

  function enter(id: string) {
    switchProfile(id)
    setAuthenticated(true)
    setCurrentPage('home')
  }

  function acceptGoogle(user: GoogleUser) {
    const existing = useStore.getState().profiles.find((p) => (p.email || '').toLowerCase() === user.email.toLowerCase())
    const id = existing?.id || addProfile(user.name || user.email.split('@')[0], user.picture || avatar, user.email)
    if (user.picture) setProfileAvatar(id, user.picture)
    enter(id)
  }

  async function onGoogle() {
    setErr('')
    const api = (window as unknown as { electronAPI?: { googleSignIn?: () => Promise<GoogleUser> } }).electronAPI
    if (api?.googleSignIn) {
      try { acceptGoogle(await api.googleSignIn()) }
      catch (error) { setErr(error instanceof Error ? error.message : 'Google sign-in was closed.') }
      return
    }
    const id = await googleClientId()
    if (!id) {
      setErr('Google sign-in is not set up yet. Use the form below.')
      return
    }
    const el = document.getElementById('mfy-google-btn')
    if (!el) return
    try { await renderGoogleButton(el, acceptGoogle) }
    catch (error) { setErr(error instanceof Error ? error.message : 'Google sign-in failed.') }
  }

  function create() {
    setErr('')
    if (!username.trim()) return setErr('Username required.')
    if (!validEmail(email)) return setErr('Enter a Gmail / email.')
    if (password.length < 6) return setErr('Password min 6 characters.')
    if (password !== confirm) return setErr('Passwords do not match.')
    const id = addProfile(username.trim(), avatar, email.trim().toLowerCase())
    setProfilePin(id, password)
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirm('')
    let already = false
    try { already = !!(localStorage.getItem('mfy-simkl') || localStorage.getItem('mfy-simkl-client')) } catch {}
    if (already) {
      setPicked('')
      setStep('who')
      return
    }
    setStep('trackers')
  }

  function signin() {
    setErr('')
    const q = email.trim().toLowerCase()
    const p = useStore.getState().profiles.find((x) => (x.email || '').toLowerCase() === q || x.name.toLowerCase() === q || x.name.toLowerCase() === username.trim().toLowerCase())
    if (!p) return setErr('No account for that Gmail / username.')
    if (p.pin && p.pin !== password) return setErr('Wrong password.')
    setPassword('')
    enter(p.id)
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
            setPicked('')
            setPinTry('')
            setStep('who')
          }}>Continue</button>
        </div>
      </div>
    )
  }

  if (step === 'who') {
    if (manageId) return <ProfileManage id={manageId} onClose={() => setManageId('')} />
    if (!profiles.length) {
      return (
        <div className="nf-gate">
          <h1>Who's watching?</h1>
          <button type="button" className="nf-edit" onClick={() => { setMode('create'); setStep('auth') }}>Add Profile</button>
        </div>
      )
    }
    const pickedProfile = profiles.find((p) => p.id === picked)
    return (
      <div className="nf-gate">
        <h1>{editing ? 'Manage Profiles' : "Who's watching?"}</h1>
        <div className="nf-profiles">
          {profiles.map((p) => (
            <button key={p.id} type="button" className="nf-profile" onClick={() => {
              if (editing) { setManageId(p.id); return }
              if (p.pin) { setPicked(p.id); setPinTry(''); setErr(''); return }
              enter(p.id)
            }}>
              <span className={picked === p.id ? 'ring' : ''}>
                {p.avatar ? <img src={p.avatar} alt="" /> : <b>{p.name[0]}</b>}
                {editing && <i>Edit</i>}
              </span>
              <small>{p.name}</small>
            </button>
          ))}
          <button type="button" className="nf-profile add" onClick={() => {
            setEditing(false)
            setPicked('')
            setMode('create')
            setUsername('')
            setEmail('')
            setPassword('')
            setConfirm('')
            setErr('')
            setStep('auth')
          }}>
            <span><b>+</b></span>
            <small>Add Profile</small>
          </button>
        </div>
        {pickedProfile?.pin && !editing && (
          <form className="nf-pin-form" onSubmit={(e) => {
            e.preventDefault()
            if (pickedProfile.pin === pinTry) enter(pickedProfile.id)
            else setErr('Wrong PIN.')
          }}>
            <p>PIN for {pickedProfile.name}</p>
            <input className="nf-pin" type="password" placeholder="PIN" value={pinTry} autoFocus onChange={(e) => setPinTry(e.target.value)} />
            <button type="submit" className="nf-edit">Continue</button>
          </form>
        )}
        {err && <p className="nf-err">{err}</p>}
        <div className="nf-gate-actions">
          <button type="button" className="nf-edit" onClick={() => { setEditing((v) => !v); setErr(''); setPicked('') }}>{editing ? 'Done' : 'Manage Profiles'}</button>
          <button type="button" className="nf-edit" onClick={() => { setMode('signin'); setStep('auth'); setErr(''); setPassword(''); setEmail(''); setUsername('') }}>Use another account</button>
        </div>
      </div>
    )
  }

  return (
    <div className="nf-gate" style={{ justifyContent: 'flex-start', paddingTop: 72 }}>
      <div className="w-full max-w-sm">
        <p className="text-center text-white/40 text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
        <h1 className="text-center text-2xl font-bold text-white mb-6">{mode === 'create' ? 'Create profile' : mode === 'reset' ? 'Reset password' : 'Sign in'}</h1>
        {mode !== 'reset' && (
          <div className="mb-4">
            <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={() => void onGoogle()}>Continue with Google</button>
            <div id="mfy-google-btn" className="flex justify-center mt-3" />
            <p className="text-center text-[11px] text-white/30 mt-3">or use your profile</p>
          </div>
        )}
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
