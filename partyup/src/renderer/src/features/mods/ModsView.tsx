import React, { useEffect, useState } from 'react';
import { Puzzle, Plus, Search, Download, RefreshCw, Settings, ChevronRight, Grid, List, Link2, ExternalLink } from 'lucide-react';
import { api } from '../../utils/api';
import type { Mod, ModSource } from '../../types';

export function ModsView() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [sources, setSources] = useState<ModSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sourcesData, gamesData] = await Promise.all([
        api.mods.getSources(),
        api.library.getGames(),
      ]);
      setSources(sourcesData || []);
      setGames(gamesData || []);
      if (gamesData?.[0]) setSelectedGame(gamesData[0].id);
    } catch (error) {
      console.error('Failed to load mods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGame) loadMods();
  }, [selectedGame]);

  const loadMods = async () => {
    try {
      const data = await api.mods.getMods(selectedGame);
      setMods(data || []);
    } catch (error) {
      console.error('Failed to load mods:', error);
    }
  };

  return (
    <div className="mods-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Mods</h1>
          <span className="view-count">{mods.length} mods for {games.find(g => g.id === selectedGame)?.name || 'selected game'}</span>
        </div>
        <div className="header-right">
          <select value={selectedGame} onChange={e => setSelectedGame(e.target.value)} className="game-select">
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <button className="btn btn-primary"><Plus size={16} /> Install Mod</button>
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Installed Mods</button>
        <button className="tab">Browse Mods</button>
        <button className="tab">Mod Sources</button>
        <button className="tab">Modlists (Wabbajack)</button>
      </div>

      <div className="mods-toolbar">
        <div className="search-wrapper">
          <Search size={18} />
          <input type="text" placeholder="Search mods..." className="search-input" />
        </div>
        <div className="sort-options">
          <select className="sort-select">
            <option>Load Order</option>
            <option>Name</option>
            <option>Author</option>
            <option>Updated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-center"><RefreshCw size={32} className="animate-spin" /></div>
      ) : (
        <div className="mods-list">
          {mods.map(mod => (
            <ModItem key={mod.id} mod={mod} onToggle={() => api.mods.enableMod(selectedGame, mod.id)} onConfigure={() => {}} onRemove={() => api.mods.uninstallMod(selectedGame, mod.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModItem({ mod, onToggle, onConfigure, onRemove }: { mod: Mod; onToggle: () => void; onConfigure: () => void; onRemove: () => void }) {
  return (
    <div className={`mod-item card ${!mod.enabled ? 'disabled' : ''}`}>
      <label className="flex-center">
        <input type="checkbox" checked={mod.enabled} onChange={onToggle} />
      </label>
      <div className="mod-info">
        <h4>{mod.name}</h4>
        <div className="mod-meta">
          <span className="mod-source">{mod.sourceId}</span>
          {mod.version && <span>v{mod.version}</span>}
        </div>
      </div>
      <div className="mod-actions">
        <button className="icon-btn" onClick={onConfigure} aria-label="Configure"><Settings size={16} /></button>
        <button className="icon-btn" onClick={onRemove} aria-label="Remove"><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

import { Trash2 } from 'lucide-react';
