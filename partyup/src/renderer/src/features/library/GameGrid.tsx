import React from 'react';
import { Gamepad2, Clock, Play, Heart, MoreHorizontal } from 'lucide-react';
import type { Game } from '../../types';

interface GameGridProps {
  games: Game[];
  onLaunch: (game: Game) => void;
  selectedIds: string[];
  onSelect: (id: string) => void;
  view: 'grid' | 'list' | 'cover-flow' | 'compact';
}

export function GameGrid({ games, onLaunch, selectedIds, onSelect, view }: GameGridProps) {
  if (view === 'list') {
    return (
      <div className="game-list">
        <div className="list-header">
          <div className="col-select"><input type="checkbox" /></div>
          <div className="col-cover"></div>
          <div className="col-title">Title</div>
          <div className="col-platform">Platform</div>
          <div className="col-playtime">Playtime</div>
          <div className="col-last-played">Last Played</div>
          <div className="col-actions"></div>
        </div>
        {games.map(game => (
          <GameRow key={game.id} game={game} onLaunch={onLaunch} selected={selectedIds.includes(game.id)} onSelect={() => onSelect(game.id)} />
        ))}
      </div>
    );
  }

  if (view === 'compact') {
    return (
      <div className="game-list compact">
        {games.map(game => (
          <CompactRow key={game.id} game={game} onLaunch={onLaunch} selected={selectedIds.includes(game.id)} onSelect={() => onSelect(game.id)} />
        ))}
      </div>
    );
  }

  return (
    <div className={`game-grid ${view === 'cover-flow' ? 'cover-flow' : ''}`}>
      {games.map(game => (
        <GameCard key={game.id} game={game} onLaunch={onLaunch} selected={selectedIds.includes(game.id)} onSelect={() => onSelect(game.id)} />
      ))}
    </div>
  );
}

function GameCard({ game, onLaunch, selected, onSelect }: { game: Game; onLaunch: (game: Game) => void; selected: boolean; onSelect: () => void }) {
  return (
    <article className={`game-card ${selected ? 'selected' : ''}`}>
      <div className="game-actions">
        <label className="icon-btn">
          <input type="checkbox" checked={selected} onChange={onSelect} className="sr-only" />
        </label>
        <button className="icon-btn" onClick={(e) => { e.stopPropagation(); onLaunch(game); }} aria-label="Launch">
          <Play size={16} />
        </button>
        <button className="icon-btn" aria-label="More">
          <MoreHorizontal size={16} />
        </button>
      </div>
      {game.cover && <img src={game.cover} alt={game.name} className="game-cover" loading="lazy" />}
      <div className="game-info">
        <h3 className="game-title">{game.name}</h3>
        <div className="game-meta">
          <span className="game-platform">{game.platform}</span>
          {game.playtime && (
            <span className="game-playtime">
              <Clock size={12} /> {Math.round(game.playtime / 60)}h
            </span>
          )}
        </div>
      </div>
      {game.favorite && <div className="favorite-badge"><Heart size={14} /></div>}
    </article>
  );
}

function GameRow({ game, onLaunch, selected, onSelect }: { game: Game; onLaunch: (game: Game) => void; selected: boolean; onSelect: () => void }) {
  return (
    <article className={`game-row ${selected ? 'selected' : ''}`}>
      <label className="col-select flex-center">
        <input type="checkbox" checked={selected} onChange={onSelect} className="sr-only" />
      </label>
      <div className="col-cover">
        {game.cover && <img src={game.cover} alt={game.name} className="game-cover-small" />}
      </div>
      <div className="col-title">{game.name}</div>
      <div className="col-platform"><span className="game-platform">{game.platform}</span></div>
      <div className="col-playtime">{game.playtime ? `${Math.round(game.playtime / 60)}h` : '-'}</div>
      <div className="col-last-played">{game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString() : '-'}</div>
      <div className="col-actions">
        <button className="icon-btn" onClick={() => onLaunch(game)}><Play size={16} /></button>
        <button className="icon-btn"><MoreHorizontal size={16} /></button>
      </div>
    </article>
  );
}

function CompactRow({ game, onLaunch, selected, onSelect }: { game: Game; onLaunch: (game: Game) => void; selected: boolean; onSelect: () => void }) {
  return (
    <article className={`game-row compact ${selected ? 'selected' : ''}`}>
      <label className="flex-center">
        <input type="checkbox" checked={selected} onChange={onSelect} className="sr-only" />
      </label>
      {game.cover && <img src={game.cover} alt={game.name} className="game-cover-tiny" />}
      <div className="compact-info">
        <span className="compact-title">{game.name}</span>
        <span className="compact-meta">{game.platform} • {game.playtime ? `${Math.round(game.playtime / 60)}h` : '0h'}</span>
      </div>
      <button className="icon-btn" onClick={() => onLaunch(game)}><Play size={16} /></button>
    </article>
  );
}
