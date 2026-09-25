import React, { useEffect, useState } from 'react';
import { Plug, Plus, Download, Settings, Trash2, RefreshCw, Search, ExternalLink, Check } from 'lucide-react';
import { api } from '../../utils/api';
import type { Plugin } from '../../types';

export function PluginsView() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [marketplace, setMarketplace] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pluginsData, marketplaceData] = await Promise.all([
        api.plugins.get(),
        api.plugins.getMarketplace(),
      ]);
      setPlugins(pluginsData || []);
      setMarketplace(marketplaceData || []);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = async (plugin: Plugin) => {
    if (plugin.enabled) {
      await api.plugins.disable(plugin.id);
    } else {
      await api.plugins.enable(plugin.id);
    }
    loadData();
  };

  const installPlugin = async (plugin: Plugin) => {
    await api.plugins.install(plugin.id);
    loadData();
  };

  return (
    <div className="plugins-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Plugins</h1>
          <span className="view-count">{plugins.filter(p => p.enabled).length} / {plugins.length} enabled</span>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'installed' ? 'active' : ''}`} onClick={() => setActiveTab('installed')}>
          <Plug size={16} /> Installed
        </button>
        <button className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('marketplace')}>
          <Plus size={16} /> Marketplace
        </button>
      </div>

      {activeTab === 'installed' ? (
        <div className="plugins-list">
          {plugins.map(plugin => (
            <PluginItem key={plugin.id} plugin={plugin} onToggle={() => togglePlugin(plugin)} onConfigure={() => {}} onRemove={() => {}} />
          ))}
        </div>
      ) : (
        <div className="marketplace-grid">
          {marketplace.map(plugin => (
            <MarketplacePluginCard key={plugin.id} plugin={plugin} onInstall={() => installPlugin(plugin)} />
          ))}
        </div>
      )}
    </div>
  );
}

function PluginItem({ plugin, onToggle, onConfigure, onRemove }: { plugin: Plugin; onToggle: () => void; onConfigure: () => void; onRemove: () => void }) {
  return (
    <div className={`plugin-item card ${!plugin.enabled ? 'disabled' : ''}`}>
      <div className="plugin-info">
        <div className="plugin-icon">
          <Plug size={24} />
        </div>
        <div>
          <h4>{plugin.name}</h4>
          <p className="plugin-meta">v{plugin.version} • {plugin.author} • {plugin.category}</p>
          <p className="plugin-description">{plugin.description}</p>
        </div>
      </div>
      <div className="plugin-stats">
        <span>⭐ {plugin.rating}</span>
        <span>{plugin.downloads.toLocaleString()} downloads</span>
      </div>
      <div className="plugin-actions">
        <label className="toggle-switch">
          <input type="checkbox" checked={plugin.enabled} onChange={onToggle} />
          <span className="toggle-slider"></span>
        </label>
        <button className="icon-btn" onClick={onConfigure}><Settings size={16} /></button>
        <button className="icon-btn" onClick={onRemove}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function MarketplacePluginCard({ plugin, onInstall }: { plugin: Plugin; onInstall: () => void }) {
  return (
    <div className="marketplace-plugin-card card">
      <div className="plugin-header">
        <Plug size={32} />
        <div>
          <h3>{plugin.name}</h3>
          <p className="plugin-meta">v{plugin.version} • {plugin.author}</p>
        </div>
      </div>
      <p className="plugin-description">{plugin.description}</p>
      <div className="plugin-tags">
        {plugin.category && <span className="tag">{plugin.category}</span>}
      </div>
      <div className="plugin-stats">
        <span>⭐ {plugin.rating}</span>
        <span>{plugin.downloads.toLocaleString()} downloads</span>
      </div>
      <button className="btn btn-primary" onClick={onInstall} style={{ width: '100%' }}>
        <Download size={16} /> Install
      </button>
    </div>
  );
}
