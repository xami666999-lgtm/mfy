import { Bookmark, Heart, Star, Plus, Trash2, Play, List, Pencil, Check, X } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { POSTER_URL } from '../api/tmdb'
import { cn } from '../lib/utils'
import { watchPercent } from '../lib/watchProgress'

type Tab = 'watchlist' | 'favorites' | 'history' | 'lists'

function posterUrl(path?: string | null) {
  if (!path) return ''
  if (String(path).startsWith('http')) return String(path)
  return `${POSTER_URL}${path}`
}

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

  function openItem(mediaId: number | string, mediaType: 'movie' | 'tv' | 'iptv', extra?: any) {
    setSelectedMedia({ id: mediaId, type: mediaType, season: extra?.season, episode: extra?.episode, title: extra?.title } as any)
    setCurrentPage(mediaType === 'iptv' ? 'sports' : 'detail')
  }

  const tabs = [
    { id: 'watchlist' as const, label: 'Saved', icon: Bookmark, count: watchlist.length },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'history' as const, label: 'History', icon: Star, count: watchHistory.length },
    { id: 'lists' as const, label: 'Collections', icon: List, count: customLists.length },
  ]

  function Grid({ items, onRemove }: { items: any[]; onRemove?: (item: any) => void }) {
    if (!items.length) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center text-white/35">
          Nothing here yet
        </div>
      )
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {items.map((item) => {
          const id = item.mediaId ?? item.id
          const type = item.mediaType || item.media_type || 'movie'
          const title = item.title || item.name || ''
          const poster = posterUrl(item.posterPath || item.poster_path)
          const pct = watchPercent(item)
          return (
            <div key={`${type}-${id}-${item.season || 0}-${item.episode || 0}`} className="group relative">
              <button type="button" className="poster-card w-full text-left" onClick={() => openItem(id, type, item)}>
                {poster ? <img src={poster} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <div className="poster-fallback">{title}</div>}
                <div className="poster-play"><Play size={16} fill="#fff" /></div>
                <div className="poster-overlay">
                  <div className="poster-meta-title">{title}</div>
                  <div className="poster-meta-sub capitalize">{type}{item.season ? ` · S${item.season}E${item.episode || 1}` : ''}{pct > 0 ? ` · ${pct}%` : ''}</div>
                </div>
                {pct > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                    <div className="h-full bg-[#FF1493]" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </button>
              {onRemove && (
                <button
                  type="button"
                  className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 text-white/80 grid place-items-center opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onRemove(item) }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="board page-fade-enter">
      <div className="px-8 pt-8 pb-4">
        <p className="text-[11px] tracking-[0.28em] text-[#FF1493] font-bold">LIBRARY</p>
        <h1 className="text-4xl font-black text-white mt-1">Your titles</h1>
        <p className="text-sm text-white/40 mt-1">Saved, favorites, history, collections</p>
        <div className="flex gap-2 mt-5 flex-wrap">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-2 border',
                  tab === t.id ? 'bg-[#FF1493] border-[#FF1493] text-white' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                )}
              >
                <Icon size={13} /> {t.label} {t.count}
              </button>
            )
          })}
        </div>
      </div>
      <div className="px-8 pb-12">
        {tab === 'watchlist' && (
          <Grid items={watchlist} onRemove={(i) => removeFromWatchlist(i.mediaId, i.mediaType)} />
        )}
        {tab === 'favorites' && (
          <Grid items={favorites} onRemove={(i) => removeFavorite(i.mediaId, i.mediaType)} />
        )}
        {tab === 'history' && <Grid items={watchHistory} />}
        {tab === 'lists' && (
          <div className="space-y-6">
            <div className="flex gap-2 max-w-xl">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newListName.trim() && (createCustomList(newListName.trim()), setNewListName(''))}
                placeholder="New collection name"
                className="flex-1 h-11 px-4 rounded-full bg-white/[0.05] border border-white/10 text-sm text-white"
              />
              <button type="button" onClick={() => { if (newListName.trim()) { createCustomList(newListName.trim()); setNewListName('') } }} className="h-11 px-5 rounded-full bg-[#FF1493] text-sm font-bold inline-flex items-center gap-1">
                <Plus size={14} /> Create
              </button>
            </div>
            {customLists.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/35">No collections yet</div>
            )}
            {customLists.map((list) => (
              <section key={list.id}>
                <div className="flex items-center gap-2 mb-3">
                  {editingList === list.id ? (
                    <>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 px-3 rounded-lg bg-white/10 text-sm" />
                      <button type="button" onClick={() => { if (editName.trim()) renameCustomList(list.id, editName.trim()); setEditingList(null) }}><Check size={14} /></button>
                      <button type="button" onClick={() => setEditingList(null)}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold text-white">{list.name}</h2>
                      <span className="text-xs text-white/35">{list.items.length}</span>
                      <button type="button" className="text-white/30" onClick={() => { setEditingList(list.id); setEditName(list.name) }}><Pencil size={13} /></button>
                      <button type="button" className="text-white/30" onClick={() => deleteCustomList(list.id)}><Trash2 size={13} /></button>
                    </>
                  )}
                </div>
                <Grid items={list.items} onRemove={(i) => removeFromCustomList(list.id, i.mediaId, i.mediaType)} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
