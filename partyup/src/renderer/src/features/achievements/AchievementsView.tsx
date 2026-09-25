import React, { useEffect, useState } from 'react';
import { Trophy, Award, Star, Target, Filter, Search, Download, RefreshCw, Globe, Gamepad2 } from 'lucide-react';
import { api } from '../../utils/api';
import type { Achievement } from '../../types';

export function AchievementsView() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'rare'>('all');
  const [platform, setPlatform] = useState<'steam' | 'retroachievements' | 'gog' | 'epic' | 'xbox' | 'psn'>('steam');
  const [selectedGame, setSelectedGame] = useState<string>('');

  useEffect(() => {
    loadAchievements();
  }, [selectedGame, platform]);

  const loadAchievements = async () => {
    if (!selectedGame) return;
    setLoading(true);
    try {
      const data = await api.achievements.get(selectedGame, platform);
      setAchievements(data || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    if (filter === 'rare') return a.rarity && a.rarity < 10;
    return true;
  });

  return (
    <div className="achievements-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Achievements</h1>
          <span className="view-count">{achievements.filter(a => a.unlocked).length} / {achievements.length} unlocked</span>
        </div>
        <div className="header-right">
          <select value={platform} onChange={e => setPlatform(e.target.value as any)} className="platform-select">
            <option value="steam">Steam</option>
            <option value="retroachievements">RetroAchievements</option>
            <option value="gog">GOG</option>
            <option value="epic">Epic Games</option>
            <option value="xbox">Xbox</option>
            <option value="psn">PlayStation</option>
          </select>
        </div>
      </div>

      <div className="achievements-toolbar">
        <div className="filter-buttons">
          {(['all', 'unlocked', 'locked', 'rare'] as const).map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-wrapper">
          <Search size={18} />
          <input type="text" placeholder="Search achievements..." className="search-input" />
        </div>
      </div>

      {loading ? (
        <div className="flex-center"><RefreshCw size={32} className="animate-spin" /></div>
      ) : (
        <div className="achievements-grid">
          {filteredAchievements.map(ach => (
            <AchievementCard key={ach.id} achievement={ach} />
          ))}
        </div>
      )}

      {achievements.length === 0 && !loading && (
        <div className="empty-state">
          <Trophy size={64} />
          <h3>No achievements</h3>
          <p>Select a game to view achievements</p>
        </div>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
      <div className="achievement-icon-wrapper">
        <img src={achievement.icon} alt={achievement.name} className="achievement-icon" />
        {achievement.unlocked && <div className="unlocked-badge"><Star size={16} /></div>}
        {achievement.rarity && achievement.rarity < 10 && <div className="rare-badge"><Target size={14} /></div>}
      </div>
      <div className="achievement-info">
        <h4>{achievement.name}</h4>
        <p>{achievement.description}</p>
        <div className="achievement-meta">
          {achievement.rarity && <span className="rarity">Rarity: {achievement.rarity.toFixed(1)}%</span>}
          {achievement.unlockedAt && <span className="unlocked-date">Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  );
}
