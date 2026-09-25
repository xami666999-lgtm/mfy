import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Play, Download, Settings, Zap, Cpu, Monitor, Eye, Palette, Plus, Trash2, Edit } from 'lucide-react';
import { api } from '../../utils/api';
import type { OptimizationProfile, OptimizationTool } from '../../types';

export function OptimizationView() {
  const [profiles, setProfiles] = useState<OptimizationProfile[]>([]);
  const [tools, setTools] = useState<OptimizationTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profiles' | 'tools' | 'auto'>('profiles');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profilesData, toolsData] = await Promise.all([
        api.optimization.getProfiles(),
        api.optimization.getTools(),
      ]);
      setProfiles(profilesData || []);
      setTools(toolsData || []);
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyProfile = async (gameId: string, profileId: string) => {
    await api.optimization.applyProfile(gameId, profileId);
  };

  const handleAutoOptimize = async (gameId: string) => {
    await api.optimization.autoOptimize(gameId);
  };

  return (
    <div className="optimization-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Optimization</h1>
          <span className="view-count">Per-game performance profiles</span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary"><Zap size={16} /> Auto-Optimize Current Game</button>
          <button className="btn btn-primary"><Plus size={16} /> Create Profile</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
          <SlidersHorizontal size={16} /> Profiles
        </button>
        <button className={`tab ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>
          <Settings size={16} /> Tools
        </button>
        <button className={`tab ${activeTab === 'auto' ? 'active' : ''}`} onClick={() => setActiveTab('auto')}>
          <Zap size={16} /> Auto-Optimize
        </button>
      </div>

      {activeTab === 'profiles' && (
        <div className="profiles-grid">
          {profiles.map(profile => (
            <ProfileCard key={profile.id} profile={profile} onEdit={() => {}} onDelete={() => {}} onApply={(gameId) => handleApplyProfile(gameId, profile.id)} />
          ))}
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="tools-grid">
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool} onInstall={() => api.optimization.installTool(tool.id)} />
          ))}
        </div>
      )}

      {activeTab === 'auto' && (
        <div className="auto-optimize-view">
          <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
            <div className="card-header"><h2>Auto-Optimize Game</h2></div>
            <div className="card-body">
              <p>Select a game to automatically detect and apply the best optimization settings.</p>
              <div className="form-group">
                <label>Select Game</label>
                <select className="form-select">
                  <option>Detect running game...</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" /> Apply upscaling (FSR/DLSS/XeSS)
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" /> Enable frame generation
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" /> Low latency mode
                </label>
              </div>
              <div className="card-footer">
                <button className="btn btn-primary" onClick={() => handleAutoOptimize('')}>
                  <Zap size={16} /> Optimize Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileCard({ profile, onEdit, onDelete, onApply }: { profile: OptimizationProfile; onEdit: () => void; onDelete: () => void; onApply: (gameId: string) => void }) {
  return (
    <div className="profile-card card">
      <div className="profile-header">
        <h3>{profile.name}</h3>
        <span className="profile-games">{profile.games.length} games</span>
      </div>
      <p className="profile-description">{profile.description || 'No description'}</p>
      <div className="profile-settings">
        {Object.entries(profile.settings).slice(0, 4).map(([key, value]) => (
          <span key={key} className="setting-tag">{key}: {String(value)}</span>
        ))}
      </div>
      <div className="profile-actions">
        <button className="btn btn-secondary btn-sm" onClick={onApply}><Play size={14} /> Apply</button>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}><Edit size={14} /></button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

function ToolCard({ tool, onInstall }: { tool: OptimizationTool; onInstall: () => void }) {
  const statusColor = tool.installed ? 'success' : tool.paid ? 'warning' : 'info';

  return (
    <div className="tool-card card">
      <div className="tool-header">
        <h3>{tool.name}</h3>
        <span className={`status-badge ${tool.installed ? 'installed' : 'not-installed'}`}>
          {tool.installed ? 'Installed' : tool.paid ? 'Paid' : 'Free'}
        </span>
      </div>
      <p className="tool-type">{tool.type}</p>
      <div className="tool-features">
        {tool.features.slice(0, 3).map(f => <span key={f} className="feature-tag">{f}</span>)}
      </div>
      <div className="tool-actions">
        {tool.installed ? (
          <button className="btn btn-secondary btn-sm"><Settings size={14} /> Configure</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onInstall}>
            <Download size={14} /> Install
          </button>
        )}
      </div>
    </div>
  );
}
