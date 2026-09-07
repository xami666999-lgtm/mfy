import * as React from 'react'
import { motion } from 'framer-motion'
import { 
  Music, Play, Heart, Plus, Loader2, ChevronRight, Filter, X, ListMusic, Shuffle,
  Settings as SettingsIcon, Palette, Bell, Keyboard, HardDrive, Download, Moon, Sun, Monitor,
  Volume2, Repeat, Zap, Info, AlertCircle, CheckCircle, ExternalLink
} from 'lucide-react'
import { useStore } from '../store'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card'
import { ScrollArea } from '../components/ui/ScrollArea'
import { Badge } from '../components/ui/Badge'
import { Slider } from '../components/ui/Slider'
import { Switch } from '../components/ui/Switch'
import { Select } from '../components/ui/Select'
import { cn } from '../components/ui/Button'

const settingsSections = [
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize how MFY Music looks',
  },
  {
    id: 'playback',
    title: 'Playback',
    icon: Play,
    description: 'Configure audio playback behavior',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Manage desktop notifications',
  },
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    icon: Keyboard,
    description: 'Keyboard shortcuts and media keys',
  },
  {
    id: 'storage',
    title: 'Storage & Cache',
    icon: HardDrive,
    description: 'Manage local storage and audio cache',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: SettingsIcon,
    description: 'Advanced settings and debug options',
  },
]

export const SettingsPage: React.FC = () => {
  const { settings, setSettings, theme, setTheme } = useStore()
  const [activeSection, setActiveSection] = React.useState('appearance')
  const [cacheStats, setCacheStats] = React.useState<{ count: number; totalSize: number } | null>(null)

  React.useEffect(() => {
    const loadCacheStats = async () => {
      try {
        const { databaseService } = await import('../services/database')
        const stats = await databaseService.getCacheStats()
        setCacheStats(stats)
      } catch (error) {
        console.error('Cache stats error:', error)
      }
    }
    loadCacheStats()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {(['dark', 'light', 'system'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all duration-200',
                        'hover:border-white/20',
                        theme === t
                          ? 'border-pink-500 bg-pink-500/10 shadow-glow-pink'
                          : 'border-white/10 bg-white/5'
                      )}
                    >
                      <div className="w-full h-20 rounded mb-3 flex items-center justify-center">
                        {t === 'dark' && <Moon className="w-8 h-8 text-pink-400" />}
                        {t === 'light' && <Sun className="w-8 h-8 text-yellow-400" />}
                        {t === 'system' && <Monitor className="w-8 h-8 text-cyan-400" />}
                      </div>
                      <p className="font-medium text-white capitalize">{t}</p>
                      <p className="text-sm text-white/40 mt-1">
                        {t === 'dark' ? 'Dark mode always' : t === 'light' ? 'Light mode always' : 'Follow system'}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mini Player</CardTitle>
                <CardDescription>Show compact player when window is minimized</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Mini Player</p>
                    <p className="text-sm text-white/50">Show floating player with controls</p>
                  </div>
                  <Switch
                    checked={settings.miniPlayerEnabled}
                    onChange={(e) => setSettings({ miniPlayerEnabled: e.target.checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start Behavior</CardTitle>
                <CardDescription>How MFY Music starts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Start minimized</p>
                      <p className="text-sm text-white/50">Start in system tray</p>
                    </div>
                    <Switch
                      checked={settings.startMinimized}
                      onChange={(e) => setSettings({ startMinimized: e.target.checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">Close to tray</p>
                      <p className="text-sm text-white/50">Minimize to tray on close</p>
                    </div>
                    <Switch
                      checked={settings.closeToTray}
                      onChange={(e) => setSettings({ closeToTray: e.target.checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'playback':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Crossfade</CardTitle>
                <CardDescription>Smooth transitions between tracks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Crossfade</p>
                    <p className="text-sm text-white/50">Overlap tracks for seamless playback</p>
                  </div>
                  <Switch
                    checked={settings.crossfadeEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setSettings({ crossfadeEnabled: checked })
                      const { audioEngine } = require('../services/audioEngine')
                      audioEngine.setCrossfade(checked, settings.crossfadeDuration)
                    }}
                  />
                </div>
                {settings.crossfadeEnabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Crossfade Duration</span>
                      <span className="text-white/50">{settings.crossfadeDuration}s</span>
                    </div>
                    <Slider
                      value={settings.crossfadeDuration}
                      onChange={(value) => {
                        setSettings({ crossfadeDuration: value })
                        const { audioEngine } = require('../services/audioEngine')
                        audioEngine.setCrossfade(true, value)
                      }}
                      min={1}
                      max={15}
                      step={1}
                    />
                    <p className="text-sm text-white/50 mt-1">Seconds to crossfade between tracks</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audio Quality</CardTitle>
                <CardDescription>Streaming quality preference</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings.audioQuality}
                  onChange={(e) => setSettings({ audioQuality: e.target.value as any })}
                  options={[
                    { value: 'low', label: 'Low (96 kbps)', description: 'Data saver' },
                    { value: 'medium', label: 'Medium (160 kbps)', description: 'Balanced' },
                    { value: 'high', label: 'High (320 kbps)', description: 'Best quality' },
                    { value: 'lossless', label: 'Lossless', description: 'Highest quality (when available)' },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Volume</CardTitle>
                <CardDescription>Volume level on startup</CardDescription>
              </CardHeader>
              <CardContent>
                <Slider
                  value={settings.volume}
                  onChange={(value) => {
                    setSettings({ volume: value })
                    const { audioEngine } = require('../services/audioEngine')
                    audioEngine.setVolume(value)
                  }}
                  min={0}
                  max={1}
                  step={0.05}
                />
                <div className="flex justify-between text-sm text-white/50 mt-2">
                  <span>Mute</span>
                  <span>Max</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repeat & Shuffle</CardTitle>
                <CardDescription>Default playback modes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Remember shuffle state</p>
                    <p className="text-sm text-white/50">Restore shuffle on restart</p>
                  </div>
                  <Switch
                    checked={settings.shuffle}
                    onChange={(e) => setSettings({ shuffle: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Remember repeat mode</p>
                    <p className="text-sm text-white/50">Restore repeat mode on restart</p>
                  </div>
                  <Switch
                    checked={settings.repeatMode !== 'off'}
                    onChange={(e) => setSettings({ repeatMode: e.target.checked ? 'all' : 'off' })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Notifications</CardTitle>
                <CardDescription>Show notifications when track changes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Notifications</p>
                    <p className="text-sm text-white/50">Show track info on song change</p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => setSettings({ notificationsEnabled: e.target.checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Show artwork in notifications</p>
                    <p className="text-sm text-white/50">Include album cover</p>
                  </div>
                  <Switch
                    checked={settings.notificationArtwork}
                    onChange={(e) => setSettings({ notificationArtwork: e.target.checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media Keys</CardTitle>
                <CardDescription>Global keyboard media controls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Media Keys</p>
                    <p className="text-sm text-white/50">Play/Pause, Next, Previous, Stop</p>
                  </div>
                  <Switch
                    checked={settings.mediaKeysEnabled}
                    onChange={(e) => setSettings({ mediaKeysEnabled: e.target.checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'shortcuts':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Shortcuts</CardTitle>
                <CardDescription>Global shortcuts (work anywhere)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { key: 'Space', action: 'Play / Pause' },
                    { key: '→', action: 'Next track' },
                    { key: '←', action: 'Previous track' },
                    { key: '↑', action: 'Volume up' },
                    { key: '↓', action: 'Volume down' },
                    { key: 'M', action: 'Mute / Unmute' },
                    { key: 'S', action: 'Toggle shuffle' },
                    { key: 'R', action: 'Toggle repeat' },
                    { key: 'Ctrl/Cmd + F', action: 'Focus search' },
                    { key: 'Ctrl/Cmd + L', action: 'Toggle lyrics' },
                    { key: 'Ctrl/Cmd + Q', action: 'Toggle queue' },
                  ].map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-sm font-mono text-white/70">{shortcut.key}</kbd>
                      <span className="text-white/60 ml-4">{shortcut.action}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'storage':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audio Cache</CardTitle>
                <CardDescription>Manage cached audio files for offline playback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-white/50">Cached Tracks</p>
                    <p className="text-2xl font-bold text-white">{cacheStats?.count || 0}</p>
                  </div>
                  <div className="glass rounded-lg p-4">
                    <p className="text-sm text-white/50">Cache Size</p>
                    <p className="text-2xl font-bold text-white">{formatBytes(cacheStats?.totalSize || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Caching</p>
                    <p className="text-sm text-white/50">Store played tracks locally</p>
                  </div>
                  <Switch
                    checked={settings.cacheEnabled}
                    onChange={(e) => setSettings({ cacheEnabled: e.target.checked })}
                  />
                </div>
                {settings.cacheEnabled && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white">Max Cache Size</span>
                      <span className="text-white/50">{settings.cacheMaxSize} GB</span>
                    </div>
                    <Slider
                      value={settings.cacheMaxSize}
                      onChange={(value) => setSettings({ cacheMaxSize: value })}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                )}
                <Button variant="secondary" onClick={async () => {
                  const { databaseService } = await import('../services/database')
                  await databaseService.cleanExpiredCache()
                  const stats = await databaseService.getCacheStats()
                  setCacheStats(stats)
                }}>
                  Clear Expired Cache
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Download Settings</CardTitle>
                <CardDescription>Configure download behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={settings.downloadQuality}
                  onChange={(e) => setSettings({ downloadQuality: e.target.value as any })}
                  options={[
                    { value: 'low', label: 'Low (96 kbps)' },
                    { value: 'medium', label: 'Medium (160 kbps)' },
                    { value: 'high', label: 'High (320 kbps)' },
                  ]}
                  placeholder="Download quality"
                />
                <div className="flex items-center gap-4">
                  <div className="flex-1 glass rounded-lg p-4">
                    <p className="text-sm text-white/50">Download Path</p>
                    <p className="text-sm text-white/70 truncate">{settings.downloadPath || 'Default (Music folder)'}</p>
                  </div>
                  <Button variant="secondary" onClick={async () => {
                    const path = await window.electronAPI.selectFolder()
                    if (path) setSettings({ downloadPath: path })
                  }}>
                    Choose Folder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stream Sources</CardTitle>
                <CardDescription>Configure Piped and YouTube Music instances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-white mb-2">Piped Instances</p>
                  <p className="text-sm text-white/50 mb-4">Comma-separated list of Piped API instances</p>
                  <textarea
                    value={settings.pipedInstance}
                    onChange={(e) => setSettings({ pipedInstance: e.target.value })}
                    className="input-base w-full h-24 resize-none font-mono text-sm"
                    placeholder="https://pipedapi.kavin.rocks, https://piped.mha.fi"
                  />
                </div>
                <div>
                  <p className="font-medium text-white mb-2">YouTube Music Instances</p>
                  <p className="text-sm text-white/50 mb-4">Comma-separated list of YTM API instances</p>
                  <textarea
                    value={settings.ytmInstance}
                    onChange={(e) => setSettings({ ytmInstance: e.target.value })}
                    className="input-base w-full h-24 resize-none font-mono text-sm"
                    placeholder="https://ytmusicapi.vercel.app"
                  />
                </div>
                <Button variant="secondary" onClick={async () => {
                  const { streamService } = await import('../services/stream')
                  const piped = settings.pipedInstance.split(',').map(s => s.trim()).filter(Boolean)
                  const ytm = settings.ytmInstance.split(',').map(s => s.trim()).filter(Boolean)
                  await streamService.setPipedInstances(piped)
                  await streamService.setYtmInstances(ytm)
                }}>
                  Save Instances
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lyrics</CardTitle>
                <CardDescription>Lyrics display settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Enable Lyrics</p>
                    <p className="text-sm text-white/50">Show lyrics panel when available</p>
                  </div>
                  <Switch
                    checked={settings.lyricsEnabled}
                    onChange={(e) => setSettings({ lyricsEnabled: e.target.checked })}
                  />
                </div>
                <Select
                  value={settings.lyricsSource}
                  onChange={(e) => setSettings({ lyricsSource: e.target.value as any })}
                  options={[
                    { value: 'auto', label: 'Auto', description: 'Best available source' },
                    { value: 'genius', label: 'Genius', description: 'Genius.com lyrics' },
                    { value: 'lrclib', label: 'LRCLIB', description: 'Synced lyrics' },
                    { value: 'musixmatch', label: 'Musixmatch', description: 'Musixmatch lyrics' },
                  ]}
                  placeholder="Lyrics source"
                />
              </CardContent>
            </Card>

            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <p className="font-medium text-white">Clear All Data</p>
                    <p className="text-sm text-white/50">Delete all playlists, history, favorites, and cache</p>
                  </div>
                  <Button variant="secondary" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => {
                    if (confirm('This will delete ALL your data. Are you sure?')) {
                      // Clear all data
                    }
                  }}>
                    Clear All
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 glass rounded-lg">
                  <div>
                    <p className="font-medium text-white">Reset Settings</p>
                    <p className="text-sm text-white/50">Restore all settings to defaults</p>
                  </div>
                  <Button variant="secondary" onClick={() => {
                    if (confirm('Reset all settings to defaults?')) {
                      // Reset settings
                    }
                  }}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-white/5">
        <h1 className="font-display font-bold text-3xl gradient-text">Settings</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-56 border-r border-white/5 bg-white/5 flex-shrink-0">
          <ScrollArea className="h-full p-4">
            <ul className="space-y-1" role="list">
              {settingsSections.map(section => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                      activeSection === section.id
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <section.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          <ScrollArea className="h-full max-w-3xl mx-auto">
            {renderSection()}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

export const Settings = SettingsPage