import { Bookmark, Heart, Star, Plus, Trash2, Play, List, Pencil, Check, X, Award } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../store'
import { POSTER_URL } from '../api/tmdb'
import { cn } from '../lib/utils'
import { watchFace } from '../lib/watchProgress'
import { PosterStatus, stateCaption } from '../components/PosterTile'
import { genreOf, scoreOf } from '../components/PosterMarks'
import { Achievements } from '../components/Achievements'
import { viewingBadges } from '../lib/achievements'
import { isAnimeItem } from '../lib/trackers'

type Tab = 'status' | 'watched' | 'watchlist' | 'favorites' | 'history' | 'lists' | 'badges'
type LibFilter = 'all' | 'recent' | 'watching' | 'planned' | 'done' | 'movies' | 'shows' | 'anime'

function watchedRows(rows: { completed?: boolean; seriesCompleted?: boolean; progress?: number; duration?: number; mediaId?: number | string; mediaType?: string; watchedAt?: string }[]) {
  const map = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    const duration = Number(row.duration) || 0
    const progress = Number(row.progress) || 0
    const done = !!(row.completed || row.seriesCompleted || (duration >= 60 && progress / duration >= 0.9))
    if (!done) continue
    const key = `${row.mediaType || 'tv'}|${row.mediaId}`
    const prev = map.get(key)
    if (!prev || Date.parse(row.watchedAt || '') >= Date.parse(prev.watchedAt || '')) map.set(key, row)
  }
  return [...map.values()]
}

function isAnimeLib(item: any) {
  if (isAnimeItem(item)) return true
  return String(item?.id || '').startsWith('al-')
}

function collectLibrary(groups: any[][]) {
  const animeIds = new Set<string>()
  for (const group of groups) {
    for (const item of group || []) {
      if (isAnimeLib(item)) animeIds.add(String(item.mediaId ?? item.id))
    }
  }
  const map = new Map<string, any>()
  for (const group of groups) {
    for (const item of group) {
      if (!item) continue
      const id = item.mediaId ?? item.id
      if (id == null) continue
      const type = item.mediaType || item.media_type || 'tv'
      if (type === 'iptv') continue
      const anime = isAnimeLib(item) || animeIds.has(String(id))
      const key = `${anime ? 'anime' : type}|${id}`
      const prev = map.get(key)
      const poster = item.posterPath || item.poster_path
      const next = anime ? { ...item, isAnime: true } : item
      if (!prev || (!(prev.posterPath || prev.poster_path) && poster)) map.set(key, next)
    }
  }
  return [...map.values()]
}

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
  const [tab, setTab] = useState<Tab>('status')
  const [newListName, setNewListName] = useState('')
  const [editingList, setEditingList] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [filter, setFilter] = useState<LibFilter>('all')

  function openItem(mediaId: number | string, mediaType: 'movie' | 'tv' | 'iptv', extra?: any) {
    setSelectedMedia({ id: mediaId, type: mediaType, season: extra?.season, episode: extra?.episode, title: extra?.title } as any)
    setCurrentPage(mediaType === 'iptv' ? 'sports' : 'detail')
  }

  const watched = watchedRows(watchHistory)
  const libraryRows = collectLibrary([watchlist, favorites, watchHistory])
  const filters: { id: LibFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recently added' },
    { id: 'watching', label: 'Watching' },
    { id: 'planned', label: 'Plan to watch' },
    { id: 'done', label: 'Completed' },
    { id: 'movies', label: 'Movies' },
    { id: 'shows', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
  ]

  function narrow(items: any[]) {
    let rows = [...items]
    const kind = (i: any) => i.mediaType || i.media_type || 'movie'
    const animeIds = new Set(libraryRows.filter((i) => i.isAnime || isAnimeLib(i)).map((i) => String(i.mediaId ?? i.id)))
    const rowAnime = (i: any) => isAnimeLib(i) || animeIds.has(String(i.mediaId ?? i.id))
    if (filter === 'movies') rows = rows.filter((i) => kind(i) === 'movie' && !rowAnime(i))
    if (filter === 'shows') rows = rows.filter((i) => kind(i) !== 'movie' && kind(i) !== 'iptv' && !rowAnime(i))
    if (filter === 'anime') rows = rows.filter((i) => rowAnime(i))
    if (filter === 'watching') rows = rows.filter((i) => !i.completed && !i.seriesCompleted && Number(i.progress) > 0)
    if (filter === 'planned') rows = rows.filter((i) => !(Number(i.progress) > 0) && !i.completed)
    if (filter === 'done') rows = rows.filter((i) => i.completed || i.seriesCompleted)
    if (filter === 'recent') rows.sort((a, b) => String(b.addedAt || b.watchedAt || '').localeCompare(String(a.addedAt || a.watchedAt || '')))
    return rows
  }
  const tabs = [
    { id: 'status' as const, label: 'Library', icon: Bookmark, count: watchlist.length + watchHistory.length },
    { id: 'watched' as const, label: 'Watched', icon: Check, count: watched.length },
    { id: 'watchlist' as const, label: 'Saved', icon: Bookmark, count: watchlist.length },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart, count: favorites.length },
    { id: 'history' as const, label: 'History', icon: Star, count: watchHistory.length },
    { id: 'lists' as const, label: 'Collections', icon: List, count: customLists.length },
    { id: 'badges' as const, label: 'Badges', icon: Award, count: viewingBadges(watchHistory).filter((b) => b.earned).length },
  ]

  function Grid({ items, onRemove, keep }: { items: any[]; onRemove?: (item: any) => void; keep?: boolean }) {
    const shown = keep ? items : narrow(items)
    if (!shown.length) {
      return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-20 text-center text-white/35">
          Nothing here yet
        </div>
      )
    }
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
        {shown.map((item) => {
          const id = item.mediaId ?? item.id
          const type = item.mediaType || item.media_type || 'movie'
          const title = item.title || item.name || ''
          const poster = posterUrl(item.posterPath || item.poster_path)
          const face = watchFace(watchHistory, id, item)
          return (
            <div key={`${type}-${id}-${item.season || 0}-${item.episode || 0}`} className="group relative">
              <button type="button" className="poster-card w-full text-left" onClick={() => openItem(id, type, item)}>
                {poster ? <img src={poster} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <div className="poster-fallback">{title}</div>}
                <PosterStatus
                  genre={genreOf(item)}
                  score={scoreOf(item)}
                  state={face.state}
                  pct={face.pct}
                  label={face.label}
                  pending={face.pending}
                />
                <div className="poster-play"><Play size={16} fill="#fff" /></div>
              </button>
              <strong className="lib-title">{title}</strong>
              <em className="nv-cap">{stateCaption(face.state)}</em>
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
    <div className="board page-fade-enter nv-page" style={{ minHeight: '100%' }}>
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-[34px] font-semibold text-white tracking-tight" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>Library</h1>
        <p className="text-sm text-white/45 mt-1 mb-5">Saved, favorites, history, collections, badges</p>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'h-9 px-4 rounded-full text-xs font-semibold inline-flex items-center gap-2 border',
                  tab === t.id ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                )}
              >
                <Icon size={13} /> {t.label} {t.count}
              </button>
            )
          })}
        </div>
        {tab !== 'badges' && (
          <div className="flex gap-2 flex-wrap mt-3">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'h-8 px-3 rounded-full text-[11px] font-semibold border',
                  filter === f.id ? 'bg-white text-black border-white' : 'bg-transparent border-white/15 text-white/55'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-8 pb-12">
        {tab === 'status' && (
          <div className="space-y-8">
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">Watching</h3>
              <Grid items={watchHistory.filter((h) => !h.completed && Number(h.progress) > 0)} />
            </section>
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">Plan to watch</h3>
              <Grid items={watchlist} onRemove={(item) => removeFromWatchlist(item.mediaId, item.mediaType)} />
            </section>
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">Watched</h3>
              <Grid items={watched} />
            </section>
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">Movies</h3>
              <Grid keep items={libraryRows.filter((item) => !isAnimeLib(item) && (item.mediaType || item.media_type) === 'movie')} />
            </section>
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">TV Shows</h3>
              <Grid keep items={libraryRows.filter((item) => !isAnimeLib(item) && (item.mediaType || item.media_type) !== 'movie')} />
            </section>
            <section>
              <h3 className="text-white text-lg font-semibold mb-3">Anime</h3>
              <Grid keep items={libraryRows.filter((item) => isAnimeLib(item))} />
            </section>
          </div>
        )}
        {tab === 'watched' && <Grid items={watched} />}
        {tab === 'watchlist' && (
          <Grid items={watchlist} onRemove={(i) => removeFromWatchlist(i.mediaId, i.mediaType)} />
        )}
        {tab === 'favorites' && (
          <Grid items={favorites} onRemove={(i) => removeFavorite(i.mediaId, i.mediaType)} />
        )}
        {tab === 'history' && <Grid items={watchHistory} />}
        {tab === 'badges' && <Achievements history={watchHistory} />}
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
              <button type="button" onClick={() => { if (newListName.trim()) { createCustomList(newListName.trim()); setNewListName('') } }} className="h-11 px-5 rounded-full bg-[#e50914] text-sm font-bold inline-flex items-center gap-1">
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
