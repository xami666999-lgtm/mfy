import { anilistFetch } from '../api/anilist'
import { tmdb } from '../api/tmdb'
import { useStore, type WatchlistItem } from '../store'
import type { WatchHistoryItem } from '../types'

const SERIALIZD = 'https://serializd.onrender.com/api'

function headers() {
  const token = useStore.getState().serializdToken || ''
  const h: Record<string, string> = {
    Origin: 'https://www.serializd.com',
    Referer: 'https://www.serializd.com',
    'X-Requested-With': 'serializd_vercel',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function serializdUsername() {
  const saved = useStore.getState().serializdUser?.username
  if (saved) return saved
  const res = await fetch(`${SERIALIZD}/user_information`, { headers: headers() })
  if (!res.ok) throw new Error('Sign in with Serializd first.')
  const data = await res.json()
  const name = data?.username || data?.user?.username || ''
  if (!name) throw new Error('Serializd did not return a username.')
  return String(name)
}

export async function importSerializdWatchlist() {
  const username = await serializdUsername()
  const found: WatchlistItem[] = []
  for (let page = 1; page <= 10; page++) {
    const url = `${SERIALIZD}/user/${encodeURIComponent(username)}/watchlistpage_v2/${page}?sort_by=date_added_desc&filters=%7B%7D`
    const res = await fetch(url, { headers: headers() })
    if (!res.ok) throw new Error('Could not read that Serializd watchlist.')
    const data = await res.json()
    for (const row of data.items || []) {
      if (!row?.showId) continue
      found.push({
        mediaId: Number(row.showId),
        mediaType: 'tv',
        title: String(row.showName || 'Show'),
        posterPath: row.bannerImage || null,
        addedAt: row.dateAdded || new Date().toISOString(),
      })
    }
    if (page >= Number(data.totalPages || 1)) break
  }
  const add = useStore.getState().addToWatchlist
  found.forEach(add)
  return found.length
}

async function tmdbMatch(title: string, movie: boolean) {
  const data = movie ? await tmdb.searchMovies(title) : await tmdb.searchTV(title)
  const rows = data?.results || []
  const want = title.toLowerCase()
  const hit = rows.find((row: any) => String(row.title || row.name || '').toLowerCase() === want) || rows[0]
  if (!hit?.id) return null
  return {
    mediaId: Number(hit.id),
    mediaType: movie ? 'movie' as const : 'tv' as const,
    title: String(hit.title || hit.name || title),
    posterPath: hit.poster_path || null,
  }
}

export async function importAnilistWatchlist() {
  const viewer = await anilistFetch<{ Viewer: { name: string } | null }>(`query { Viewer { name } }`)
  const user = viewer?.Viewer?.name
  if (!user) throw new Error('Sign in with AniList first.')
  const data = await anilistFetch<{ MediaListCollection: { lists: { entries: any[] }[] } }>(
    `query ($user: String) {
      MediaListCollection(userName: $user, type: ANIME) {
        lists {
          entries {
            status
            progress
            media { id format title { english romaji } coverImage { large } }
          }
        }
      }
    }`,
    { user },
  )
  const entries = (data?.MediaListCollection?.lists || []).flatMap((list) => list.entries || []).slice(0, 80)
  let added = 0
  const store = useStore.getState()
  for (const entry of entries) {
    const media = entry?.media
    const title = media?.title?.english || media?.title?.romaji
    if (!title) continue
    const movie = media?.format === 'MOVIE'
    const match = await tmdbMatch(title, movie).catch(() => null)
    if (!match) continue
    const status = String(entry.status || '')
    if (status === 'COMPLETED' || status === 'CURRENT' || status === 'REPEATING') {
      const done = status === 'COMPLETED'
      const row: WatchHistoryItem = {
        id: `al-${match.mediaType}-${match.mediaId}`,
        mediaId: match.mediaId,
        mediaType: match.mediaType,
        title: match.title,
        posterPath: match.posterPath,
        progress: done ? 2400 : 120,
        duration: 2400,
        season: movie ? undefined : 1,
        episode: movie ? undefined : Math.max(1, Number(entry.progress) || 1),
        watchedAt: new Date().toISOString(),
        profileId: store.currentProfile?.id || 'default',
        completed: done,
      }
      store.upsertHistory(row)
    } else {
      store.addToWatchlist({ ...match, addedAt: new Date().toISOString() })
    }
    added += 1
  }
  return added
}
