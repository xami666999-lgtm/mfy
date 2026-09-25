import React, { useEffect, useState } from 'react';
import { Grid, List, Layout, Filter, Search, Plus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { api } from '../../utils/api';
import type { Game, GameView } from '../../types';
import { GameGrid } from './GameGrid';

interface LibraryViewProps {}

export function LibraryView() {
  const { activeView, setActiveView, searchQuery, setSearchQuery, selectedGameIds, toggleGameSelection, clearSelection } = useAppStore();
  const [games, setGames] = useState<Game[]>([]);
  const [views, setViews] = useState<GameView[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showViewMenu, setShowViewMenu] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gamesData, viewsData, statsData] = await Promise.all([
        api.library.getGames(),
        api.library.getViews(),
        api.library.getStats(),
      ]);
      setGames(gamesData || []);
      setViews(viewsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load library:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLaunchGame = async (game: Game) => {
    if (game.platform === 'steam' && game.customFields?.appId) {
      await api.steam.launchGame(game.customFields.appId);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100%' }}>
        <div className="skeleton" style={{ width: 200, height: 200 }} />
      </div>
    );
  }

  return (
    <div className="library-view">
      <div className="view-header">
        <div className="header-left">
          <h1 className="view-title">Library</h1>
          {stats && (
            <span className="view-count">{stats.totalGames} games • {Math.round(stats.totalPlaytime / 60)}h played</span>
          )}
        </div>
        <div className="header-right">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="view-controls">
            <button
              className={`icon-btn ${activeView === 'grid' ? 'active' : ''}`}
              onClick={() => setActiveView('grid')}
              aria-label="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              className={`icon-btn ${activeView === 'list' ? 'active' : ''}`}
              onClick={() => setActiveView('list')}
              aria-label="List view"
            >
              <List size={20} />
            </button>
            <div className="dropdown">
              <button className="icon-btn" onClick={() => setShowViewMenu(!showViewMenu)} aria-label="View options">
                <MoreHorizontal size={20} />
              </button>
              {showViewMenu && (
                <div className="dropdown-menu">
                  {views.map(view => (
                    <button key={view.id} className="dropdown-item" onClick={() => setActiveView(view.id)}>
                      {view.name}
                    </button>
                  ))}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => setActiveView('grid')}>
                    <Plus size={14} /> Create Custom View
                  </button>
                </div>
              )}
            </div>
            <button className="btn btn-primary">
              <Plus size={16} /> Add Game
            </button>
          </div>
        </div>
      </div>

      <GameGrid
        games={filteredGames}
        onLaunch={handleLaunchGame}
        selectedIds={selectedGameIds}
        onSelect={toggleGameSelection}
        view={activeView}
      />

      {filteredGames.length === 0 && !loading && (
        <div className="empty-state">
          <Gamepad2 size={64} className="empty-icon" />
          <h3>No games found</h3>
          <p>{searchQuery ? 'Try adjusting your search' : 'Add games to your library to get started'}</p>
          <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
            <Plus size={16} /> Add Game
          </button>
        </div>
      )}
    </div>
  );
}

import { Gamepad2, Play, Clock, Heart, MoreHorizontal, Layout, Filter } from 'lucide-react';
