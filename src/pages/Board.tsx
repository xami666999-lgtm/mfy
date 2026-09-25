import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronRight, Clock, Star, TrendingUp, Plus } from 'lucide-react';
import { useStore } from '../store';
import { streamService } from '../services/stream';
import { databaseService } from '../services/database';
import { MediaRow } from '../components/MediaRow';
import { HeroSection } from '../components/HeroSection';
import { ContinueWatchingRow } from '../components/ContinueWatchingRow';
import { SectionHeader } from '../components/SectionHeader';
import { Loader } from '../components/ui/Loader';

export function Board() {
  const { 
    currentPage, 
    setCurrentPage, 
    continueWatching, 
    addons, 
    enabledAddons,
    settings,
    mediaItems,
    setMediaItems 
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dbCW = databaseService.getContinueWatching();
        if (dbCW.length > 0) {
          useStore.getState().setContinueWatching(dbCW);
        }

        const activeAddons = addons.filter(a => enabledAddons.includes(a.id));
        streamService.setAddons(activeAddons);

        const trending = await streamService.getCatalog('trending', 'movie');
        if (trending.length > 0) {
          setMediaItems(trending);
          setHeroItem(trending[0]);
        }

        const nowStreaming = await streamService.getCatalog('now-streaming', 'movie');
        const newEpisodes = await streamService.getCatalog('new-episode', 'tv');
        const trendingTV = await streamService.getCatalog('trending', 'tv');
        const popularAnime = await streamService.getCatalog('popular', 'anime');
      } catch (e) {
        console.error('Failed to load board data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-6 py-4">
        <HeroSection item={heroItem} />
      </div>

      <ContinueWatchingRow items={continueWatching} />

      <SectionHeader title="Trending Movies" actionLabel="View All" onAction={() => setCurrentPage('movies')} />
      <MediaRow 
        items={mediaItems.filter(m => m.media_type === 'movie').slice(0, 15)} 
        type="movie"
        showMeta
      />

      <SectionHeader title="Trending TV Shows" actionLabel="View All" onAction={() => setCurrentPage('tv')} />
      <MediaRow 
        items={mediaItems.filter(m => m.media_type === 'tv').slice(0, 15)} 
        type="tv"
        showMeta
      />

      <SectionHeader title="Popular Anime" actionLabel="View All" onAction={() => setCurrentPage('anime')} />
      <MediaRow 
        items={mediaItems.filter(m => m.media_type === 'anime').slice(0, 15)} 
        type="anime"
        showMeta
      />

      <SectionHeader title="New Episodes" actionLabel="View All" onAction={() => setCurrentPage('discover')} />
      <MediaRow 
        items={[]} 
        type="tv"
        showMeta
        showEpisodeInfo
      />

      <SectionHeader title="Coming Soon" actionLabel="View All" onAction={() => setCurrentPage('upcoming')} />
      <MediaRow 
        items={[]} 
        type="movie"
        showMeta
      />
    </div>
  );
}