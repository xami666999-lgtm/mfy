import React, { useEffect, useState } from 'react';
import { Palette, Plus, Download, Trash2, Edit, Eye, RefreshCw, Paintbrush, Monitor, Gamepad2, Zap, Cloud, Layers } from 'lucide-react';
import { api } from '../../utils/api';
import { useThemeStore } from '../../stores/themeStore';
import type { Theme } from '../../types';

export function ThemesView() {
  const { currentTheme, themes, applyTheme, installTheme, createTheme, fetchMarketplace } = useThemeStore();
  const [marketplace, setMarketplace] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'editor'>('installed');
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    fetchMarketplace().then(setMarketplace);
  }, []);

  const handleCreateTheme = () => {
    const newTheme: Theme = {
      id: `custom-${Date.now()}`,
      name: 'New Theme',
      type: 'custom',
      author: 'You',
      version: '1.0.0',
      data: {
        colors: {
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          background: '#0f0f1a',
          surface: '#1a1a2e',
          surfaceHover: '#252542',
          border: '#2d2d4a',
          text: '#f1f1f5',
          textSecondary: '#a1a1b5',
          textMuted: '#6b6b8a',
          accent: '#f43f5e',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
        shadows: {
          sm: '0 1px 2px rgba(0,0,0,0.3)',
          md: '0 4px 6px rgba(0,0,0,0.4)',
          lg: '0 10px 15px rgba(0,0,0,0.5)',
          xl: '0 20px 25px rgba(0,0,0,0.6)',
        },
        fonts: {
          sans: '"Inter", "Segoe UI", system-ui, sans-serif',
          mono: '"JetBrains Mono", "Fira Code", monospace',
          display: '"Space Grotesk", "Inter", sans-serif',
        },
        transitions: { fast: '150ms ease', normal: '250ms ease', slow: '350ms ease' },
      },
    };
    setEditingTheme(newTheme);
    setActiveTab('editor');
  };

  return (
    <div className="themes-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Themes</h1>
          <span className="view-count">{themes.length} themes installed</span>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={handleCreateTheme}>
            <Plus size={16} /> Create Theme
          </button>
          <button className="btn btn-secondary" onClick={() => fetchMarketplace().then(setMarketplace)}>
            <RefreshCw size={16} /> Refresh Marketplace
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'installed' ? 'active' : ''}`} onClick={() => setActiveTab('installed')}>
          <Palette size={16} /> Installed
        </button>
<button className={`tab ${activeTab === 'marketplace' ? 'active' : ''}`} onClick={() => setActiveTab('marketplace')}>
          <Cloud size={16} /> Marketplace
        </button>
        <button className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>
          <Edit size={16} /> Editor
        </button>
      </div>

      {activeTab === 'installed' && (
        <div className="themes-grid">
          {themes.map(theme => (
            <ThemeCard key={theme.id} theme={theme} isActive={currentTheme === theme.id} onApply={() => applyTheme(theme.id)} onEdit={() => { setEditingTheme(theme); setActiveTab('editor'); }} onDelete={() => {}} onPreview={() => {}} />
          ))}
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="marketplace-grid">
          {marketplace.map(theme => (
            <MarketplaceThemeCard key={theme.id} theme={theme} onInstall={() => installTheme(theme)} />
          ))}
        </div>
      )}

      {activeTab === 'editor' && (
        <ThemeEditor theme={editingTheme} onSave={(theme) => { if (theme.id.startsWith('custom-')) createTheme(theme); else installTheme(theme); setEditingTheme(null); setActiveTab('installed'); }} onCancel={() => { setEditingTheme(null); setActiveTab('installed'); }} />
      )}
    </div>
  );
}

function ThemeCard({ theme, isActive, onApply, onEdit, onDelete, onPreview }: { theme: Theme; isActive: boolean; onApply: () => void; onEdit: () => void; onDelete: () => void; onPreview: () => void }) {
  return (
    <div className={`theme-card card ${isActive ? 'active' : ''}`}>
      <div className="theme-preview" style={{ background: theme.data.colors.primary }}>
        {isActive && <div className="active-badge"><Check size={20} /></div>}
      </div>
      <div className="theme-info">
        <div className="theme-header">
          <h3>{theme.name}</h3>
          <span className={`theme-type ${theme.type}`}>{theme.type}</span>
        </div>
        <p className="theme-author">by {theme.author} • v{theme.version}</p>
        <div className="theme-colors">
          {Object.entries(theme.data.colors).slice(0, 6).map(([key, value]) => (
            <div key={key} className="color-swatch" style={{ background: value }} title={key} />
          ))}
        </div>
      </div>
      <div className="theme-actions">
        {isActive ? (
          <button className="btn btn-secondary btn-sm" disabled><Check size={14} /> Active</button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onApply}><Check size={14} /> Apply</button>
        )}
        <button className="icon-btn" onClick={onPreview}><Eye size={16} /></button>
        <button className="icon-btn" onClick={onEdit}><Edit size={16} /></button>
        <button className="icon-btn" onClick={onDelete}><Trash2 size={16} /></button>
      </div>
    </div>
  );
}

function MarketplaceThemeCard({ theme, onInstall }: { theme: Theme; onInstall: () => void }) {
  return (
    <div className="marketplace-theme-card card">
      <div className="theme-preview-large" style={{ background: theme.data.colors.primary }} />
      <div className="theme-info">
        <h3>{theme.name}</h3>
        <p className="theme-author">by {theme.author}</p>
        <div className="theme-meta">
          <span className={`theme-type ${theme.type}`}>{theme.type}</span>
          <span>⭐ {theme.data.rating || '4.5'}</span>
        </div>
      </div>
      <button className="btn btn-primary" onClick={onInstall} style={{ width: '100%' }}>
        <Download size={16} /> Install
      </button>
    </div>
  );
}

function ThemeEditor({ theme, onSave, onCancel }: { theme: Theme | null; onSave: (theme: Theme) => void; onCancel: () => void }) {
  if (!theme) return <div className="empty-state"><h3>No theme selected</h3></div>;

  const [formData, setFormData] = useState(theme.data);

  const handleColorChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  return (
    <div className="theme-editor">
      <div className="editor-sidebar">
        <h3>Theme Properties</h3>
        <div className="form-group">
          <label>Name</label>
          <input type="text" className="form-input" value={theme.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Author</label>
          <input type="text" className="form-input" value={theme.author} onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Type</label>
          <select className="form-select" value={theme.type} onChange={e => setFormData(prev => ({ ...prev, type: e.target.value }))}>
            <option value="builtin">Built-in</option>
            <option value="retro">Retro</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Colors</h4>
        <div className="color-grid">
          {Object.entries(formData.colors).map(([key, value]) => (
            <div key={key} className="color-input-wrapper">
              <label>{key}</label>
              <input type="color" className="color-input" value={value} onChange={e => handleColorChange(key, e.target.value)} />
            </div>
          ))}
        </div>

        <h4 style={{ marginTop: 'var(--spacing-lg)' }}>Spacing & Radius</h4>
        <div className="form-row">
          <div className="form-group" style={{ flex: 1 }}>
            <label>Border Radius (md)</label>
            <input type="number" className="form-input" value={formData.borderRadius.md} onChange={e => setFormData(prev => ({ ...prev, borderRadius: { ...prev.borderRadius, md: parseInt(e.target.value) } }))} />
          </div>
        </div>
      </div>

      <div className="editor-preview">
        <div className="preview-header">
          <h3>Live Preview</h3>
          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={onCancel}><X size={16} /> Cancel</button>
            <button className="btn btn-primary" onClick={() => onSave({ ...theme, data: formData })}><Save size={16} /> Save Theme</button>
          </div>
        </div>
        <div className="preview-content" style={{ background: formData.colors.background }}>
          <div className="preview-card" style={{ background: formData.colors.surface, borderColor: formData.colors.border }}>
            <div className="preview-card-header" style={{ background: formData.colors.primary, color: 'white' }}>
              <h4>Preview Card</h4>
            </div>
            <div className="preview-card-body" style={{ color: formData.colors.text }}>
              <p style={{ color: formData.colors.textSecondary }}>This is a preview of your theme colors.</p>
              <div className="preview-buttons">
                <button className="btn btn-primary" style={{ background: formData.colors.primary }}>Primary</button>
                <button className="btn btn-secondary" style={{ background: formData.colors.surfaceHover, borderColor: formData.colors.border }}>Secondary</button>
                <button className="btn btn-danger" style={{ background: formData.colors.error }}>Danger</button>
              </div>
            </div>
          </div>
          <div className="preview-inputs" style={{ marginTop: 'var(--spacing-md)' }}>
            <input type="text" className="form-input" placeholder="Sample input" style={{ background: formData.colors.surface, borderColor: formData.colors.border, color: formData.colors.text }} />
            <select className="form-select" style={{ background: formData.colors.surface, borderColor: formData.colors.border, color: formData.colors.text }}>
              <option>Dropdown option</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Check, X, Cloud, Save } from 'lucide-react';
