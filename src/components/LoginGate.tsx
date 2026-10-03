import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { GoogleUser, googleClientId, renderGoogleButton } from '../auth/google'

export default function LoginGate() {
  const { addProfile, setProfileAvatar, switchProfile, setAuthenticated, setCurrentPage } = useStore()
  const [err, setErr] = useState('')
  const [clientId, setClientId] = useState('')
  const electron = typeof window !== 'undefined' && (window as unknown as { electronAPI?: { googleSignIn?: () => Promise<GoogleUser> } }).electronAPI?.googleSignIn

  function accept(user: GoogleUser) {
    const existing = useStore.getState().profiles.find((p) => (p.email || '').toLowerCase() === user.email.toLowerCase())
    const id = existing?.id || addProfile(user.name, user.picture, user.email)
    if (user.picture) setProfileAvatar(id, user.picture)
    switchProfile(id)
    setAuthenticated(true)
    setCurrentPage('home')
    try { localStorage.setItem('mfy-google-user', JSON.stringify(user)) } catch {}
  }

  useEffect(() => {
    let dead = false
    googleClientId().then((id) => { if (!dead) setClientId(id) })
    return () => { dead = true }
  }, [])

  useEffect(() => {
    if (electron || !clientId) return
    const el = document.getElementById('mfy-google-btn')
    if (!el) return
    let dead = false
    renderGoogleButton(el, (user) => { if (!dead) accept(user) }).catch((error) => {
      if (!dead) setErr(error instanceof Error ? error.message : 'Google sign-in failed.')
    })
    return () => { dead = true }
  }, [clientId])

  return (
    <div className="h-screen grid place-items-center bg-black px-6 text-white">
      <div className="w-full max-w-sm text-center">
        <p className="text-white/40 text-xs tracking-[0.35em] font-bold mb-3">MFY</p>
        <h1 className="text-3xl font-bold mb-2">Sign in</h1>
        <p className="text-sm text-white/50 mb-8">Use your Google account. MFY never sees the password.</p>
        {electron ? (
          <button
            type="button"
            className="w-full h-12 rounded-full bg-white text-black font-semibold"
            onClick={() => {
              setErr('')
              electron()
                .then(accept)
                .catch((error: unknown) => setErr(error instanceof Error ? error.message : 'Google sign-in was closed.'))
            }}
          >
            Continue with Google
          </button>
        ) : (
          <div id="mfy-google-btn" className="flex justify-center min-h-11" />
        )}
        {!clientId && !electron && <p className="text-white/40 text-xs mt-4">Google’s button appears once the OAuth client is set.</p>}
        {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
      </div>
    </div>
  )
}
