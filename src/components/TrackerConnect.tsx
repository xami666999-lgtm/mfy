import { useEffect, useState } from 'react'
import { serializdApi } from '../api/serializd'
import { useStore } from '../store'
import { consumeTrackerReturn, startAnilistLogin, startSimklLogin } from '../lib/trackerLogin'

const field = 'w-full h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/30 outline-none focus:border-white/40'

export default function TrackerConnect({ onDone }: { onDone?: () => void }) {
  const store = useStore()
  const [simklClient, setSimklClient] = useState(() => localStorage.getItem('mfy-simkl-client') || '')
  const [anilistClient, setAnilistClient] = useState(() => localStorage.getItem('mfy-anilist-client') || '')
  const [mail, setMail] = useState(store.serializdEmail || '')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [simklOn, setSimklOn] = useState(() => !!localStorage.getItem('mfy-simkl-token'))
  const [anilistOn, setAnilistOn] = useState(() => !!localStorage.getItem('mfy-anilist-token'))

  useEffect(() => {
    consumeTrackerReturn().then((who) => {
      if (who === 'simkl') { setSimklOn(true); setNote('Simkl connected. Finished episodes will show up there.') }
      if (who === 'anilist') { setAnilistOn(true); setNote('AniList connected. Finished anime episodes will update your list.') }
    }).catch(() => {})
  }, [])

  async function serializd() {
    setErr('')
    setBusy(true)
    try {
      const res = await serializdApi.login(mail.trim(), pass)
      serializdApi.loadToken(res.access_token, false)
      store.setSerializdEmail(mail.trim())
      store.setSerializdToken(res.access_token)
      store.setSerializdUser(res.user)
      store.setSerializdSyncEnabled(true)
      setPass('')
      setNote('Serializd connected. Finished TV episodes will be logged.')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Serializd login failed.'
      setErr(/fetch|network/i.test(msg) ? 'Serializd blocked this website. Sign in from the desktop app, or use Simkl for progress.' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/55">Sign in here. After an episode ends, MFY marks it on the accounts you connect.</p>
      <input className={field} placeholder="Simkl client ID" value={simklClient} onChange={(e) => setSimklClient(e.target.value)} />
      <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={() => {
        setErr('')
        startSimklLogin(simklClient.trim()).catch((error) => setErr(error instanceof Error ? error.message : 'Simkl login failed.'))
      }}>{simklOn ? 'Simkl connected — sign in again' : 'Sign in with Simkl'}</button>
      <input className={field} placeholder="AniList client ID" value={anilistClient} onChange={(e) => setAnilistClient(e.target.value)} />
      <button type="button" className="w-full h-11 rounded-xl bg-white/10 text-white font-semibold" onClick={() => {
        setErr('')
        try { startAnilistLogin(anilistClient.trim()) }
        catch (error) { setErr(error instanceof Error ? error.message : 'AniList login failed.') }
      }}>{anilistOn ? 'AniList connected — sign in again' : 'Sign in with AniList'}</button>
      <input className={field} placeholder="Serializd email" value={mail} onChange={(e) => setMail(e.target.value)} />
      <input className={field} type="password" placeholder="Serializd password" value={pass} onChange={(e) => setPass(e.target.value)} />
      <button type="button" className="w-full h-11 rounded-xl bg-white/10 text-white font-semibold" disabled={busy} onClick={() => void serializd()}>{busy ? 'Signing in…' : store.serializdToken ? 'Serializd connected — sign in again' : 'Sign in with Serializd'}</button>
      {note && <p className="text-emerald-300 text-xs">{note}</p>}
      {err && <p className="text-red-400 text-xs">{err}</p>}
      <p className="text-[11px] text-white/35">AniList redirect: this site URL. Simkl app type: public, scope media:write, same redirect. One-time setup at each site’s developer page.</p>
      {onDone && <button type="button" className="w-full h-11 rounded-xl bg-white text-black font-semibold" onClick={onDone}>Continue</button>}
    </div>
  )
}
