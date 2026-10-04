import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ExternalLink, LogOut, Save } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY } from '../api/tmdb'
import { setRuntimeOmdbKey } from '../api/omdb'
import { setRuntimeMdblistKey } from '../api/mdblist'
import { setRuntimeSubtitleKey } from '../api/subtitles'
import { serializdApi } from '../api/serializd'

export default function Settings() {
  const store = useStore()
  const [tmdbKey, setTmdbKey] = useState(store.tmdbApiKey || '')
  const [omdbKey, setOmdbKey] = useState(store.omdbApiKey || '')
  const [mdblistKey, setMdblistKey] = useState(store.mdblistApiKey || '')
  const [subtitleKey, setSubtitleKey] = useState(store.opensubtitlesKey || '')
  const [traktTok, setTraktTok] = useState(store.traktToken || '')
  const [saved, setSaved] = useState(false)
  const [serializdEmail, setSerializdEmail] = useState(store.serializdEmail || '')
  const [serializdPassword, setSerializdPassword] = useState('')
  const [serializdError, setSerializdError] = useState('')
  const [serializdBusy, setSerializdBusy] = useState(false)
  const [anilistUser, setAnilistUser] = useState(() => {
    try { return localStorage.getItem('mfy-anilist-username') || '' } catch { return '' }
  })
  const [anilistToken, setAnilistToken] = useState(() => {
    try { return localStorage.getItem('mfy-anilist-token') || '' } catch { return '' }
  })
  const [letterboxd, setLetterboxd] = useState(() => {
    try { return localStorage.getItem('mfy-letterboxd-user') || '' } catch { return '' }
  })
  const [simklClient, setSimklClient] = useState(() => {
    try { return localStorage.getItem('mfy-simkl-client') || '' } catch { return '' }
  })
  const [simklToken, setSimklToken] = useState(() => {
    try { return localStorage.getItem('mfy-simkl-token') || '' } catch { return '' }
  })
  const [hideGlobalCal, setHideGlobalCal] = useState(() => {
    try { return localStorage.getItem('mfy-cal-hide-global') === '1' } catch { return false }
  })

  async function save() {
    const key = tmdbKey.trim() || DEFAULT_TMDB_API_KEY
    store.setTmdbApiKey(key)
    setRuntimeTmdbKey(key)
    store.setOmdbApiKey(omdbKey.trim())
    setRuntimeOmdbKey(omdbKey.trim())
    store.setMdblistApiKey(mdblistKey.trim())
    setRuntimeMdblistKey(mdblistKey.trim())
    store.setOpensubtitlesKey(subtitleKey.trim())
    setRuntimeSubtitleKey(subtitleKey.trim())
    store.setTraktToken(traktTok.trim())
    try { localStorage.setItem('mfy-anilist-username', anilistUser.trim()) } catch {}
    try { localStorage.setItem('mfy-anilist-token', anilistToken.trim()) } catch {}
    try { localStorage.setItem('mfy-letterboxd-user', letterboxd.trim()) } catch {}
    try { localStorage.setItem('mfy-simkl-client', simklClient.trim()) } catch {}
    try { localStorage.setItem('mfy-simkl-token', simklToken.trim()) } catch {}
    const api = (window as any).electronAPI
    if (api?.set) {
      await api.set('tmdbApiKey', key)
      await api.set('omdbApiKey', omdbKey.trim())
      await api.set('mdblistApiKey', mdblistKey.trim())
      await api.set('opensubtitlesKey', subtitleKey.trim())
      await api.set('traktToken', traktTok.trim())
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  async function loginSerializd() {
    if (!serializdEmail || !serializdPassword) {
      setSerializdError('Email and password required')
      return
    }
    setSerializdBusy(true)
    setSerializdError('')
    try {
      const res = await serializdApi.login(serializdEmail, serializdPassword)
      serializdApi.loadToken(res.access_token)
      store.setSerializdEmail(serializdEmail)
      store.setSerializdToken(res.access_token)
      store.setSerializdUser(res.user)
      store.setSerializdSyncEnabled(true)
      setSerializdPassword('')
      const api = (window as any).electronAPI
      if (api?.set) {
        await api.set('serializdEmail', serializdEmail)
        await api.set('serializdToken', res.access_token)
        await api.set('serializdUser', res.user)
        await api.set('serializdSyncEnabled', true)
      }
    } catch (e: any) {
      setSerializdError(e?.message || 'Login failed')
    } finally {
      setSerializdBusy(false)
    }
  }

  return (
    <div className="set-page">
      <header className="set-head">
        <div>
          <h1>Settings</h1>
          <p>Only the accounts and keys this app actually uses.</p>
        </div>
        <button type="button" onClick={save}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Saved' : 'Save'}
        </button>
      </header>

      <Section title="Profile">
        <div className="set-profile">
          <span>{(store.currentProfile?.name || 'M')[0]}</span>
          <div>
            <strong>{store.currentProfile?.name || 'Profile'}</strong>
            <small>Who’s Watching</small>
          </div>
        </div>
        <button type="button" className="set-btn" onClick={() => store.setAuthenticated(false)}>Switch profile</button>
        <button type="button" className="set-btn ghost" onClick={() => { store.setAuthenticated(false); store.setCurrentPage('home') }}>
          <LogOut size={14} /> Sign out
        </button>
      </Section>

      <Section title="Calendar">
        <Toggle
          label="Hide global release calendar"
          description="Calendar then shows only titles from your library."
          checked={hideGlobalCal}
          onChange={(v) => {
            setHideGlobalCal(v)
            try { localStorage.setItem('mfy-cal-hide-global', v ? '1' : '0') } catch {}
          }}
        />
      </Section>

      <Section title="Playback">
        <label className="set-label">Player</label>
        <select
          value={store.externalPlayer || ''}
          onChange={(e) => store.setExternalPlayer(e.target.value)}
        >
          <option value="">Built-in player</option>
          <option value="system">System default</option>
          <option value="vlc">VLC</option>
          <option value="mpv">mpv</option>
        </select>
      </Section>

      <Section title="Ratings">
        <Field label="TMDB API key" value={tmdbKey} onChange={setTmdbKey} placeholder="Leave blank to use the built-in key" link="https://www.themoviedb.org/settings/api" />
        <Field label="OMDb API key" value={omdbKey} onChange={setOmdbKey} placeholder="IMDb and Rotten Tomatoes" link="https://www.omdbapi.com/apikey.aspx" />
        <Field label="MDBList API key" value={mdblistKey} onChange={setMdblistKey} placeholder="Optional extra scores" link="https://mdblist.com/apikey" />
        <Field label="OpenSubtitles API key" value={subtitleKey} onChange={setSubtitleKey} placeholder="Optional subtitles" link="https://www.opensubtitles.com/en/consumers" />
        <Field label="Trakt token" value={traktTok} onChange={setTraktTok} placeholder="Optional" secret />
        <Field label="Simkl client ID" value={simklClient} onChange={setSimklClient} placeholder="From simkl.com/settings/developer" link="https://simkl.com/settings/developer/" />
        <Field label="Simkl access token" value={simklToken} onChange={setSimklToken} placeholder="Optional" secret />
        <Field label="AniList username" value={anilistUser} onChange={setAnilistUser} placeholder="For anime scores" link="https://anilist.co" />
        <Field label="AniList token" value={anilistToken} onChange={setAnilistToken} placeholder="Only if you rate anime" secret link="https://anilist.co/settings/developer" />
        <Field label="Letterboxd username" value={letterboxd} onChange={setLetterboxd} placeholder="Movies only" link="https://letterboxd.com" />
        <div className="set-split">
          <h3>Serializd</h3>
          {store.serializdToken ? (
            <div className="set-row">
              <span>Signed in{store.serializdUser?.username ? ` as ${store.serializdUser.username}` : ''}</span>
              <button type="button" className="set-btn ghost" onClick={() => {
                serializdApi.accessToken = null
                store.setSerializdToken('')
                store.setSerializdUser(null)
                store.setSerializdSyncEnabled(false)
              }}>Log out</button>
            </div>
          ) : (
            <>
              <Field label="Email" value={serializdEmail} onChange={setSerializdEmail} placeholder="you@email.com" />
              <Field label="Password" value={serializdPassword} onChange={setSerializdPassword} placeholder="Password" secret />
              {serializdError && <p className="set-err">{serializdError}</p>}
              <button type="button" className="set-btn" disabled={serializdBusy} onClick={loginSerializd}>{serializdBusy ? 'Signing in…' : 'Sign in to Serializd'}</button>
            </>
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="set-card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, placeholder, link, secret }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  link?: string
  secret?: boolean
}) {
  return (
    <label className="set-field">
      <span>
        {label}
        {link && (
          <a href={link} target="_blank" rel="noreferrer">Get key <ExternalLink size={11} /></a>
        )}
      </span>
      <input type={secret ? 'password' : 'text'} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
    </label>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="set-toggle">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button type="button" className={checked ? 'on' : ''} aria-pressed={checked} onClick={() => onChange(!checked)} />
    </div>
  )
}
