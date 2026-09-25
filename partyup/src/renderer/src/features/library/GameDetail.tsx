import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Clock, Heart, Tag, Share2, MoreHorizontal, ChevronRight, ArrowLeft, Edit, Trash2, Download, Settings, Monitor, Gamepad2, Trophy, Database, Cloud } from 'lucide-react';
import { api } from '../../utils/api';
import type { Game } from '../../types';

export function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'mods' | 'saves' | 'stats'>('overview');

  useEffect(() => {
    if (id) loadGame();
  }, [id]);

  const loadGame = async () => {
    try {
      const games = await api.library.getGames();
      const found = games?.find(g => g.id === id);
      if (found) setGame(found);
    } catch (error) {
      console.error('Failed to load game:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = async () => {
    if (game?.platform === 'steam' && game.customFields?.appId) {
      await api.steam.launchGame(game.customFields.appId);
    } else if (game?.path) {
      // Launch via system
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}><div className="skeleton" style={{ width: 200, height: 200 }} /></div>;
  if (!game) return <div className="empty-state"><h3>Game not found</h3></div>;

  return (
    <div className="game-detail">
      <div className="detail-header">
        <button className="icon-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={20} />
        </button>
        <div className="detail-hero">
          {game.background && <img src={game.background} alt="" className="hero-bg" />}
          <div className="hero-overlay">
            <div className="hero-content">
              {game.cover && <img src={game.cover} alt={game.name} className="hero-cover" />}
              <div className="hero-info">
                <h1>{game.name}</h1>
                <div className="hero-meta">
                  <span className="game-platform">{game.platform}</span>
                  {game.playtime && <span><Clock size={14} /> {Math.round(game.playtime / 60)}h played</span>}
                  {game.lastPlayed && <span><Clock size={14} /> Last played {new Date(game.lastPlayed).toLocaleDateString()}</span>}
                </div>
                <div className="hero-actions">
                  <button className="btn btn-primary btn-lg" onClick={handleLaunch}>
                    <Play size={20} /> Play
                  </button>
                  <button className="btn btn-secondary">
                    <Heart size={16} /> {game.favorite ? 'Favorited' : 'Favorite'}
                  </button>
                  <button className="btn btn-secondary">
                    <Share2 size={16} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        <nav className="tabs" role="tablist">
          <button role="tab" className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button role="tab" className={`tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
            <Trophy size={16} /> Achievements
          </button>
          <button role="tab" className={`tab ${activeTab === 'mods' ? 'active' : ''}`} onClick={() => setActiveTab('mods')}>
            <Puzzle size={16} /> Mods
          </button>
          <button role="tab" className={`tab ${activeTab === 'saves' ? 'active' : ''}`} onClick={() => setActiveTab('saves')}>
            <Database size={16} /> Saves
          </button>
          <button role="tab" className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <BarChart size={16} /> Stats
          </button>
        </nav>

        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab game={game} />}
          {activeTab === 'achievements' && <AchievementsTab game={game} />}
          {activeTab === 'mods' && <ModsTab game={game} />}
          {activeTab === 'saves' && <SavesTab game={game} />}
          {activeTab === 'stats' && <StatsTab game={game} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ game }: { game: Game }) {
  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="overview-main">
          <section className="section">
            <h2>About</h2>
            <p>{game.metadata?.description || 'No description available.'}</p>
          </section>

          <section className="section">
            <h2>Details</h2>
            <dl className="details-list">
              <div><dt>Platform</dt><dd>{game.platform}</dd></div>
              <div><dt>Release Date</dt><dd>{game.metadata?.releaseDate || 'Unknown'}</dd></div>
              <div><dt>Developer</dt><dd>{game.metadata?.developer || 'Unknown'}</dd></div>
              <div><dt>Publisher</dt><dd>{game.metadata?.publisher || 'Unknown'}</dd></div>
              <div><dt>Genres</dt><dd>{game.metadata?.genres?.join(', ') || 'Unknown'}</dd></div>
              <div><dt>Players</dt><dd>{game.metadata?.players || 'Unknown'}</dd></div>
            </dl>
          </section>

          {game.tags?.length && (
            <section className="section">
              <h2>Tags</h2>
              <div className="tags">
                {game.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            </section>
          )}
        </div>

        <div className="overview-sidebar">
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="action-list">
                <button className="action-item" onClick={() => {}}>
                  <Monitor size={18} /> Play on Cloud
                </button>
                <button className="action-item">
                  <Gamepad2 size={18} /> Controller Config
                </button>
                <button className="action-item">
                  <Trophy size={18} /> View Achievements
                </button>
                <button className="action-item">
                  <Database size={18} /> Manage Saves
                </button>
                <button className="action-item">
                  <Cloud size={18} /> Sync Cloud Saves
                </button>
                <button className="action-item">
                  <Settings size={18} /> Game Settings
                </button>
                <button className="action-item">
                  <Download size={18} /> Download DLC/Mods
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="card-header">
              <h3>Links</h3>
            </div>
            <div className="card-body">
              <div className="action-list">
                <a href="#" className="action-item" target="_blank" rel="noopener">
                  <Globe size={18} /> Store Page
                </a>
                <a href="#" className="action-item" target="_blank" rel="noopener">
                  <MessageCircle size={18} /> Community Hub
                </a>
                <a href="#" className="action-item" target="_blank" rel="noopener">
                  <BookOpen size={18} /> Wiki/Guide
                </a>
                <a href="#" className="action-item" target="_blank" rel="noopener">
                  <Youtube size={18} /> Videos
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AchievementsTab({ game }: { game: Game }) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (game.platform === 'steam' && game.customFields?.appId) {
      loadAchievements();
    }
  }, [game]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      const data = await api.steam.getAchievements(game.customFields.appId);
      setAchievements(data || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ padding: 'var(--spacing-xl)' }}><div className="skeleton" style={{ width: 200, height: 200 }} /></div>;

  return (
    <div className="achievements-tab">
      <div className="achievements-stats">
        <div className="stat">
          <span className="stat-value">{achievements.filter(a => a.unlocked).length}</span>
          <span className="stat-label">Unlocked</span>
        </div>
        <div className="stat">
          <span className="stat-value">{achievements.length}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat">
          <span className="stat-value">{achievements.length > 0 ? Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100) : 0}%</span>
          <span className="stat-label">Completion</span>
        </div>
      </div>
      <div className="achievements-grid">
        {achievements.map(ach => (
          <div key={ach.id} className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`}>
            <img src={ach.icon} alt={ach.name} className="achievement-icon" />
            <div className="achievement-info">
              <h4>{ach.name}</h4>
              <p>{ach.description}</p>
              {ach.rarity && <span className="rarity">Rarity: {ach.rarity.toFixed(1)}%</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModsTab({ game }: { game: Game }) {
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMods();
  }, [game.id]);

  const loadMods = async () => {
    setLoading(true);
    try {
      const data = await api.mods.getMods(game.id);
      setMods(data || []);
    } catch (error) {
      console.error('Failed to load mods:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mods-tab">
      <div className="tab-header">
        <h2>Mods</h2>
        <button className="btn btn-primary"><Plus size={16} /> Add Mod</button>
      </div>
      {loading ? (
        <div className="flex-center"><div className="skeleton" style={{ width: 200, height: 200 }} /></div>
      ) : (
        <div className="mods-list">
          {mods.map(mod => (
            <div key={mod.id} className="mod-item">
              <label className="flex-center">
                <input type="checkbox" checked={mod.enabled} onChange={() => {}} />
              </label>
              <div className="mod-info">
                <h4>{mod.name}</h4>
                <span className="mod-source">{mod.sourceId}</span>
              </div>
              <span className="mod-version">{mod.version}</span>
              <button className="icon-btn"><MoreHorizontal size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SavesTab({ game }: { game: Game }) {
  return (
    <div className="saves-tab">
      <div className="tab-header">
        <h2>Save Files</h2>
        <button className="btn btn-secondary"><Download size={16} /> Backup All</button>
      </div>
      <div className="empty-state">
        <Database size={64} />
        <h3>No saves found</h3>
        <p>Play the game to generate save files</p>
      </div>
    </div>
  );
}

function StatsTab({ game }: { game: Game }) {
  return (
    <div className="stats-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Playtime</h3>
          <p className="stat-value">{game.playtime ? `${Math.round(game.playtime / 60)}h` : '0h'}</p>
        </div>
        <div className="stat-card">
          <h3>Sessions</h3>
          <p className="stat-value">0</p>
        </div>
        <div className="stat-card">
          <h3>Avg Session</h3>
          <p className="stat-value">0min</p>
        </div>
        <div className="stat-card">
          <h3>First Played</h3>
          <p className="stat-value">{game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>
      <div className="chart-placeholder">
        <p>Playtime chart coming soon</p>
      </div>
    </div>
  );
}

import { Puzzle, BarChart, Globe, MessageCircle, BookOpen, Youtube, Cloud, Download, Settings, Plus } from 'lucide-react';
