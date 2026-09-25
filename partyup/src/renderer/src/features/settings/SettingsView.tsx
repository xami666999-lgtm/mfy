import React, { useState } from 'react';
import { Settings, Save, RefreshCw, Palette, Plug, Cloud, Shield, Globe, Gamepad2, Download, Cpu, Database, Users, Bell, Key, Trash2 } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useThemeStore } from '../../stores/themeStore';
import { api } from '../../utils/api';

const settingsSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'steam', label: 'Steam', icon: Gamepad2 },
  { id: 'torrent', label: 'Downloads', icon: Download },
  { id: 'emulators', label: 'Emulation', icon: Cpu },
  { id: 'library', label: 'Library', icon: Database },
  { id: 'cloud', label: 'Cloud Gaming', icon: Cloud },
  { id: 'optimization', label: 'Optimization', icon: Zap },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'discord', label: 'Discord', icon: MessageCircle },
  { id: 'plugins', label: 'Plugins', icon: Plug },
  { id: 'advanced', label: 'Advanced', icon: Settings },
];

function Zap({ size }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}

function MessageCircle({ size }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
}

export function SettingsView() {
  const [activeSection, setActiveSection] = useState('general');
  const { currentTheme, applyTheme, fetchThemes, fetchMarketplace } = useThemeStore();

  return (
    <div className="settings-view">
      <div className="settings-header">
        <h1 className="view-title">Settings</h1>
        <p className="settings-subtitle">Configure PartyUp to your liking</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-sidebar" aria-label="Settings categories">
          <ul>
            {settingsSections.map(section => {
              const Icon = section.icon;
              return (
                <li key={section.id}>
                  <button
                    className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon size={20} />
                    <span>{section.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

<div className="settings-content">
          <section className="settings-section" aria-labelledby={`${activeSection}-title`}>
            <h2 id={`${activeSection}-title`} className="section-title">
              {(() => {
                const section = settingsSections.find(s => s.id === activeSection);
                const Icon = section?.icon;
                return <><Icon size={24} /> {section?.label}</>;
              })()}
            </h2>

            {activeSection === 'general' && <GeneralSettings />}
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'steam' && <SteamSettings />}
            {activeSection === 'torrent' && <TorrentSettings />}
            {activeSection === 'emulators' && <EmulatorSettings />}
            {activeSection === 'library' && <LibrarySettings />}
            {activeSection === 'cloud' && <CloudSettings />}
            {activeSection === 'optimization' && <OptimizationSettings />}
            {activeSection === 'social' && <SocialSettings />}
            {activeSection === 'discord' && <DiscordSettings />}
            {activeSection === 'plugins' && <PluginsSettings />}
            {activeSection === 'advanced' && <AdvancedSettings />}
          </section>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Application">
        <SettingRow label="Language" description="Application language">
          <select className="form-select">
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Japanese</option>
            <option>Chinese</option>
            <option>Russian</option>
          </select>
        </SettingRow>
        <SettingRow label="Start minimized" description="Start PartyUp minimized to system tray">
          <Toggle />
        </SettingRow>
        <SettingRow label="Minimize to tray" description="Minimize to system tray instead of taskbar">
          <Toggle />
        </SettingRow>
        <SettingRow label="Close to tray" description="Close button minimizes to tray instead of exiting">
          <Toggle />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Updates">
        <SettingRow label="Auto-check for updates" description="Automatically check for updates on startup">
          <Toggle />
        </SettingRow>
        <SettingRow label="Beta channel" description="Receive beta updates (may be unstable)">
          <Toggle />
        </SettingRow>
        <SettingRow label="Check now" description="Manually check for updates">
          <button className="btn btn-secondary"><RefreshCw size={16} /> Check for Updates</button>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Data">
        <SettingRow label="Export data" description="Export all settings and library data">
          <button className="btn btn-secondary"><Download size={16} /> Export</button>
        </SettingRow>
        <SettingRow label="Import data" description="Import settings from backup">
          <button className="btn btn-secondary"><Upload size={16} /> Import</button>
        </SettingRow>
        <SettingRow label="Reset all settings" description="Reset all settings to defaults">
          <button className="btn btn-danger"><Trash2 size={16} /> Reset</button>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function AppearanceSettings() {
  const { currentTheme, applyTheme, fetchThemes, fetchMarketplace } = useThemeStore();
  const [themes, setThemes] = useState<any[]>([]);

  return (
    <div className="settings-grid">
      <SettingGroup title="Theme">
        <SettingRow label="Current Theme" description="Select your preferred theme">
          <div className="theme-selector">
            {themes.map((theme: any) => (
              <button
                key={theme.id}
                className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => applyTheme(theme.id)}
                style={{ '--theme-primary': theme.data?.colors?.primary }}
              >
                <div className="theme-preview" style={{ background: theme.data?.colors?.primary }} />
                <span>{theme.name}</span>
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Browse marketplace" description="Discover community themes">
<button className="btn btn-primary" onClick={fetchMarketplace}><Cloud size={16} /> Browse Themes</button>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="UI Options">
        <SettingRow label="Compact mode" description="Reduce spacing for more content">
          <Toggle />
        </SettingRow>
        <SettingRow label="Animations" description="Enable UI animations and transitions">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Gamepad navigation" description="Enable full gamepad navigation in UI">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function SteamSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Steam Integration">
        <SettingRow label="Enable Steam" description="Enable Steam library integration">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Steam API Key" description="Optional: For enhanced features">
          <input type="password" className="form-input" placeholder="Enter API key" />
        </SettingRow>
        <SettingRow label="Auto-login" description="Automatically log in to Steam on startup">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Track playtime" description="Track playtime for Steam games">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Sync cloud saves" description="Backup Steam cloud saves locally">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Advanced Steam Features">
        <SettingRow label="DLC Unlocker" description="Manage DLC unlockers (CreamAPI, Goldberg, Steamless)">
          <button className="btn btn-secondary"><Key size={16} /> Manage DLC Unlockers</button>
        </SettingRow>
        <SettingRow label="Depot Downloader" description="Download specific Steam depots">
          <button className="btn btn-secondary"><Download size={16} /> Open Depot Downloader</button>
        </SettingRow>
        <SettingRow label="Workshop Downloader" description="Download Steam Workshop mods">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Controller Configs" description="Manage Steam Input configurations">
          <button className="btn btn-secondary"><Gamepad2 size={16} /> Controller Configs</button>
        </SettingRow>
        <SettingRow label="Achievement Notifier" description="Custom achievement notifications (SAN-style)">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function TorrentSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Torrent Client">
        <SettingRow label="Enable torrent client" description="Enable built-in libtorrent client">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Download folder" description="Default folder for torrent downloads">
          <div className="form-row">
            <input type="text" className="form-input" placeholder="C:\Downloads" style={{ flex: 1 }} />
            <button className="btn btn-secondary"><FolderOpen size={16} /></button>
          </div>
        </SettingRow>
        <SettingRow label="Max connections" description="Maximum peer connections">
          <input type="number" className="form-input" style={{ width: 100 }} defaultValue={100} />
        </SettingRow>
        <SettingRow label="Max download speed" description="Limit download speed (0 = unlimited)">
          <input type="number" className="form-input" style={{ width: 100 }} placeholder="0" />
          <span className="input-suffix">KB/s</span>
        </SettingRow>
        <SettingRow label="Max upload speed" description="Limit upload speed (0 = unlimited)">
          <input type="number" className="form-input" style={{ width: 100 }} placeholder="0" />
          <span className="input-suffix">KB/s</span>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Hydra Sources">
        <SettingRow label="Enabled sources" description="Select which Hydra sources to use">
          <div className="source-list">
            {['hydra-official', 'fitgirl', 'dodi', 'gog-revived', 'online-fix', 'steamrip'].map(src => (
              <label key={src} className="source-item">
                <input type="checkbox" defaultChecked />
                <span>{src}</span>
              </label>
            ))}
          </div>
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="ARIA2">
        <SettingRow label="Enable ARIA2" description="Use ARIA2 for direct downloads">
          <Toggle />
        </SettingRow>
        <SettingRow label="ARIA2 RPC URL" description="ARIA2 JSON-RPC endpoint">
          <input type="text" className="form-input" placeholder="http://localhost:6800/jsonrpc" />
        </SettingRow>
        <SettingRow label="ARIA2 Secret" description="ARIA2 RPC secret token">
          <input type="password" className="form-input" placeholder="Secret token" />
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function EmulatorSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Emulator Paths">
        <p className="setting-hint">Configure paths for each emulator. Leave empty to auto-detect.</p>
        {['dolphin', 'rpcs3', 'pcsx2', 'cemu', 'ryujinx', 'ppsspp', 'duckstation', 'retroarch'].map(emu => (
          <SettingRow key={emu} label={emu.toUpperCase()} description="Path to emulator executable">
            <div className="form-row">
              <input type="text" className="form-input" placeholder="Auto-detect" style={{ flex: 1 }} />
              <button className="btn btn-secondary"><FolderOpen size={16} /></button>
            </div>
          </SettingRow>
        ))}
      </SettingGroup>

      <SettingGroup title="RetroArch">
        <SettingRow label="RetroArch path" description="Path to RetroArch executable">
          <div className="form-row">
            <input type="text" className="form-input" placeholder="Auto-detect" style={{ flex: 1 }} />
            <button className="btn btn-secondary"><FolderOpen size={16} /></button>
          </div>
        </SettingRow>
        <SettingRow label="Core directory" description="Directory for Libretro cores">
          <div className="form-row">
            <input type="text" className="form-input" placeholder="Auto-detect" style={{ flex: 1 }} />
            <button className="btn btn-secondary"><FolderOpen size={16} /></button>
          </div>
        </SettingRow>
        <SettingRow label="Auto-update cores" description="Automatically update Libretro cores">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="ROM Paths">
        <p className="setting-hint">Add folders to scan for ROMs</p>
        <div className="rom-paths">
          <div className="rom-path-item">
            <input type="text" className="form-input" placeholder="C:\ROMs\N64" style={{ flex: 1 }} />
            <button className="btn btn-secondary"><FolderOpen size={16} /></button>
            <button className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
          </div>
          <button className="btn btn-secondary btn-sm"><Plus size={14} /> Add ROM Path</button>
        </div>
      </SettingGroup>
    </div>
  );
}

function LibrarySettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Library Folders">
        <p className="setting-hint">Add folders to scan for games</p>
        <div className="library-paths">
          <div className="library-path-item">
            <input type="text" className="form-input" placeholder="C:\Games" style={{ flex: 1 }} />
            <button className="btn btn-secondary"><FolderOpen size={16} /></button>
            <button className="btn btn-danger btn-sm"><Trash2 size={14} /></button>
          </div>
          <button className="btn btn-secondary btn-sm"><Plus size={14} /> Add Library Folder</button>
        </div>
      </SettingGroup>

      <SettingGroup title="Scanning">
        <SettingRow label="Auto-scan on startup" description="Automatically scan library folders on startup">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Scan interval" description="How often to rescan (hours)">
          <input type="number" className="form-input" style={{ width: 80 }} defaultValue={24} />
        </SettingRow>
        <SettingRow label="Scan portable apps" description="Detect portable game executables">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Metadata">
        <SettingRow label="Primary metadata source" description="Preferred source for game metadata">
          <select className="form-select">
            <option>IGDB (Twitch)</option>
            <option>Steam Web API</option>
            <option>RAWG</option>
            <option>MobyGames</option>
          </select>
        </SettingRow>
        <SettingRow label="Fallback sources" description="Sources to try if primary fails">
          <div className="source-tags">
            {['SteamGridDB', 'LaunchBoxDB', 'TheGamesDB', 'MobyGames', 'PCGamingWiki'].map(s => (
              <span key={s} className="source-tag">{s}</span>
            ))}
          </div>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function CloudSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Cloud Gaming Services">
        {['moonlight', 'sunshine', 'chiaki', 'greenlight', 'geforce-now', 'steam-link', 'parsec'].map(svc => (
          <SettingRow key={svc} label={svc.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} description="Cloud gaming service">
            <div className="form-row">
              <Toggle />
              <button className="btn btn-secondary btn-sm"><Settings size={14} /> Config</button>
            </div>
          </SettingRow>
        ))}
      </SettingGroup>

      <SettingGroup title="Streaming">
        <SettingRow label="Default quality" description="Default streaming quality">
          <select className="form-select">
            <option>1080p 60fps</option>
            <option>1080p 120fps</option>
            <option>4K 60fps</option>
            <option>Auto</option>
          </select>
        </SettingRow>
        <SettingRow label="Bitrate limit" description="Maximum bitrate (Mbps)">
          <input type="number" className="form-input" style={{ width: 80 }} defaultValue={50} />
        </SettingRow>
        <SettingRow label="Hardware encoding" description="Use GPU hardware encoding">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function OptimizationSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Optimization Tools">
        {['special-k', 'lossless-scaling', 'optiscaler', 'magpie', 'reshade', 'dlss-swapper', 'vibrancegui'].map(tool => (
          <SettingRow key={tool} label={tool.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} description="Game optimization tool">
            <div className="form-row">
              <Toggle />
              <button className="btn btn-secondary btn-sm"><Settings size={14} /> Config</button>
            </div>
          </SettingRow>
        ))}
      </SettingGroup>

      <SettingGroup title="Auto-Optimization">
        <SettingRow label="Auto-apply profiles" description="Automatically apply optimization profiles when launching games">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Preferred upscaler" description="Default upscaler for auto-optimization">
          <select className="form-select">
            <option>Auto (best available)</option>
            <option>DLSS</option>
            <option>FSR</option>
            <option>XeSS</option>
            <option>NIS</option>
          </select>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function SocialSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Social Features">
        <SettingRow label="Enable social features" description="Enable friends, activity feed, and reviews">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Platform connections" description="Connected platforms">
          <div className="platform-connections">
            {['steam', 'epic', 'gog', 'xbox', 'psn'].map(p => (
              <label key={p} className="platform-connection">
                <input type="checkbox" />
                <span>{p.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Show activity" description="Show your activity to friends">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Show rich presence" description="Show detailed game info in profile">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function DiscordSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Discord Integration">
        <SettingRow label="Enable Discord" description="Enable Discord Rich Presence">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Show game details" description="Show game name, state, and timestamps">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Show party info" description="Show party size and join options">
          <Toggle />
        </SettingRow>
        <SettingRow label="Show timestamps" description="Show elapsed/remaining time">
          <Toggle defaultChecked />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Discord Bot">
        <SettingRow label="Bot token" description="Discord bot token for notifications">
          <input type="password" className="form-input" placeholder="Bot token" />
        </SettingRow>
        <SettingRow label="Channel ID" description="Channel for achievement notifications">
          <input type="text" className="form-input" placeholder="Channel ID" />
        </SettingRow>
        <SettingRow label="Test notification" description="Send a test notification to Discord">
          <button className="btn btn-secondary"><Send size={16} /> Test</button>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function PluginsSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Plugin Manager">
        <SettingRow label="Enable plugins" description="Enable plugin system">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Marketplace" description="Allow browsing and installing plugins from marketplace">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Auto-update plugins" description="Automatically update installed plugins">
          <Toggle />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Installed Plugins">
        <p className="setting-hint">Manage your installed plugins</p>
        <div className="plugin-list">
          <div className="plugin-item">
            <div>
              <strong>Steam Enhanced</strong>
              <span>v1.0.0 • Official</span>
            </div>
            <Toggle defaultChecked />
          </div>
          <div className="plugin-item">
            <div>
              <strong>Discord Rich Presence</strong>
              <span>v1.0.0 • Official</span>
            </div>
            <Toggle defaultChecked />
          </div>
        </div>
      </SettingGroup>
    </div>
  );
}

function AdvancedSettings() {
  return (
    <div className="settings-grid">
      <SettingGroup title="Performance">
        <SettingRow label="Hardware acceleration" description="Use GPU acceleration for UI">
          <Toggle defaultChecked />
        </SettingRow>
        <SettingRow label="Enable DevTools" description="Enable developer tools (F12)">
          <Toggle />
        </SettingRow>
        <SettingRow label="Log level" description="Logging verbosity">
          <select className="form-select">
            <option>Error</option>
            <option>Warn</option>
            <option>Info</option>
            <option>Debug</option>
          </select>
        </SettingRow>
        <SettingRow label="Custom Electron args" description="Additional Electron command line arguments">
          <input type="text" className="form-input" placeholder="--disable-gpu-sandbox --enable-features=..." />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Experimental">
        <SettingRow label="Enable experimental features" description="Enable features under development">
          <Toggle />
        </SettingRow>
      </SettingGroup>

      <SettingGroup title="Debug">
        <SettingRow label="Open log folder" description="Open the application log folder">
          <button className="btn btn-secondary"><FolderOpen size={16} /> Open Logs</button>
        </SettingRow>
        <SettingRow label="Clear cache" description="Clear application cache and temporary files">
          <button className="btn btn-danger"><Trash2 size={16} /> Clear Cache</button>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

// Helper components
function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="setting-group">
      <h3 className="setting-group-title">{title}</h3>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="setting-row">
      <div className="setting-label">
        <label>{label}</label>
        {description && <span className="setting-description">{description}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
      <span className="toggle-slider"></span>
    </label>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="form-row">{children}</div>;
}

import { FolderOpen, Upload, Cloud, Plus } from 'lucide-react';
