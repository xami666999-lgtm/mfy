import React, { useEffect, useState } from 'react';
import { Cpu, Play, Search, Download, RefreshCw, Settings, ChevronRight, Grid, List, Monitor, Gamepad2 } from 'lucide-react';
import { api } from '../../utils/api';
import type { Emulator, Rom, RomSource } from '../../types';

export function EmulationView() {
  const [emulators, setEmulators] = useState<Emulator[]>([]);
  const [roms, setRoms] = useState<Rom[]>([]);
  const [sources, setSources] = useState<RomSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'emulators' | 'roms' | 'sources'>('emulators');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emulatorsData, romsData, sourcesData] = await Promise.all([
        api.emulator.getEmulators(),
        api.emulator.getRoms(),
        api.metadata.getRomSources(),
      ]);
      setEmulators(emulatorsData || []);
      setRoms(romsData || []);
      setSources(sourcesData || []);
    } catch (error) {
      console.error('Failed to load emulation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const systems = ['all', ...new Set(emulators.flatMap(e => e.systems))];

  const filteredRoms = roms.filter(rom =>
    (selectedSystem === 'all' || rom.system === selectedSystem)
  );

  return (
    <div className="emulation-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Emulation</h1>
          <span className="view-count">{roms.length} ROMs • {emulators.filter(e => e.installed).length} emulators installed</span>
        </div>
        <div className="header-right">
          <button className="btn btn-secondary" onClick={loadData}><RefreshCw size={16} /> Refresh</button>
          <button className="btn btn-primary"><Download size={16} /> Download ROMs</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'emulators' ? 'active' : ''}`} onClick={() => setActiveTab('emulators')}>
          <Cpu size={16} /> Emulators
        </button>
        <button className={`tab ${activeTab === 'roms' ? 'active' : ''}`} onClick={() => setActiveTab('roms')}>
          <Database size={16} /> ROM Library
        </button>
        <button className={`tab ${activeTab === 'sources' ? 'active' : ''}`} onClick={() => setActiveTab('sources')}>
          <Globe size={16} /> ROM Sources
        </button>
      </div>

      {activeTab === 'emulators' && (
        <div className="emulators-grid">
          {emulators.map(emu => (
            <EmulatorCard key={emu.id} emulator={emu} onLaunch={(rom) => api.emulator.launchRom(emu.id, rom)} />
          ))}
        </div>
      )}

      {activeTab === 'roms' && (
        <div className="roms-view">
          <div className="roms-toolbar">
            <div className="system-filter">
              {systems.map(sys => (
                <button
                  key={sys}
                  className={`filter-btn ${selectedSystem === sys ? 'active' : ''}`}
                  onClick={() => setSelectedSystem(sys)}
                >
                  {sys.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="view-toggle">
              <button className="icon-btn" aria-label="Grid"><Grid size={18} /></button>
              <button className="icon-btn" aria-label="List"><List size={18} /></button>
            </div>
          </div>
          <div className={`roms-grid ${true ? 'grid' : 'list'}`}>
            {filteredRoms.map(rom => (
              <RomCard key={rom.id} rom={rom} onLaunch={(e) => api.emulator.launchRom(rom.emulatorId || '', rom.path)} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="sources-grid">
          {sources.map(src => (
            <RomSourceCard key={src.id} source={src} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmulatorCard({ emulator, onLaunch }: { emulator: Emulator; onLaunch: (rom: string) => void }) {
  return (
    <div className="emulator-card card">
      <div className="emulator-header">
        <div className="emulator-icon">
          <Cpu size={32} />
        </div>
        <div>
          <h3>{emulator.name}</h3>
          <p className="emulator-systems">{emulator.systems.join(', ')}</p>
        </div>
      </div>
      <div className="emulator-status">
        <span className={`status-badge ${emulator.installed ? 'installed' : 'not-installed'}`}>
          {emulator.installed ? 'Installed' : 'Not Installed'}
        </span>
      </div>
      <div className="emulator-actions">
        {emulator.installed && (
          <button className="btn btn-secondary btn-sm"><Play size={14} /> Launch</button>
        )}
        <button className="btn btn-secondary btn-sm"><Settings size={14} /> Config</button>
        {!emulator.installed && (
          <button className="btn btn-primary btn-sm"><Download size={14} /> Install</button>
        )}
      </div>
    </div>
  );
}

function RomCard({ rom, onLaunch }: { rom: Rom; onLaunch: () => void }) {
  return (
    <div className="rom-card card">
      {rom.cover && <img src={rom.cover} alt={rom.name} className="rom-cover" />}
      <div className="rom-info">
        <h4>{rom.name}</h4>
        <div className="rom-meta">
          <span className="rom-system">{rom.system}</span>
          {rom.core && <span className="rom-core">{rom.core}</span>}
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onLaunch}><Play size={14} /></button>
    </div>
  );
}

function RomSourceCard({ source }: { source: RomSource }) {
  return (
    <div className="rom-source-card card">
      <h3>{source.name}</h3>
      <p className="source-systems">Systems: {source.systems.join(', ')}</p>
      <a href={source.url} target="_blank" rel="noopener" className="btn btn-primary btn-sm">
        <ExternalLink size={14} /> Visit
      </a>
    </div>
  );
}

import { Database, Globe, ExternalLink } from 'lucide-react';
