import React, { useEffect, useState } from 'react';
import { Users, Play, Download, Server, RefreshCw, Search, Wifi, Monitor, Gamepad2 } from 'lucide-react';
import { api } from '../../utils/api';
import type { MultiplayerClient } from '../../types';

export function MultiplayerView() {
  const [clients, setClients] = useState<MultiplayerClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'clients' | 'servers' | 'lan'>('clients');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await api.multiplayer.getClients();
      setClients(data || []);
    } catch (error) {
      console.error('Failed to load multiplayer clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchClient = async (client: MultiplayerClient) => {
    await api.multiplayer.launchClient(client.id);
  };

  return (
    <div className="multiplayer-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Multiplayer</h1>
          <span className="view-count">{clients.filter(c => c.installed).length} clients installed</span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={loadClients}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
          <Gamepad2 size={16} /> Game Clients
        </button>
        <button className={`tab ${activeTab === 'servers' ? 'active' : ''}`} onClick={() => setActiveTab('servers')}>
          <Server size={16} /> Server Browser
        </button>
        <button className={`tab ${activeTab === 'lan' ? 'active' : ''}`} onClick={() => setActiveTab('lan')}>
          <Wifi size={16} /> LAN / VPN
        </button>
      </div>

      {activeTab === 'clients' && (
        <div className="clients-grid">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onLaunch={handleLaunchClient} />
          ))}
        </div>
      )}

      {activeTab === 'servers' && (
        <div className="servers-view">
          <p>Server browser coming soon</p>
        </div>
      )}

      {activeTab === 'lan' && (
        <div className="lan-view">
          <p>LAN/VPN tools coming soon (ZeroTier, Radmin, Playit.gg)</p>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onLaunch }: { client: MultiplayerClient; onLaunch: (client: MultiplayerClient) => void }) {
  return (
    <div className={`client-card card ${!client.installed ? 'not-installed' : ''}`}>
      <div className="client-header">
        <div className="client-icon">
          <Gamepad2 size={32} />
        </div>
        <div>
          <h3>{client.name}</h3>
          <p className="client-games">Supports: {client.games.join(', ')}</p>
        </div>
      </div>
      <div className="client-status">
        <span className={`status-badge ${client.installed ? 'installed' : 'not-installed'}`}>
          {client.installed ? 'Installed' : 'Not Installed'}
        </span>
      </div>
      <div className="client-actions">
        {client.installed ? (
          <button className="btn btn-primary" onClick={() => onLaunch(client)}>
            <Play size={16} /> Launch
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => { api.multiplayer.installClient(client.id); }}>
            <Download size={16} /> Install
          </button>
        )}
        <button className="btn btn-secondary btn-sm"><Server size={14} /> Servers</button>
      </div>
    </div>
  );
}
