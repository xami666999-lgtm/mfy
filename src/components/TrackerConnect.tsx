import { useEffect, useState } from 'react'
import { serializdApi } from '../api/serializd'
import { setRuntimeMdblistKey } from '../api/mdblist'
import { useStore } from '../store'
import { consumeTrackerReturn, startAnilistLogin, startSimklLogin } from '../lib/trackerLogin'

type Who = 'mdblist' | 'trakt' | 'simkl' | 'anilist' | 'serializd' | 'letterboxd'

const PRIMARY_KEY = 'mfy-tracker-primary'

function keep(key: string, value: string) {
  try { localStorage.setItem('mfy-' + key, JSON.stringify(value)) } catch {}
}

function primaryOf(): Who {
  const v = localStorage.getItem(PRIMARY_KEY) || ''
  if (v === 'trakt' || v === 'simkl' || v === 'anilist' || v === 'serializd' || v === 'letterboxd' || v === 'mdblist') return v
  return 'mdblist'
}

export default function TrackerConnect({ onDone }: { onDone?: () => void }) {
  const store = useStore()
  const [open, setOpen] = useState<Who | null>(null)
  const [menu, setMenu] = useState<Who | null>(null)
  const [primary, setPrimary] = useState<Who>(() => primaryOf())
  const [simklClient, setSimklClient] = useState(() => localStorage.getItem('mfy-simkl-client') || '')
  const [anilistClient, setAnilistClient] = useState(() => localStorage.getItem('mfy-anilist-client') || '')
  const [mail, setMail] = useState(store.serializdEmail || '')
  const [pass, setPass] = useState('')
  const [mdblist, setMdblist] = useState(store.mdblistApiKey || '')
  const [trakt, setTrakt] = useState(store.traktToken || '')
  const [letter, setLetter] = useState(() => localStorage.getItem('mfy-letterboxd-user') || '')
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [simklOn, setSimklOn] = useState(() => !!localStorage.getItem('mfy-simkl-token'))
  const [anilistOn, setAnilistOn] = useState(() => !!localStorage.getItem('mfy-anilist-token'))

  useEffect(() => {
    try {
      const fail = sessionStorage.getItem('mfy-tracker-error')
      if (fail) {
        setErr(fail)
        sessionStorage.removeItem('mfy-tracker-error')
      }
    } catch {}
    consumeTrackerReturn().then((who) => {
      if (who === 'simkl') { setSimklOn(true); setNote('Simkl connected.') }
      if (who === 'anilist') { setAnilistOn(true); setNote('AniList connected.') }
    }).catch((error) => setErr(error instanceof Error ? error.message : 'Tracker sign-in failed.'))
  }, [])

  function makePrimary(id: Who) {
    setPrimary(id)
    try { localStorage.setItem(PRIMARY_KEY, id) } catch {}
    setMenu(null)
  }

  function disconnect(id: Who) {
    if (id === 'mdblist') { store.setMdblistApiKey(''); setRuntimeMdblistKey(''); keep('mdblistApiKey', ''); setMdblist('') }
    if (id === 'trakt') { store.setTraktToken(''); keep('traktToken', ''); setTrakt('') }
    if (id === 'simkl') { try { localStorage.removeItem('mfy-simkl-token') } catch {} setSimklOn(false) }
    if (id === 'anilist') { try { localStorage.removeItem('mfy-anilist-token') } catch {} setAnilistOn(false) }
    if (id === 'serializd') { store.setSerializdToken(''); store.setSerializdSyncEnabled(false) }
    if (id === 'letterboxd') { try { localStorage.removeItem('mfy-letterboxd-user') } catch {} setLetter('') }
    setMenu(null)
    setNote('Disconnected.')
  }

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
      setNote('Serializd connected.')
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Serializd login failed.')
    } finally {
      setBusy(false)
    }
  }

  const cards: { id: Who; name: string; mark: string; connected: boolean; who: string }[] = [
    { id: 'mdblist', name: 'MDBList', mark: 'M', connected: !!mdblist.trim(), who: mdblist.trim() ? 'API key saved' : '' },
    { id: 'trakt', name: 'trakt', mark: '', connected: !!trakt.trim(), who: trakt.trim() ? 'token saved' : '' },
    { id: 'simkl', name: 'SIMKL', mark: 'S', connected: simklOn, who: simklOn ? 'this profile' : '' },
    { id: 'anilist', name: 'AniList', mark: 'A', connected: anilistOn, who: anilistOn ? 'this profile' : '' },
    { id: 'serializd', name: 'Serializd', mark: 'S', connected: !!store.serializdToken, who: store.serializdEmail || '' },
    { id: 'letterboxd', name: 'Letterboxd', mark: 'L', connected: !!letter.trim(), who: letter.trim() },
  ]

  return (
    <div className="trk">
      <p className="trk-kicker">Accounts</p>
      <p className="trk-note">Free trackers. Finished episodes sync to the ones you connect. One can be primary.</p>
      {cards.map((c) => (
        <article key={c.id} className={`trk-card ${c.id}${open === c.id ? ' open' : ''}`}>
          <button type="button" className="trk-menu" aria-label={`${c.name} menu`} onClick={() => setMenu(menu === c.id ? null : c.id)}>☰</button>
          {menu === c.id && (
            <div className="trk-pop">
              <button type="button" onClick={() => makePrimary(c.id)}>Set as primary</button>
              <button type="button" onClick={() => disconnect(c.id)}>Disconnect</button>
            </div>
          )}
          <button type="button" className="trk-main" onClick={() => setOpen(open === c.id ? null : c.id)}>
            <div className="trk-name">
              {c.id === 'mdblist' && <i className="trk-logo">M</i>}
              <strong>{c.name}</strong>
              {primary === c.id && <em>Primary</em>}
            </div>
            <span>{c.connected ? `Connected as ${c.who || 'you'}` : 'Not connected'}</span>
            <b className="trk-ghost">{c.mark || c.name.slice(0, 1)}</b>
          </button>
          <button type="button" className="trk-chev" aria-label="Expand" onClick={() => setOpen(open === c.id ? null : c.id)}>⌄</button>
          {open === c.id && (
            <div className="trk-body" onClick={(e) => e.stopPropagation()}>
              {c.id === 'mdblist' && (
                <>
                  <input placeholder="MDBList API key" value={mdblist} onChange={(e) => setMdblist(e.target.value)} />
                  <button type="button" onClick={() => { store.setMdblistApiKey(mdblist.trim()); setRuntimeMdblistKey(mdblist.trim()); keep('mdblistApiKey', mdblist.trim()); setNote('MDBList key saved.') }}>Save key</button>
                </>
              )}
              {c.id === 'trakt' && (
                <>
                  <input placeholder="Trakt access token" value={trakt} onChange={(e) => setTrakt(e.target.value)} />
                  <button type="button" onClick={() => { store.setTraktToken(trakt.trim()); keep('traktToken', trakt.trim()); setNote('Trakt token saved.') }}>Save token</button>
                </>
              )}
              {c.id === 'simkl' && (
                <>
                  <input placeholder="Simkl client ID" value={simklClient} onChange={(e) => setSimklClient(e.target.value)} />
                  <button type="button" onClick={() => startSimklLogin(simklClient.trim()).catch((error) => setErr(error instanceof Error ? error.message : 'Simkl login failed.'))}>
                    {simklOn ? 'Sign in again' : 'Sign in with Simkl'}
                  </button>
                </>
              )}
              {c.id === 'anilist' && (
                <>
                  <input placeholder="AniList client ID" value={anilistClient} onChange={(e) => setAnilistClient(e.target.value)} />
                  <button type="button" onClick={() => { try { startAnilistLogin(anilistClient.trim()) } catch (error) { setErr(error instanceof Error ? error.message : 'AniList login failed.') } }}>
                    {anilistOn ? 'Sign in again' : 'Sign in with AniList'}
                  </button>
                </>
              )}
              {c.id === 'serializd' && (
                <>
                  <input placeholder="Email" value={mail} onChange={(e) => setMail(e.target.value)} />
                  <input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} />
                  <button type="button" disabled={busy} onClick={() => void serializd()}>{busy ? 'Signing in…' : 'Sign in'}</button>
                </>
              )}
              {c.id === 'letterboxd' && (
                <>
                  <input placeholder="Letterboxd username" value={letter} onChange={(e) => setLetter(e.target.value)} />
                  <button type="button" onClick={() => { try { localStorage.setItem('mfy-letterboxd-user', letter.trim()) } catch {} setNote('Letterboxd username saved.') }}>Save</button>
                </>
              )}
            </div>
          )}
        </article>
      ))}
      {note && <p className="trk-ok">{note}</p>}
      {err && <p className="trk-err">{err}</p>}
      {onDone && <button type="button" className="trk-done" onClick={onDone}>Continue</button>}
    </div>
  )
}
