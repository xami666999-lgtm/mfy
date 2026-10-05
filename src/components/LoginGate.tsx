import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { GoogleUser, googleClientId, renderGoogleButton } from '../auth/google'
import ProfileManage from './ProfileManage'
import { sendVerificationEmail } from '../lib/verifyEmail'
import TrackerConnect from './TrackerConnect'
import { tmdb, POSTER_URL } from '../api/tmdb'

type Poster = { id: number; name: string; src: string }

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function postersOf(data: any): Poster[] {
  return (data?.results || [])
    .filter((r: any) => r.poster_path)
    .slice(0, 14)
    .map((r: any) => ({ id: r.id, name: r.title || r.name || 'Title', src: `${POSTER_URL}${r.poster_path}` }))
}

export default function LoginGate() {
  const { profiles, addProfile, setProfilePin, setProfileAvatar, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const hasAccount = profiles.length > 0
  const [step, setStep] = useState<'auth' | 'trackers' | 'who'>(hasAccount ? 'who' : 'auth')
  const [posters, setPosters] = useState<{ title: string; items: Poster[] }[]>([])
  const [avatar, setAvatar] = useState('')
  const [simkl, setSimkl] = useState('')
  const [discord, setDiscord] = useState('')
  const [anilistTok, setAnilistTok] = useState('')
  const [letterboxd, setLetterboxd] = useState('')
  const [serializdMail, setSerializdMail] = useState('')
  const [serializdPass, setSerializdPass] = useState('')
  const [mode, setMode] = useState<'signin' | 'create' | 'reset' | 'verify'>(hasAccount ? 'signin' : 'create')
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
  const [busy, setBusy] = useState(false)
  const [pendingCode, setPendingCode] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const [verifyPurpose, setVerifyPurpose] = useState<'create' | 'reset'>('create')

  function watchWithoutAccount() {
    setAuthenticated(true)
    setCurrentPage('home')
  }

  useEffect(() => {
    let dead = false
    Promise.all([
      tmdb.getPopular('movie'),
      tmdb.getPopular('tv'),
      tmdb.discoverTV({ with_genres: '16', with_origin_country: 'JP', sort_by: 'popularity.desc' }),
    ]).then(([movies, shows, anime]) => {
      if (dead) return
      const next = [
        { title: 'Movies', items: postersOf(movies) },
        { title: 'TV Shows', items: postersOf(shows) },
        { title: 'Anime', items: postersOf(anime) },
      ].filter((g) => g.items.length)
      setPosters(next)
      setAvatar((cur) => cur || next[0]?.items[0]?.src || '')
    }).catch(() => {})
    return () => { dead = true }
  }, [])

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
    void deliver(email.trim().toLowerCase(), 'create')
  }

  async function deliver(to: string, purpose: 'create' | 'reset') {
    setBusy(true)
    setErr('')
    try {
      const result = await sendVerificationEmail(to)
      setVerifyPurpose(purpose)
      setEmail(to)
      if ('activation' in result) {
        setPendingCode('')
        setVerifyNote('We emailed that address. Open it and confirm, then tap Resend code. The next email has your 6-digit code.')
        setMode('verify')
        return
      }
      setPendingCode(result.code)
      setVerifyNote(`A 6-digit code is on its way to ${to}.`)
      setCode('')
      setMode('verify')
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Could not send the verification email.')
    } finally {
      setBusy(false)
    }
  }

  function confirmCode() {
    setErr('')
    if (!pendingCode) return setErr('Confirm the email first, then resend the code.')
    if (code.trim() !== pendingCode) return setErr('That code does not match the email.')
    setCode('')
    if (verifyPurpose === 'reset') {
      setSent('ok')
      setMode('reset')
      return
    }
    const id = addProfile(username.trim(), avatar, email.trim().toLowerCase())
    setProfilePin(id, password)
    setUsername('')
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
    if (!p?.email) return setErr('No account uses that Gmail.')
    void deliver(p.email, 'reset')
  }

  function applyReset() {
    const p = useStore.getState().profiles.find((x) => (x.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!p) return setErr('No account uses that Gmail.')
    if (sent !== 'ok') return setErr('Verify the email code first.')
    if (password.length < 6 || password !== confirm) return setErr('Set a matching password (6+).')
    setProfilePin(p.id, password)
    setMode('signin')
    setSent('')
    setPassword('')
    setConfirm('')
    setErr('Password saved. Sign in.')
  }

  const field = 'w-full h-12 px-3 rounded bg-[#141414] border border-[#444] text-[16px] text-white placeholder-white/35 outline-none focus:border-white'
  const guest = <button type="button" className="nf-guest" onClick={watchWithoutAccount}>Watch without logging in</button>

  if (step === 'trackers') {
    return (
      <div className="h-screen overflow-auto bg-black text-white px-6 py-16">
        {guest}
        <div className="w-full max-w-md mx-auto">
          <p className="text-white/50 text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
          <h1 className="text-2xl font-bold mb-2">Connect trackers</h1>
          <p className="text-sm text-white/50 mb-5">Sign in inside MFY. Finished episodes sync to the accounts you connect.</p>
          <TrackerConnect onDone={() => { setPicked(''); setPinTry(''); setStep('who') }} />
          <input className={field + ' mt-3'} placeholder="Letterboxd username (optional)" value={letterboxd} onChange={(e) => setLetterboxd(e.target.value)} />
          <button type="button" className="w-full h-10 mt-2 rounded-xl bg-white/10 text-white text-sm" onClick={() => {
            try { if (letterboxd) localStorage.setItem('mfy-letterboxd-user', letterboxd) } catch {}
            setPicked('')
            setPinTry('')
            setStep('who')
          }}>Skip for now</button>
        </div>
      </div>
    )
  }

  if (step === 'who') {
    if (manageId) return <ProfileManage id={manageId} onClose={() => setManageId('')} />
    if (!profiles.length) {
      return (
        <div className="nf-gate">
          {guest}
          <h1>Who's watching?</h1>
          <button type="button" className="nf-edit" onClick={() => { setMode('create'); setStep('auth') }}>Add Profile</button>
          <button type="button" className="nf-edit" onClick={watchWithoutAccount}>Watch without logging in</button>
        </div>
      )
    }
    const pickedProfile = profiles.find((p) => p.id === picked)
    return (
      <div className="nf-gate">
        {guest}
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

  if (mode === 'verify') {
    return (
      <div className="nf-gate">
        {guest}
        <div className="w-full max-w-sm">
          <p className="text-center text-white/40 text-xs tracking-[0.35em] font-bold mb-2">MFY</p>
          <h1 className="text-center text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-sm text-white/55 text-center mb-5">{verifyNote || `Enter the code sent to ${email}.`}</p>
          <div className="space-y-3">
            <input className={field} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" />
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" disabled={busy} onClick={confirmCode}>Verify</button>
            <button type="button" className="w-full h-11 rounded-xl bg-white/10 text-white text-sm" disabled={busy} onClick={() => void deliver(email, verifyPurpose)}>{busy ? 'Sending\u2026' : 'Resend code'}</button>
            <button type="button" className="w-full text-[11px] text-white/40" onClick={() => { setMode(verifyPurpose === 'reset' ? 'reset' : 'create'); setErr('') }}>Back</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="nf-gate">
      {guest}
      <div className="w-full max-w-[720px]">
        <img src="./logo-mark.png" alt="" className="nf-gate-logo" />
        <h1>{mode === 'create' ? 'Create a profile' : mode === 'reset' ? 'Reset password' : 'Sign in'}</h1>
        {mode !== 'reset' && (
          <div className="mb-4">
            <button type="button" className="w-full h-12 rounded bg-white text-black font-semibold" onClick={() => void onGoogle()}>Continue with Google</button>
            <div id="mfy-google-btn" className="flex justify-center mt-3" />
            <p className="text-center text-[13px] text-white/45 mt-4">or use email</p>
          </div>
        )}
        {mode === 'create' && (
          <div className="nf-pick">
            <p>Choose a profile</p>
            {posters.map((group) => (
              <section key={group.title}>
                <h3>{group.title}</h3>
                <div>
                  {group.items.map((item) => (
                    <button key={`${group.title}-${item.id}`} type="button" className={avatar === item.src ? 'on' : ''} onClick={() => setAvatar(item.src)} title={item.name}>
                      <img src={item.src} alt={item.name} />
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {mode === 'create' && <input className={field} placeholder="Name" value={username} onChange={(e) => setUsername(e.target.value)} />}
          <input className={field} placeholder="Gmail" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode !== 'reset' && <input className={field} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          {mode === 'create' && <input className={field} type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
          {mode === 'reset' && !sent && <button type="button" className="w-full h-12 rounded bg-[#333] text-white" disabled={busy} onClick={sendReset}>{busy ? 'Sending…' : 'Email me a code'}</button>}
          {mode === 'reset' && sent === 'ok' && (
            <>
              <input className={field} type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input className={field} type="password" placeholder="Confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <button type="button" className="w-full h-12 rounded bg-white text-black font-semibold" onClick={applyReset}>Save password</button>
            </>
          )}
          {err && <p className="text-red-400 text-xs">{err}</p>}
          {mode === 'create' && <button type="button" className="w-full h-12 rounded bg-[#e50914] text-white font-semibold" disabled={busy} onClick={create}>{busy ? 'Sending email…' : 'Continue'}</button>}
          {mode === 'signin' && <button type="button" className="w-full h-12 rounded bg-[#e50914] text-white font-semibold" onClick={signin}>Sign in</button>}
        </div>
        <div className="mt-5 text-center text-[14px] text-[#b3b3b3] space-y-2">
          {mode === 'signin' && <div><button type="button" onClick={() => { setMode('reset'); setSent(''); setErr(''); setPassword(''); setConfirm('') }}>Reset password</button></div>}
          {mode !== 'signin' && <button type="button" onClick={() => setMode('signin')}>Sign in</button>}
          {mode !== 'create' && <div><button type="button" onClick={() => setMode('create')}>Create profile</button></div>}
        </div>
      </div>
    </div>
  )
}
