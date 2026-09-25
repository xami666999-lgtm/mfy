import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { MainContent } from './components/Layout/MainContent';
import { GameGrid } from './features/library/GameGrid';
import { GameDetail } from './features/library/GameDetail';
import { LibraryView } from './features/library/LibraryView';
import { DownloadsView } from './features/downloads/DownloadsView';
import { EmulationView } from './features/emulation/EmulationView';
import { ModsView } from './features/mods/ModsView';
import { MultiplayerView } from './features/multiplayer/MultiplayerView';
import { CloudGamingView } from './features/cloud/CloudGamingView';
import { OptimizationView } from './features/optimization/OptimizationView';
import { AchievementsView } from './features/achievements/AchievementsView';
import { SavesView } from './features/saves/SavesView';
import { SocialView } from './features/social/SocialView';
import { SettingsView } from './features/settings/SettingsView';
import { PluginsView } from './features/plugins/PluginsView';
import { ThemesView } from './features/themes/ThemesView';
import { HoardSyncView } from './features/hoardSync/HoardSyncView';
import { useAppStore } from './stores/appStore';
import { useThemeStore } from './stores/themeStore';
import { SidebarNavItem } from './types/navigation';

const NAV_ITEMS: SidebarNavItem[] = [
  { id: 'library', label: 'Library', icon: 'gamepad-2', path: '/library' },
  { id: 'downloads', label: 'Downloads', icon: 'download', path: '/downloads' },
  { id: 'emulation', label: 'Emulation', icon: 'cpu', path: '/emulation' },
  { id: 'mods', label: 'Mods', icon: 'puzzle', path: '/mods' },
  { id: 'multiplayer', label: 'Multiplayer', icon: 'users', path: '/multiplayer' },
  { id: 'cloud', label: 'Cloud Gaming', icon: 'cloud', path: '/cloud' },
  { id: 'optimization', label: 'Optimization', icon: 'sliders-horizontal', path: '/optimization' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy', path: '/achievements' },
  { id: 'saves', label: 'Saves', icon: 'database', path: '/saves' },
  { id: 'hoard-sync', label: 'Save Sync', icon: 'database', path: '/hoard-sync' },
  { id: 'social', label: 'Social', icon: 'message-circle', path: '/social' },
  { id: 'plugins', label: 'Plugins', icon: 'plug', path: '/plugins' },
  { id: 'themes', label: 'Themes', icon: 'palette', path: '/themes' },
  { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
];

export function App() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { currentTheme, applyTheme } = useThemeStore();

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  useEffect(() => {
    if (window.electron) {
      window.electron.ipc.on('theme:apply', (_event: any, themeData: any) => {
        const root = document.documentElement;
        const colors = themeData.colors;
        Object.entries(colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value as string);
        });
      });
    }
  }, []);

  return (
    <div className="app" data-theme={currentTheme}>
      <Header onToggleSidebar={toggleSidebar} />
      <div className="app-body">
        <Sidebar
          collapsed={sidebarCollapsed}
          items={NAV_ITEMS}
        />
        <MainContent>
          <Routes>
            <Route path="/library" element={<LibraryView />} />
            <Route path="/library/:view" element={<LibraryView />} />
            <Route path="/library/game/:id" element={<GameDetail />} />
            <Route path="/downloads" element={<DownloadsView />} />
            <Route path="/emulation" element={<EmulationView />} />
            <Route path="/mods" element={<ModsView />} />
            <Route path="/multiplayer" element={<MultiplayerView />} />
            <Route path="/cloud" element={<CloudGamingView />} />
            <Route path="/optimization" element={<OptimizationView />} />
            <Route path="/achievements" element={<AchievementsView />} />
<Route path="/saves" element={<SavesView />} />
            <Route path="/hoard-sync" element={<HoardSyncView />} />
            <Route path="/social" element={<SocialView />} />
            <Route path="/plugins" element={<PluginsView />} />
            <Route path="/themes" element={<ThemesView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/" element={<Navigate to="/library" replace />} />
            <Route path="*" element={<Navigate to="/library" replace />} />
          </Routes>
        </MainContent>
      </div>
    </div>
  );
}

export default App;
