import { Bookmark, Heart, Star, Plus, Trash2, Play } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { POSTER_URL } from '../api/tmdb'
import { cn } from '../lib/utils'

type Tab = 'watchlist' | 'favorites' | 'history'

export default function Library() {
  const {
    watchlist,
    removeFromWatchlist,
    setSelectedMedia,
    setCurrentPage,
    watchHistory,
    favorites,
    removeFavorite,
  } = useStore()
  const [tab, setTab] = useState<Tab>('watchlist')

  function openItem(mediaId: number, mediaType: 'movie' | 'tv') {
    setSelectedMedia({ id: mediaId, type: mediaType })
    setCurrentPage('detail')
  }

  const tabs = [
    { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark, count: watchlist.length },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'history' as const, label: 'History', icon: Star, count: watchHistory.length },
  ]

  return (
    <div className="p-8 page-fade-enter">
      <div className="flex items-center gap-6 mb-6">
        <h2 className="text-lg font-semibold text-white tracking-tight">My List</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-all border',
                tab === t.id
                  ? 'bg-[#FF1493]/15 border-[#FF1493]/35 text-[#FF1493]'
                  : 'bg-white/[0.04] border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/[0.1]'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className="ml-1 text-[10px] opacity-70">({t.count})</span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'watchlist' && (
        watchlist.length === 0 ? (
          <div className="empty-state">
            <Bookmark />
            <p className="text-sm text-white/30 mb-1">Your list is empty</p>
            <p className="text-xs text-white/15">Browse content and tap + to add it here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchlist.map((item) => (
              <div key={`${item.mediaType}-${item.mediaId}`} className="group relative">
                <div
                  className="poster-card w-full"
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(item.mediaId, item.mediaType)}
                  onKeyDown={(e) => e.key === 'Enter' && openItem(item.mediaId, item.mediaType)}
                >
                  {item.posterPath ? (
                    <img
                      src={`${POSTER_URL}${item.posterPath}`}
                      alt={item.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="poster-fallback">{item.title}</div>
                  )}
                  <div className="poster-play"><Play size={18} fill="#fff" /></div>
                  <div className="poster-overlay">
                    <div className="poster-meta-title">{item.title}</div>
                    <div className="poster-meta-sub capitalize">{item.mediaType}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/15 text-white/70 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 hover:text-white"
                  aria-label="Remove from list"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchlist(item.mediaId, item.mediaType)
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'favorites' && (
        favorites.length === 0 ? (
          <div className="empty-state">
            <Heart />
            <p className="text-sm text-white/30 mb-1">No favorites yet</p>
            <p className="text-xs text-white/15">Tap the heart on a detail page to save favorites</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((item) => (
              <div key={`fav-${item.mediaType}-${item.mediaId}`} className="group relative">
                <div
                  className="poster-card w-full"
                  role="button"
                  tabIndex={0}
                  onClick={() => openItem(item.mediaId, item.mediaType)}
                >
                  {item.posterPath ? (
                    <img src={`${POSTER_URL}${item.posterPath}`} alt={item.title} loading="lazy" />
                  ) : (
                    <div className="poster-fallback">{item.title}</div>
                  )}
                  <div className="poster-overlay">
                    <div className="poster-meta-title">{item.title}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/15 text-white/70 grid place-items-center opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); removeFavorite(item.mediaId, item.mediaType) }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        watchHistory.length === 0 ? (
          <div className="empty-state">
            <Star />
            <p className="text-sm text-white/30 mb-1">No watch history</p>
            <p className="text-xs text-white/15">Titles you play will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {watchHistory.map((h) => (
              <button
                key={h.id}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-left transition-all"
                onClick={() => openItem(h.mediaId, h.mediaType)}
              >
                {h.posterPath ? (
                  <img
                    src={`${POSTER_URL}${h.posterPath}`}
                    alt=""
                    className="w-12 h-[72px] object-cover rounded-md"
                  />
                ) : (
                  <div className="w-12 h-[72px] rounded-md bg-white/[0.06]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{h.title}</div>
                  <div className="text-[11px] text-white/35 mt-0.5">
                    {h.mediaType}
                    {h.season != null && ` · S${h.season}E${h.episode}`}
                    {h.progress > 0 && ` · ${Math.round((h.progress / Math.max(h.duration, 1)) * 100)}%`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )
      )}
    </div>
  )
}
