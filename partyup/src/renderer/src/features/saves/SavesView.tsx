import React, { useEffect, useState } from 'react';
import { Database, Download, Upload, RefreshCw, Settings, Trash2, RotateCcw, Copy, AlertTriangle } from 'lucide-react';
import { api } from '../../utils/api';
import type { SaveFile } from '../../types';

export function SavesView() {
  const [saves, setSaves] = useState<SaveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('');

  useEffect(() => {
    loadSaves();
  }, [selectedGame]);

  const loadSaves = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const data = await api.saves.get(selectedGame);
      setSaves(data || []);
    } catch (error) {
      console.error('Failed to load saves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async (save: SaveFile) => {
    await api.saves.backup(selectedGame, save.id);
    loadSaves();
  };

  const handleRestore = async (save: SaveFile) => {
    if (save.backupId) {
      await api.saves.restore(selectedGame, save.backupId);
      loadSaves();
    }
  };

  return (
    <div className="saves-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Save Manager</h1>
          <span className="view-count">{saves.length} save files</span>
        </div>
        <div className="header-right">
          <label className="toggle-switch">
            <input type="checkbox" checked={autoBackup} onChange={e => { setAutoBackup(e.target.checked); api.saves.setAutoBackup(e.target.checked); }} />
            <span className="toggle-slider"></span>
            Auto-backup
          </label>
          <button className="btn btn-secondary" onClick={loadSaves}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Local Saves</button>
        <button className="tab">Backups</button>
        <button className="tab">Cloud Sync</button>
        <button className="tab">Convert</button>
      </div>

      {loading ? (
        <div className="flex-center"><RefreshCw size={32} className="animate-spin" /></div>
      ) : saves.length === 0 ? (
        <div className="empty-state">
          <Database size={64} />
          <h3>No saves found</h3>
          <p>Play a game to generate save files</p>
        </div>
      ) : (
        <div className="saves-list">
          {saves.map(save => (
            <SaveItem key={save.id} save={save} onBackup={() => handleBackup(save)} onRestore={() => handleRestore(save)} />
          ))}
        </div>
      )}
    </div>
  );
}

function SaveItem({ save, onBackup, onRestore }: { save: SaveFile; onBackup: () => void; onRestore: () => void }) {
  return (
    <div className="save-item card">
      <div className="save-info">
        <div className="save-icon">
          <Database size={24} />
        </div>
        <div>
          <h4>{save.name}</h4>
          <p className="save-meta">
            {save.platform} • {save.size ? `${(save.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
            {save.modifiedAt && ` • Modified ${new Date(save.modifiedAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>
      <div className="save-status">
        {save.backedUp ? (
          <span className="status-badge success">Backed up</span>
        ) : (
          <span className="status-badge warning">Not backed up</span>
        )}
      </div>
      <div className="save-actions">
        {!save.backedUp && <button className="btn btn-primary btn-sm" onClick={onBackup}><Download size={14} /> Backup</button>}
        {save.backedUp && <button className="btn btn-secondary btn-sm" onClick={onRestore}><RotateCcw size={14} /> Restore</button>}
        <button className="btn btn-secondary btn-sm"><Copy size={14} /> Copy Path</button>
        {save.backupId && <button className="btn btn-danger btn-sm"><Trash2 size={14} /> Delete Backup</button>}
      </div>
    </div>
  );
}
