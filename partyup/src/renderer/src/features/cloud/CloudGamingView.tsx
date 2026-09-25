import React, { useEffect, useState } from 'react';
import { Cloud, Play, Monitor, Wifi, Settings, Download, RefreshCw, Link2, ExternalLink } from 'lucide-react';
import { api } from '../../utils/api';
import type { CloudGamingService } from '../../types';

export function CloudGamingView() {
  const [services, setServices] = useState<CloudGamingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await api.cloudGaming.getServices();
      setServices(data || []);
    } catch (error) {
      console.error('Failed to load cloud gaming services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cloud-gaming-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Cloud Gaming</h1>
          <span className="view-count">Unified streaming frontend</span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={loadServices}><RefreshCw size={16} /> Refresh</button>
        </div>
      </div>

      <div className="tabs">
        <button className="tab active">Streaming Services</button>
        <button className="tab">Self-Hosted</button>
        <button className="tab">Settings</button>
      </div>

      {loading ? (
        <div className="flex-center"><RefreshCw size={32} className="animate-spin" /></div>
      ) : (
        <div className="services-grid">
          {services.map(service => (
            <CloudServiceCard key={service.id} service={service} onLaunch={() => api.cloudGaming.launchService(service.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CloudServiceCard({ service, onLaunch }: { service: CloudGamingService; onLaunch: () => void }) {
  const typeIcons: Record<string, React.ComponentType<{ size?: number }>> = {
    'gamestream': Monitor,
    'gamestream-host': Wifi,
    'ps-remote-play': Gamepad2,
    'xcloud': Cloud,
    'web': Globe,
    'steam': Monitor,
    'streaming': Wifi,
  };
  const Icon = typeIcons[service.type] || Cloud;

  return (
    <div className={`cloud-service-card card ${!service.installed ? 'not-installed' : ''}`}>
      <div className="service-header">
        <div className="service-icon">
          <Icon size={32} />
        </div>
        <div>
          <h3>{service.name}</h3>
          <p className="service-type">{service.type.replace('-', ' ')}</p>
        </div>
      </div>
      <div className="service-status">
        <span className={`status-badge ${service.installed ? 'installed' : 'not-installed'}`}>
          {service.installed ? 'Ready' : 'Not Installed'}
        </span>
      </div>
      <div className="service-actions">
        {service.installed ? (
          <button className="btn btn-primary" onClick={onLaunch}>
            <Play size={16} /> Launch
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => { /* install */ }}>
            <Download size={16} /> Install
          </button>
        )}
        <button className="btn btn-secondary btn-sm"><Settings size={14} /> Config</button>
      </div>
    </div>
  );
}

import { Globe, Gamepad2 } from 'lucide-react';
