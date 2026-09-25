import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Download, RotateCcw, Trash2, BarChart, Shield, Zap, Settings, AlertTriangle, Info } from 'lucide-react';
import { api } from '../../utils/api';
import type { SaveSnapshot } from '../../../types';

export function HoardSyncView() {
  const [snapshots, setSnapshots] = useState<SaveSnapshot[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [games, setGames] = useState<any[]>([]);
  const [backupPath, setBackupPath] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gamesData, statsData] = await Promise.all([
        api.library.getGames(),
        api.hoardSync.getStorageStats(),
      ]);
      setGames(gamesData || []);
      setStats(statsData);
      if (gamesData?.[0]) setSelectedGame(gamesData[0].id);
    } catch (error) {
      console.error('Failed to load Hoard sync data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGame) loadSnapshots();
  }, [selectedGame]);

  const loadSnapshots = async () => {
    try {
      const data = await api.hoardSync.getSnapshots(selectedGame);
      setSnapshots(data || []);
    } catch (error) {
      console.error('Failed to load snapshots:', error);
    }
  };

  const handleBackup = async () => {
    const game = games.find(g => g.id === selectedGame);
    if (!game || !game.path) return;

    try {
      const snapshot = await api.hoardSync.backupGame(game.id, game.name, game.path);
      await loadSnapshots();
      await loadData();
      alert(`Backup created: ${snapshot.id}`);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Backup failed');
    }
  };

  const handleRestore = async (snapshot: SaveSnapshot) => {
    const game = games.find(g => g.id === selectedGame);
    if (!game || !game.path) return;

    if (!confirm(`Restore ${snapshot.files.length} files from ${new Date(snapshot.timestamp).toLocaleString()}?`)) return;

    try {
      await api.hoardSync.restoreSnapshot(snapshot.id, game.path);
      alert('Restore complete');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Restore failed');
    }
  };

  const handleDelete = async (snapshotId: string) => {
    if (!confirm('Delete this snapshot?')) return;
    try {
      // API call would go here
      await loadSnapshots();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100%' }}><div className="skeleton" style={{ width: 200, height: 200 }} /></div>;
  }

  return (
    <div className="hoard-sync-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">
            <Database size={24} className="inline" />
            PartyUp Save Sync (Hoard-style)
          </h1>
          <span className="view-subtitle">
            Versioned, deduplicated, verified game save backups — inspired by Hoard
          </span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      <div className="hoard-sync-grid">
        <div className="stats-panel">
          <div className="stat-cards">
            <div className="stat-card">
              <Shield size={24} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{formatBytes(stats?.totalSize || 0)}</span>
                <span className="stat-label">Total Backed Up</span>
              </div>
            </div>
            <div className="stat-card">
              <Zap size={24} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats?.totalSnapshots || 0}</span>
                <span className="stat-label">Total Snapshots</span>
              </div>
            </div>
            <div className="stat-card">
              <Database size={24} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{stats?.uniqueBlobs || 0}</span>
                <span className="stat-label">Unique Blobs</span>
              </div>
            </div>
            <div className="stat-card">
              <BarChart size={24} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{formatBytes(stats?.deduplicatedSize || 0)}</span>
                <span className="stat-label">Deduplicated Size</span>
              </div>
            </div>
          </div>

          <div className="game-selector">
            <label className="form-label">Select Game</label>
            <select
              className="form-select"
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
            >
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.platform})</option>
              ))}
            </select>
          </div>

          <div className="action-buttons">
            <button 
              className="btn btn-primary" 
              onClick={handleBackup}
              disabled={!selectedGame}
            >
              <Download size={16} /> Create Backup
            </button>
          </div>
        </div>

        <div className="snapshots-panel">
          <div className="panel-header">
            <h2>Snapshots for {games.find(g => g.id === selectedGame)?.name}</h2>
            <span className="snapshot-count">{snapshots.length} versions</span>
          </div>

          {snapshots.length === 0 ? (
            <div className="empty-state">
              <Database size={64} />
              <h3>No snapshots yet</h3>
              <p>Create your first backup to start versioning your saves</p>
            </div>
          ) : (
            <div className="snapshots-list">
              {snapshots.map(snapshot => (
                <SnapshotCard
                  key={snapshot.id}
                  snapshot={snapshot}
                  onRestore={handleRestore}
                  onDelete={handleDelete}
                  formatBytes={formatBytes}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hoard-info-panel">
        <div className="info-card">
          <Info size={20} />
          <div>
            <h3>How PartyUp Save Sync Works (Hoard-inspired)</h3>
            <ul>
              <li><strong>Versioned:</strong> Every backup = new snapshot. Roll back to any previous version.</li>
              <li><strong>Verified:</strong> Every file SHA256-hashed on backup, re-verified on restore.</li>
              <li><strong>Deduplicated:</strong> Content-hash deduplication - unchanged files shared across snapshots.</li>
              <li><strong>Compact:</strong> 10 versions of a 2GB save cost ~2GB, not 20GB.</li>
              <li><strong>Auto-detect:</strong> Finds saves via Steam, Epic, GOG, Xbox, emulators, registry.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotCard({ 
  snapshot, 
  onRestore, 
  onDelete, 
  formatBytes, 
  formatDate 
}: { 
  snapshot: SaveSnapshot; 
  onRestore: (s: SaveSnapshot) => void;
  onDelete: (id: string) => void;
  formatBytes: (b: number) => string;
  formatDate: (d: string) => string;
}) {
  return (
    <div className="snapshot-card card">
      <div className="snapshot-header">
        <div className="snapshot-date">
          <Calendar size={16} />
          <span>{formatDate(snapshot.timestamp)}</span>
        </div>
        <div className="snapshot-size">
          <Database size={16} />
          <span>{formatBytes(snapshot.totalSize)} ({snapshot.files.length} files)</span>
        </div>
      </div>
      <div className="snapshot-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => onRestore(snapshot)}>
          <RotateCcw size={14} /> Restore
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(snapshot.id)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

import { Calendar } from 'lucide-react';