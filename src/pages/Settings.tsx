import { useState, useEffect } from 'react'
import { Save, Check, ExternalLink, RefreshCw, FolderPlus, UserPlus, X, Magnet, Lock, LogOut } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey } from '../api/tmdb'
import { setRuntimeOmdbKey } from '../api/omdb'
import { setRuntimeMdblistKey } from '../api/mdblist'
import type { ThemeId } from '../store'
import { listTorrents, removeTorrent, onTorrentProgress, formatBytes, formatSpeed } from '../api/torrent'

export default function Settings() {
  const store = useStore()
  const [tmdbKey, setTmdbKey] = useState(store.tmdbApiKey)
  const [traktTok, setTraktTok] = useState(store.traktToken)
  const [rdKey, setRdKey] = useState(store.realDebridKey)
  const [aiosUrl, setAiosUrl] = useState(store.aiostreamsUrl)
  const [jellyfinUrl, setJellyfinUrl] = useState(store.jellyfinUrl)
  const [jellyfinKey, setJellyfinKey] = useState(store.jellyfinApiKey)
  const [omdbKey, setOmdbKey] = useState(store.omdbApiKey)
  const [mdblistKey, setMdblistKey] = useState(store.mdblistApiKey)
  const [saved, setSaved] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const theme = store.theme
  const externalPlayer = store.externalPlayer
  const profiles = store.profiles
  const localFolders = store.localFolders

  async function save() {
    const api = (window as any).electronAPI
    store.setTmdbApiKey(tmdbKey)
    setRuntimeTmdbKey(tmdbKey)
    store.setTraktToken(traktTok)
    store.setRealDebridKey(rdKey)
    store.setAiostreamsUrl(aiosUrl)
    store.setJellyfinUrl(jellyfinUrl)
    store.setJellyfinApiKey(jellyfinKey)
    store.setOmdbApiKey(omdbKey)
    setRuntimeOmdbKey(omdbKey)
    store.setMdblistApiKey(mdblistKey)
    setRuntimeMdblistKey(mdblistKey)
    if (api) {
      await api.set('tmdbApiKey', tmdbKey)
      await api.set('traktToken', traktTok)
      await api.set('realDebridKey', rdKey)
      await api.set('aiostreamsUrl', aiosUrl)
      await api.set('jellyfinUrl', jellyfinUrl)
      await api.set('jellyfinApiKey', jellyfinKey)
      await api.set('omdbApiKey', omdbKey)
      await api.set('mdblistApiKey', mdblistKey)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [torrents, setTorrents] = useState<any[]>([])
  const [magnetInput, setMagnetInput] = useState('')

  async function refreshTorrents() {
    try {
      setTorrents(await listTorrents())
    } catch {
      setTorrents([])
    }
  }

  useEffect(() => {
    refreshTorrents()
    const unsub = onTorrentProgress((t) => {
      setTorrents((prev) => {
        const idx = prev.findIndex((x) => x.infoHash === t.infoHash)
        if (idx === -1) return [...prev, t]
        const next = prev.slice()
        next[idx] = t
        return next
      })
    })
    return () => unsub()
  }, [])

  async function checkUpdates() {
    const api = (window as any).electronAPI
    if (!api?.checkForUpdates) {
      setUpdateStatus('Auto-update only works in packaged builds.')
      return
    }
    setUpdateStatus('Checking…')
    try {
      const res = await api.checkForUpdates()
      if (res?.ok) {
        setUpdateStatus(res.updateInfo ? `Update found: ${res.updateInfo.version}` : 'You are up to date.')
      } else {
        setUpdateStatus(res?.reason === 'dev-or-unavailable' ? 'Auto-update only works in packaged builds.' : (res?.reason || 'Check failed'))
      }
    } catch {
      setUpdateStatus('Check failed')
    }
    setTimeout(() => setUpdateStatus(null), 5000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-semibold text-white tracking-tight">Settings</h2>
        <div className="flex items-center gap-2">
          <button onClick={checkUpdates} className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/60 hover:bg-white/[0.08] transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
            {updateStatus || 'Check Updates'}
          </button>
          <button onClick={save} className="flex items-center gap-2 h-8 px-4 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white/70 hover:bg-white/[0.1] transition-all">
            {saved ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <p className="text-xs text-white/25 mb-5 max-w-xl leading-relaxed">TMDB provides the broad catalog and metadata index. Jellyfin can be used as an optional local library source. MFY only plays stream URLs you provide or obtain from services you are authorized to use.</p>

      <div className="space-y-4">
        <Section title="API Keys">
          <Input label="TMDB API Key" value={tmdbKey} onChange={setTmdbKey} placeholder="Your TMDB API key" link="https://www.themoviedb.org/settings/api" />
          <Input label="OMDb API Key" value={omdbKey} onChange={setOmdbKey} placeholder="Optional — IMDb + Rotten Tomatoes scores" link="https://www.omdbapi.com/apikey.aspx" />
          <Input label="MDBList API Key" value={mdblistKey} onChange={setMdblistKey} placeholder="Optional — aggregated ratings (IMDb, Trakt, Metacritic, RT, Letterboxd)" link="https://mdblist.com/apikey" />
          <Input label="AIOStreams URL" value={aiosUrl} onChange={setAiosUrl} placeholder="http://localhost:3000 (when ready)" />
          <Input label="Real-Debrid API" value={rdKey} onChange={setRdKey} placeholder="Real-Debrid token" link="https://realdebrid.com/apitoken" type="password" />
          <Input label="Trakt Token (optional)" value={traktTok} onChange={setTraktTok} placeholder="Not required — local lists used by default" type="password" />
          <Input label="Jellyfin Server" value={jellyfinUrl} onChange={setJellyfinUrl} placeholder="http://127.0.0.1:8096" />
          <Input label="Jellyfin API Key" value={jellyfinKey} onChange={setJellyfinKey} placeholder="Optional local media library key" type="password" />
        </Section>

        <Section title="Playback">
          <Toggle label="Auto-resume" description="Remember where you left off" defaultChecked />
          <Toggle label="Auto-download subtitles" description="Find subtitles automatically" defaultChecked />
        </Section>

        <Section title="Appearance">
          <div className="flex flex-wrap gap-2">
            {([
              ['pink', 'Pink'],
              ['cyan', 'Cyan'],
              ['emerald', 'Emerald'],
              ['amber', 'Amber'],
              ['pure', 'Mono'],
            ] as [ThemeId, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => store.setTheme(id)}
                className={`h-8 px-3 rounded-lg text-xs border transition-all ${
                  theme === id
                    ? 'bg-[#FF1493]/15 border-[#FF1493]/40 text-[#FF1493]'
                    : 'bg-white/[0.04] border-white/[0.06] text-white/40 hover:text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Playback">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">External player</label>
            <select
              value={externalPlayer}
              onChange={(e) => store.setExternalPlayer(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/70 focus:outline-none"
            >
              <option value="">Built-in player</option>
              <option value="system">System default (open URL)</option>
              <option value="vlc">VLC (if installed)</option>
              <option value="mpv">mpv (if installed)</option>
            </select>
          </div>
          <Toggle label="Auto-resume" description="Remember where you left off" defaultChecked />
          <Toggle label="Autoplay next episode" description="For TV shows when available" defaultChecked />
        </Section>

        <Section title="Profiles">
          <div className="flex gap-2 mb-2 flex-wrap">
            {profiles.map((pr) => (
              <button
                key={pr.id}
                type="button"
                onClick={() => store.switchProfile(pr.id)}
                className={`h-8 px-3 rounded-lg text-xs border ${
                  store.currentProfile?.id === pr.id
                    ? 'border-[#FF1493]/40 text-[#FF1493] bg-[#FF1493]/10'
                    : 'border-white/[0.06] text-white/40'
                }`}
              >
                {pr.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="New profile name"
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (profileName.trim()) {
                  store.addProfile(profileName.trim())
                  setProfileName('')
                }
              }}
              className="h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60 flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="pt-2 border-t border-white/[0.05] mt-4 space-y-3">
            <p className="text-[10px] text-white/25">Set or change the PIN for your current profile. Leave blank to remove it.</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinMsg('') }}
                placeholder="New PIN (4+ characters)"
                className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!store.currentProfile) return
                  if (pin && pin.length < 4) {
                    setPinMsg('PIN must be at least 4 characters.')
                    return
                  }
                  store.setProfilePin(store.currentProfile.id, pin)
                  const api = (window as any).electronAPI
                  api?.set?.('profiles', store.profiles)
                  setPin('')
                  setPinMsg('PIN updated.')
                  setTimeout(() => setPinMsg(''), 2000)
                }}
                className="h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60 flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> Set PIN
              </button>
            </div>
            {pinMsg && <p className="text-[10px] text-white/40">{pinMsg}</p>}
            <button
              type="button"
              onClick={() => {
                store.setAuthenticated(false)
                store.setCurrentPage('home')
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400/80 hover:bg-red-500/15"
            >
              <LogOut className="w-3.5 h-3.5" /> Log out (back to account picker)
            </button>
          </div>
        </Section>

        <Section title="Torrents">
          <p className="text-[10px] text-white/25">Stream torrents through the built-in WebTorrent engine. Add a magnet link here, then use the player for playback.</p>
          <div className="flex gap-2">
            <input
              value={magnetInput}
              onChange={(e) => setMagnetInput(e.target.value)}
              placeholder="magnet:?xt=urn:btih:…"
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none"
            />
            <button
              type="button"
              onClick={async () => {
                if (!magnetInput.trim()) return
                await (window as any).torrentAPI?.add(magnetInput.trim())
                setMagnetInput('')
                refreshTorrents()
              }}
              className="h-9 px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60 hover:text-white/80 flex items-center gap-1.5"
            >
              <Magnet className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          {torrents.length === 0 && (
            <p className="text-[10px] text-white/20">No active torrents.</p>
          )}
          {torrents.map((t) => (
            <div key={t.infoHash} className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-white/70 truncate min-w-0">{t.name || t.infoHash}</p>
                <button
                  type="button"
                  onClick={async () => {
                    await removeTorrent(t.infoHash)
                    refreshTorrents()
                  }}
                  className="flex-shrink-0 h-7 w-7 grid place-items-center rounded-md bg-white/[0.04] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#FF1493] transition-all" style={{ width: `${Math.round((t.progress || 0) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/30">
                <span>{Math.round((t.progress || 0) * 100)}%</span>
                <span>{formatSpeed(t.downloadSpeed || 0)} down · {formatSpeed(t.uploadSpeed || 0)} up</span>
                <span>{t.numPeers || 0} peers · {formatBytes(t.downloaded || 0)}</span>
              </div>
            </div>
          ))}
        </Section>

        <Section title="Local folders">
          <p className="text-[10px] text-white/25 mb-2">Scan folders of your own video files (no server required).</p>
          {localFolders.map((f) => (
            <div key={f} className="text-xs text-white/40 truncate py-1">{f}</div>
          ))}
          <button
            type="button"
            onClick={async () => {
              const api = (window as any).electronAPI
              const path = api?.selectFolder ? await api.selectFolder() : null
              if (path) store.addLocalFolder(path)
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white/50 hover:text-white/70"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Add folder
          </button>
        </Section>

        <Section title="General">
          <Toggle label="Notifications" description="Alert for new episodes" defaultChecked />
          <Toggle label="Auto-update" description="Silently update when new versions arrive" defaultChecked />
          <p className="text-[10px] text-white/20 pt-1">Shortcuts: 1 Home · 2 Discover · 3 Search · 4 My List · / Search · Esc Back</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
      <h3 className="px-5 py-3 text-[11px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/[0.04]">{title}</h3>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, link, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; link?: string; type?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs text-white/50">{label}</label>
        {link && (
          <button onClick={() => (window as any).electronAPI?.openExternal(link)} className="flex items-center gap-1 text-[10px] text-[#00E5FF]/60 hover:text-[#00E5FF] transition-colors">
            Get Key <ExternalLink className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/15 focus:outline-none focus:border-[#FF1493]/30 transition-all"
      />
    </div>
  )
}

function Toggle({ label, description, defaultChecked = false }: { label: string; description: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-white/60">{label}</p>
        <p className="text-[10px] text-white/20 mt-0.5">{description}</p>
      </div>
      <button onClick={() => setOn(!on)} className={`w-9 h-5 rounded-full transition-all relative ${on ? 'bg-[#FF1493]' : 'bg-white/[0.08]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
