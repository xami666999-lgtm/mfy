import { Bookmark, Heart, Star, Plus, Trash2, Play, List, Pencil, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { POSTER_URL } from '../api/tmdb'
import { cn } from '../lib/utils'

type Tab = 'watchlist' | 'favorites' | 'history' | 'lists'

export default function Library() {
  const {
    watchlist,
    removeFromWatchlist,
    setSelectedMedia,
    setCurrentPage,
    watchHistory,
    favorites,
    removeFavorite,
    customLists,
    createCustomList,
    renameCustomList,
    deleteCustomList,
    removeFromCustomList,
  } = useStore()
  const [tab, setTab] = useState<Tab>('watchlist')
  const [newListName, setNewListName] = useState('')
  const [editingList, setEditingList] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function openItem(mediaId: number | string, mediaType: 'movie' | 'tv' | 'iptv') {
    setSelectedMedia({ id: mediaId, type: mediaType })
    setCurrentPage('detail')
  }

  const tabs = [
    { id: 'watchlist' as const, label: 'Watchlist', icon: Bookmark, count: watchlist.length },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'lists' as const, label: 'My Lists', icon: List, count: customLists.length },
    { id: 'history' as const, label: 'History', icon: Star, count: watchHistory.length },
  ]

  function submitNewList() {
    const name = newListName.trim()
    if (!name) return
    createCustomList(name)
    setNewListName('')
  }

  function submitRename(id: string) {
    const name = editName.trim()
    if (name) renameCustomList(id, name)
    setEditingList(null)
  }

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
                        alt={item.title || ''}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="poster-fallback flex flex-col items-center justify-center h-full w-full text-center"
                        style={{ color: 'var(--mfy-text)', background: 'var(--mfy-surface-2)' }}
                      >
                        {item.title ? (
                          <div className="text-sm font-medium truncate">{item.title}</div>
                        ) : (
                          <div className="text-xs text-white/60">Media {item.mediaType}</div>
                        )}
                        {item.mediaId && (
                          <div className="text-[10px] text-white/30 mt-1">#{item.mediaId}</div>
                        )}
                      </div>
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

      {tab === 'lists' && (
        <div className="space-y-4 max-w-3xl">
          <div className="flex gap-2">
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNewList()}
              placeholder="New list name (e.g. Movies for movie night)"
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF1493]/40"
            />
            <button
              type="button"
              onClick={submitNewList}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#FF1493]/15 border border-[#FF1493]/30 text-xs text-[#FF1493] hover:bg-[#FF1493]/25"
            >
              <Plus size={14} /> Create
            </button>
          </div>

          {customLists.length === 0 ? (
            <div className="empty-state">
              <List />
              <img
                src={Math.random() < 0.5 
                  ? 'https://image.tmdb.org/t/p/w300/kqjL17yufAw3FSj2Q2CvstUlitT.jpg'
                  : 'https://image.tmdb.org/t/p/w300/8uO5yKg1968B2IS3bnl0JpWhWFp.jpg'}
                alt="Random movie poster"
                className="w-full h-[200px] object-cover rounded-2xl mb-3"
                onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none' }}
              />
              <p className="text-sm text-white/30 mb-1">No custom lists yet</p>
              <p className="text-xs text-white/15">Create lists to organize titles your way</p>
            </div>
          ) : (
            customLists.map((list) => (
              <div key={list.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="flex items-center gap-2 mb-3">
                  {editingList === list.id ? (
                    <>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitRename(list.id)}
                        autoFocus
                        className="flex-1 h-8 px-2 rounded-md bg-white/[0.06] border border-[#FF1493]/40 text-sm text-white focus:outline-none"
                      />
                      <button type="button" onClick={() => submitRename(list.id)} className="p-1.5 text-emerald-400 hover:bg-white/[0.06] rounded"><Check size={15} /></button>
                      <button type="button" onClick={() => setEditingList(null)} className="p-1.5 text-white/40 hover:bg-white/[0.06] rounded"><X size={15} /></button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-medium text-white truncate">{list.name}</h3>
                      <span className="text-[10px] text-white/30">{list.items.length} item{list.items.length === 1 ? '' : 's'}</span>
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => { setEditingList(list.id); setEditName(list.name) }}
                        className="p-1.5 text-white/40 hover:text-white/70 hover:bg-white/[0.06] rounded"
                        title="Rename"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (confirm(`Delete "${list.name}"?`)) deleteCustomList(list.id) }}
                        className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/[0.06] rounded"
                        title="Delete list"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
                {list.items.length === 0 ? (
                  <p className="text-xs text-white/20 py-3 text-center">No titles yet — open a title and add it to this list.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {list.items.map((item) => (
                      <div key={`${item.mediaType}-${item.mediaId}`} className="group relative">
                        <div
                          className="poster-card w-full"
                          role="button"
                          tabIndex={0}
                          onClick={() => openItem(item.mediaId, item.mediaType)}
                        >
                          {item.posterPath ? (
                            <img src={`${POSTER_URL}${item.posterPath}`} alt={item.title || ''} loading="lazy"
                              onError={(e) => { const el = e.currentTarget; el.onerror = null; el.style.display = 'none'; if (el.parentElement) el.parentElement.classList.add('has-fallback') }}
                            />
                          ) : (
                            <div className="poster-fallback" style={{ color: 'var(--mfy-text)', background: 'var(--mfy-surface-2)' }}>{item.title || `#${item.mediaId}`}</div>
                          )}
                          <div className="poster-overlay">
                            <div className="poster-meta-title">{item.title || item.mediaType}</div>
                            <div className="poster-meta-sub capitalize">{item.mediaType}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/70 border border-white/15 text-white/70 grid place-items-center opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); removeFromCustomList(list.id, item.mediaId as number, item.mediaType) }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
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
                onClick={() => openItem(h.mediaId as number, h.mediaType)}
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