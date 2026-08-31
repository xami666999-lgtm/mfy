import { useState, useEffect } from 'react'
import { Save, Check, ExternalLink, RefreshCw, FolderPlus, UserPlus, X, Magnet, Lock, LogOut, User, Link, Unlink, Eye, EyeOff } from 'lucide-react'
import { useStore } from '../store'
import { setRuntimeTmdbKey } from '../api/tmdb'
import { setRuntimeOmdbKey } from '../api/omdb'
import { setRuntimeMdblistKey } from '../api/mdblist'
import { setRuntimeSubtitleKey } from '../api/subtitles'
import type { ThemeId } from '../store'
import { cn } from '../lib/utils'
import { listTorrents, removeTorrent, onTorrentProgress, formatBytes, formatSpeed } from '../api/torrent'
import { serializdApi } from '../api/serializd'

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
  const [subtitleKey, setSubtitleKey] = useState(store.opensubtitlesKey)
  const [saved, setSaved] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const theme = store.theme
  const externalPlayer = store.externalPlayer
  const profiles = store.profiles
  const localFolders = store.localFolders

  // Serializd
  const [serializdEmail, setSerializdEmail] = useState(store.serializdEmail)
  const [serializdPassword, setSerializdPassword] = useState('')
  const [serializdStatus, setSerializdStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [serializdError, setSerializdError] = useState('')
  const [showSerializdPassword, setShowSerializdPassword] = useState(false)

  const api = (window as any).electronAPI

  async function save() {
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
    store.setOpensubtitlesKey(subtitleKey)
    setRuntimeSubtitleKey(subtitleKey)
    if (api) {
      await api.set('tmdbApiKey', tmdbKey)
      await api.set('traktToken', traktTok)
      await api.set('realDebridKey', rdKey)
      await api.set('aiostreamsUrl', aiosUrl)
      await api.set('jellyfinUrl', jellyfinUrl)
      await api.set('jellyfinApiKey', jellyfinKey)
      await api.set('omdbApiKey', omdbKey)
      await api.set('mdblistApiKey', mdblistKey)
      await api.set('opensubtitlesKey', subtitleKey)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function loginSerializd() {
    if (!serializdEmail || !serializdPassword) {
      setSerializdError('Email and password required')
      return
    }
    setSerializdStatus('loading')
    setSerializdError('')
    try {
      const res = await serializdApi.login(serializdEmail, serializdPassword)
      serializdApi.loadToken(res.access_token)
      store.setSerializdEmail(serializdEmail)
      store.setSerializdToken(res.access_token)
      store.setSerializdUser(res.user)
      store.setSerializdSyncEnabled(true)
      setSerializdStatus('success')
      setSerializdPassword('')
      if (api) {
        await api.set('serializdEmail', serializdEmail)
        await api.set('serializdToken', res.access_token)
        await api.set('serializdUser', res.user)
        await api.set('serializdSyncEnabled', true)
      }
    } catch (e: any) {
      setSerializdError(e.message || 'Login failed')
      setSerializdStatus('error')
    }
  }

  async function logoutSerializd() {
    serializdApi.accessToken = null
    store.setSerializdToken('')
    store.setSerializdUser(null)
    store.setSerializdSyncEnabled(false)
    setSerializdEmail('')
    if (api) {
      await api.set('serializdToken', '')
      await api.set('serializdUser', null)
      await api.set('serializdSyncEnabled', false)
    }
  }

  const [updateStatus, setUpdateStatus] = useState<string | null>(null)
  const [torrents, setTorrents] = useState<any[]>([])
  const [magnetInput, setMagnetInput] = useState('')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [avatarOptions, setAvatarOptions] = useState<{ path: string; name: string }[]>([])
  const [avatarsLoading, setAvatarsLoading] = useState(false)

  async function refreshTorrents() {
    try {
      setTorrents(await listTorrents())
    } catch {
      setTorrents([])
    }
  }

  async function loadAvatars() {
    if (avatarOptions.length > 0) return
    setAvatarsLoading(true)
    try {
      const { tmdb } = await import('../api/tmdb')
      const opts = await tmdb.getCharacterAvatars()
      setAvatarOptions(opts)
    } catch {
      // ignore
    } finally {
      setAvatarsLoading(false)
    }
  }

  useEffect(() => {
    refreshTorrents()
    ;(window as any).electronAPI?.get('autoUpdate').then((v: unknown) => {
      if (typeof v === 'boolean') setAutoUpdate(v)
    })
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
          <Input label="OpenSubtitles API Key" value={subtitleKey} onChange={setSubtitleKey} placeholder="Optional — auto-downloads English subtitles in the player" link="https://opensubtitles.com" />

          {/* Serializd Section */}
          <div className="pt-4 border-t border-white/[0.06]">
            <h4 className="text-sm font-medium text-white/60 mb-3">Serializd (Watch History Sync)</h4>
            {store.serializdToken ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    {store.serializdUser?.avatar ? (
                      <img src={store.serializdUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <User className="w-4 h-4 text-white/40" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{store.serializdUser?.username || store.serializdEmail}</p>
                      <p className="text-xs text-white/40">{store.serializdUser?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      store.serializdSyncEnabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {store.serializdSyncEnabled ? 'Sync Enabled' : 'Sync Paused'}
                    </span>
                    <button
                      onClick={logoutSerializd}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      <LogOut className="w-4 h-4 inline" /> Logout
                    </button>
                  </div>
                </div>
                <Toggle
                  label="Sync watch history & ratings"
                  description="Automatically sync watched episodes and ratings to Serializd"
                  checked={store.serializdSyncEnabled}
                  onChange={store.setSerializdSyncEnabled}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Email"
                  value={serializdEmail}
                  onChange={setSerializdEmail}
                  placeholder="your@email.com"
                  type="email"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    value={serializdPassword}
                    onChange={setSerializdPassword}
                    placeholder="••••••••"
                    type={showSerializdPassword ? 'text' : 'password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSerializdPassword(!showSerializdPassword)}
                    className="absolute right-3 top-[38px] text-white/40 hover:text-white/60"
                  >
                    {showSerializdPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {serializdError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <X className="w-3 h-3" /> {serializdError}
                  </p>
                )}
                <button
                  onClick={loginSerializd}
                  disabled={serializdStatus === 'loading'}
                  className="w-full h-10 rounded-lg bg-[#FF1493]/10 border border-[#FF1493]/30 text-white font-medium text-sm hover:bg-[#FF1493]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {serializdStatus === 'loading' ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> Logging in...
                    </span>
                  ) : serializdStatus === 'success' ? (
                    <span className="flex items-center justify-center gap-2 text-green-400">
                      <Check className="w-4 h-4" /> Logged in!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Link className="w-4 h-4" /> Login to Serializd
                    </span>
                  )}
                </button>
                <p className="text-xs text-white/30 text-center">
                  Creates a local account that syncs your watch history and ratings to{' '}
                  <a href="https://serializd.com" target="_blank" rel="noopener noreferrer" className="text-[#FF1493] hover:underline">
                    Serializd.com
                  </a>
                </p>
              </div>
            )}
          </div>

          <Input label="AIOStreams URL" value={aiosUrl} onChange={setAiosUrl} placeholder="http://localhost:3000 (when ready)" />
          <Input label="Real-Debrid API" value={rdKey} onChange={setRdKey} placeholder="Real-Debrid token" link="https://realdebrid.com/apitoken" type="password" />
          <Input label="Trakt Token (optional)" value={traktTok} onChange={setTraktTok} placeholder="Not required — local lists used by default" type="password" />
          <Input label="Jellyfin Server" value={jellyfinUrl} onChange={setJellyfinUrl} placeholder="http://127.0.0.1:8096" />
          <Input label="Jellyfin API Key" value={jellyfinKey} onChange={setJellyfinKey} placeholder="Optional local media library key" type="password" />
        </Section>

        <Section title="Playback">
          <Toggle label="Auto-resume" description="Remember where you left off" checked={true} />
          <Toggle label="Auto-download subtitles" description="Find subtitles automatically" checked={true} />
        </Section>

        <Section title="Appearance">
          <div className="flex flex-wrap gap-2">
            {([
              ['pink', 'Pink'],
              ['cyan', 'Cyan'],
              ['emerald', 'Emerald'],
              ['amber', 'Amber'],
              ['pure', 'Mono'],
              ['violet', 'Violet'],
              ['purple', 'Purple'],
              ['blue', 'Blue'],
              ['rose', 'Rose'],
              ['red', 'Red'],
              ['orange', 'Orange'],
              ['lime', 'Lime'],
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
          <Toggle label="Auto-resume" description="Remember where you left off" checked={true} />
          <Toggle label="Autoplay next episode" description="For TV shows when available" checked={true} />
        </Section>

        <Section title="Profiles">
          <div className="flex gap-2 mb-2 flex-wrap">
            {profiles.map((pr) => (
              <div key={pr.id} className="flex items-center gap-1">
                <button
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
                <button
                  type="button"
                  title={`Delete ${pr.name}`}
                  onClick={() => store.removeProfile(pr.id)}
                  className="w-6 h-6 grid place-items-center rounded-md text-white/25 hover:text-red-400 hover:bg-white/[0.06] transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
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

          <div className="pt-2 border-t border-white/[0.05] mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-white/25">Avatar for {store.currentProfile?.name || 'current profile'}</p>
              {avatarOptions.length === 0 && !avatarsLoading && (
                <button onClick={loadAvatars} className="text-[10px] text-[#FF1493]/70 hover:text-[#FF1493] transition-colors">Load actors</button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/10 flex-shrink-0">
                <img src={store.currentProfile?.avatar || './icon.png'} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => store.currentProfile && store.setProfileAvatar(store.currentProfile.id, './icon.png')}
                className={cn(
                  'h-8 px-3 rounded-lg text-xs border transition-all',
                  !store.currentProfile?.avatar || store.currentProfile.avatar === './icon.png'
                    ? 'border-[#FF1493]/40 text-[#FF1493] bg-[#FF1493]/10'
                    : 'border-white/[0.06] text-white/40'
                )}
              >
                Default
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto pr-1">
              {avatarsLoading
                ? Array.from({ length: 16 }).map((_, i) => <div key={i} className="aspect-square rounded-full bg-white/[0.04] animate-pulse" />)
                : avatarOptions.map((o) => (
                    <button
                      key={o.path}
                      type="button"
                      title={o.name}
                      onClick={() => store.currentProfile && store.setProfileAvatar(store.currentProfile.id, `https://image.tmdb.org/t/p/w185${o.path}`)}
                      className={cn(
                        'aspect-square rounded-full overflow-hidden border-2 transition-all',
                        store.currentProfile?.avatar === `https://image.tmdb.org/t/p/w185${o.path}`
                          ? 'border-[#FF1493] shadow-[0_0_12px_rgba(255,20,147,0.35)]'
                          : 'border-transparent hover:border-white/25'
                      )}
                    >
                      <img src={`https://image.tmdb.org/t/p/w185${o.path}`} alt={o.name} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
            </div>
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
          <Toggle label="Notifications" description="Alert for new episodes" checked={true} />
          <Toggle
            label="Auto-update"
            description="Download new versions in the background automatically"
            checked={autoUpdate}
            onChange={(v) => {
              setAutoUpdate(v)
              ;(window as any).electronAPI?.set('autoUpdate', v)
            }}
          />
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

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-white/60">{label}</p>
        <p className="text-[10px] text-white/20 mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange?.(!checked)} className={`w-9 h-5 rounded-full transition-all relative ${checked ? 'bg-[#FF1493]' : 'bg-white/[0.08]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
