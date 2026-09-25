import React, { useEffect, useState } from 'react';
import { Download, Pause, Play, Trash2, X, ChevronDown, MoreHorizontal, Loader2, Link2, ExternalLink } from 'lucide-react';
import { api } from '../../utils/api';
import type { Torrent, HydraSource } from '../../types';

export function DownloadsView() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [hydraSources, setHydraSources] = useState<HydraSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'torrents' | 'hydra' | 'direct'>('torrents');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [torrentsData, sourcesData] = await Promise.all([
        api.torrent.getTorrents(),
        api.torrent.getHydraSources(),
      ]);
      setTorrents(torrentsData || []);
      setHydraSources(sourcesData || []);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSpeed = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B/s`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatProgress = (progress: number) => `${progress.toFixed(1)}%`;

  return (
    <div className="downloads-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Downloads</h1>
          <span className="view-count">{torrents.length} active downloads</span>
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search downloads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="search-input" />
          </div>
          <button className="btn btn-primary"><Download size={16} /> Add Download</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'torrents' ? 'active' : ''}`} onClick={() => setActiveTab('torrents')}>Torrents</button>
        <button className={`tab ${activeTab === 'hydra' ? 'active' : ''}`} onClick={() => setActiveTab('hydra')}>Hydra Sources</button>
        <button className={`tab ${activeTab === 'direct' ? 'active' : ''}`} onClick={() => setActiveTab('direct')}>Direct Downloads</button>
      </div>

      {activeTab === 'torrents' && (
        <div className="torrents-list">
          {loading ? (
            <div className="flex-center"><Loader2 size={32} className="animate-spin" /></div>
          ) : torrents.length === 0 ? (
            <div className="empty-state">
              <Download size={64} />
              <h3>No active torrents</h3>
              <p>Add a magnet link or torrent file to start downloading</p>
            </div>
          ) : (
            torrents.map(torrent => (
              <TorrentItem key={torrent.hash} torrent={torrent} formatSpeed={formatSpeed} formatProgress={formatProgress} onUpdate={loadData} />
            ))
          )}
        </div>
      )}

      {activeTab === 'hydra' && (
        <div className="hydra-sources">
          {hydraSources.map(source => (
            <HydraSourceCard key={source.id} source={source} onSearch={(q) => { setActiveTab('hydra'); setSearchQuery(q); }} />
          ))}
        </div>
      )}

      {activeTab === 'direct' && (
        <div className="direct-downloads">
          <p>Direct download manager coming soon</p>
        </div>
      )}
    </div>
  );
}

function TorrentItem({ torrent, formatSpeed, formatProgress, onUpdate }: { torrent: Torrent; formatSpeed: (b: number) => string; formatProgress: (p: number) => string; onUpdate: () => void }) {
  const isActive = torrent.status === 'downloading' || torrent.status === 'seeding';

  return (
    <div className="torrent-item card">
      <div className="torrent-main">
        <div className="torrent-info">
          <h4>{torrent.name}</h4>
          <div className="torrent-meta">
            <span>{torrent.status}</span>
            <span>•</span>
            <span>{formatSpeed(torrent.downloadSpeed)} ↓ / {formatSpeed(torrent.uploadSpeed)} ↑</span>
            <span>•</span>
            <span>{torrent.peers} peers / {torrent.seeds} seeds</span>
          </div>
        </div>
        <div className="torrent-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${torrent.progress}%` }} />
          </div>
          <span className="progress-text">{formatProgress(torrent.progress)}</span>
        </div>
        <div className="torrent-actions">
          {torrent.status === 'downloading' ? (
            <button className="icon-btn" onClick={() => { api.torrent.pause(torrent.hash); onUpdate(); }}>
              <Pause size={16} />
            </button>
          ) : (
            <button className="icon-btn" onClick={() => { api.torrent.resume(torrent.hash); onUpdate(); }}>
              <Play size={16} />
            </button>
          )}
          <button className="icon-btn" onClick={() => { api.torrent.remove(torrent.hash); onUpdate(); }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function HydraSourceCard({ source, onSearch }: { source: HydraSource; onSearch: (q: string) => void }) {
  return (
    <div className="hydra-source-card card">
      <div className="source-header">
        <div>
          <h3>{source.name}</h3>
          <span className={`status-badge ${source.enabled ? 'enabled' : 'disabled'}`}>
            {source.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <button className="icon-btn"><MoreHorizontal size={16} /></button>
      </div>
      <div className="source-search">
        <Search size={18} />
        <input type="text" placeholder={`Search ${source.name}...`} onKeyDown={e => e.key === 'Enter' && onSearch(e.currentTarget.value)} />
      </div>
    </div>
  );
}

import { Search } from 'lucide-react';
