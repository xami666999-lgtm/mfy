import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, ExternalLink, LogOut, Save } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey, DEFAULT_TMDB_API_KEY } from '../api/tmdb'
import { setRuntimeOmdbKey } from '../api/omdb'
import { setRuntimeMdblistKey } from '../api/mdblist'
import { setRuntimeSubtitleKey } from '../api/subtitles'
import { loadPlaybackPrefs, savePlaybackPrefs, type UpscaleMode } from '../lib/playbackPrefs'
import { githubToken, pullProgress, pushProgress, saveGithubToken } from '../lib/githubProgress'

export default function Settings() {
  const store = useStore()
  const [tmdbKey, setTmdbKey] = useState(store.tmdbApiKey || '')
  const [omdbKey, setOmdbKey] = useState(store.omdbApiKey || '')
  const [mdblistKey, setMdblistKey] = useState(store.mdblistApiKey || '')
  const [subtitleKey, setSubtitleKey] = useState(store.opensubtitlesKey || '')
  const [saved, setSaved] = useState(false)
  const [gh, setGh] = useState(() => githubToken())
  const [syncNote, setSyncNote] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [hideGlobalCal, setHideGlobalCal] = useState(() => {
    try { return localStorage.getItem('mfy-cal-hide-global') === '1' } catch { return false }
  })
  const [play, setPlay] = useState(() => loadPlaybackPrefs())

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
    const api = (window as any).electronAPI
    if (api?.set) {
      await api.set('tmdbApiKey', key)
      await api.set('omdbApiKey', omdbKey.trim())
      await api.set('mdblistApiKey', mdblistKey.trim())
      await api.set('opensubtitlesKey', subtitleKey.trim())
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
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

      <Section title="Watch progress">
        <p className="set-hint">Progress already saves on this device while you watch. A GitHub token keeps that list if you switch browsers. Create one with only the gist permission.</p>
        <Field label="GitHub token" value={gh} onChange={setGh} placeholder="ghp_…" link="https://github.com/settings/tokens/new?scopes=gist&description=MFY" secret />
        <button
          type="button"
          className="set-btn"
          disabled={syncing}
          onClick={() => {
            setSyncing(true)
            setSyncNote('')
            saveGithubToken(gh)
            void (async () => {
              try {
                const remote = await pullProgress()
                if (remote?.length) store.setWatchHistory(remote)
                await pushProgress(useStore.getState().watchHistory)
                setSyncNote('Progress is saved to a private GitHub gist.')
              } catch (error) {
                setSyncNote(error instanceof Error ? error.message : 'GitHub sync failed.')
              } finally {
                setSyncing(false)
              }
            })()
          }}
        >
          {syncing ? 'Saving…' : 'Save progress to GitHub'}
        </button>
        {syncNote && <p className="set-hint">{syncNote}</p>}
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
        <p className="set-hint">VLC and mpv open the stream outside MFY from the desktop app. Use them when you want a heavier upscaler than the built-in sharpen.</p>
        <div className="set-pair">
          <Num label="Rewind seconds" value={play.seekBack} min={1} max={120} onChange={(n) => setPlay(savePlaybackPrefs({ seekBack: n }))} />
          <Num label="Forward seconds" value={play.seekFwd} min={1} max={120} onChange={(n) => setPlay(savePlaybackPrefs({ seekFwd: n }))} />
        </div>
        <div className="set-pair">
          <Num label="Subtitle delay (sec)" value={play.subDelay} min={-15} max={15} step={0.5} onChange={(n) => setPlay(savePlaybackPrefs({ subDelay: n }))} />
          <Num label="Subtitle hold (sec)" value={play.subHold} min={0} max={8} step={0.5} onChange={(n) => setPlay(savePlaybackPrefs({ subHold: n }))} />
        </div>
        <label className="set-label">Picture</label>
        <select value={play.upscale} onChange={(e) => setPlay(savePlaybackPrefs({ upscale: e.target.value as UpscaleMode }))}>
          <option value="off">Normal</option>
          <option value="sharpen">Sharpen older video</option>
          <option value="anime">Anime sharpen</option>
        </select>
        <p className="set-hint">Sharpen runs on direct video. Embed players ignore it, so pick VLC or mpv above if you want that file enhanced outside the page.</p>
      </Section>

      <Section title="Ratings">
        <Field label="TMDB API key" value={tmdbKey} onChange={setTmdbKey} placeholder="Leave blank to use the built-in key" link="https://www.themoviedb.org/settings/api" />
        <Field label="OMDb API key" value={omdbKey} onChange={setOmdbKey} placeholder="IMDb and Rotten Tomatoes" link="https://www.omdbapi.com/apikey.aspx" />
        <Field label="OpenSubtitles API key" value={subtitleKey} onChange={setSubtitleKey} placeholder="Optional subtitles" link="https://www.opensubtitles.com/en/consumers" />
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

function Num({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void }) {
  return (
    <label className="set-field">
      <span>{label}</span>
      <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
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
