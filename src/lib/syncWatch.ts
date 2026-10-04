import { anilistFetch } from '../api/anilist'
import { serializdApi } from '../api/serializd'
import { useStore } from '../store'
import { isAnimeItem } from './trackers'

type Finished = {
  title: string
  tmdbId: string | number
  type: string
  season?: number
  episode?: number
  item?: any
}

function simklClient() {
  try { return localStorage.getItem('mfy-simkl-client') || localStorage.getItem('mfy-simkl') || '' } catch { return '' }
}
function simklToken() {
  try { return localStorage.getItem('mfy-simkl-token') || '' } catch { return '' }
}

async function pushSimkl(opts: Finished) {
  const client = simklClient()
  const token = simklToken()
  if (!client || !token) return false
  const anime = isAnimeItem(opts.item) || opts.type === 'anime'
  const movie = opts.type === 'movie'
  const body = movie
    ? { movies: [{ title: opts.title, ids: { tmdb: String(opts.tmdbId) } }] }
    : {
        [anime ? 'anime' : 'shows']: [{
          title: opts.title,
          ids: { tmdb: String(opts.tmdbId) },
          seasons: [{ number: Number(opts.season || 1), episodes: [{ number: Number(opts.episode || 1) }] }],
        }],
      }
  const res = await fetch(`https://api.simkl.com/sync/history?client_id=${encodeURIComponent(client)}&app-name=mfy&app-version=1.8`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'mfy/1.8',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Simkl sync failed')
  return true
}

async function pushSerializd(opts: Finished) {
  const st = useStore.getState()
  if (!st.serializdToken) return false
  if (opts.type === 'movie' || opts.type === 'anime' || isAnimeItem(opts.item)) return false
  serializdApi.loadToken(st.serializdToken, false)
  const showId = Number(opts.tmdbId)
  if (!showId) return false
  if (opts.season && opts.episode) {
    try {
      const season = await serializdApi.getSeason(showId, Number(opts.season))
      await serializdApi.logEpisodes(showId, Number(season?.id || opts.season), [Number(opts.episode)])
    } catch {
      await serializdApi.logEpisodes(showId, Number(opts.season), [Number(opts.episode)])
    }
  } else {
    await serializdApi.logShow(showId)
  }
  return true
}

async function pushAnilist(opts: Finished) {
  const token = (() => { try { return localStorage.getItem('mfy-anilist-token') || '' } catch { return '' } })()
  if (!token) return false
  const anime = opts.type === 'anime' || isAnimeItem(opts.item)
  const print = /manga|novel|book/i.test(opts.type)
  if (!anime && !print) return false
  const type = anime ? 'ANIME' : 'MANGA'
  const found = await anilistFetch<{ Media: { id: number; episodes: number | null } | null }>(
    `query ($search: String, $type: MediaType) { Media(search: $search, type: $type) { id episodes } }`,
    { search: opts.title, type }
  )
  const id = found?.Media?.id
  if (!id) return false
  const progress = Number(opts.episode || 1)
  const total = Number(found?.Media?.episodes || 0)
  const status = total > 0 && progress >= total ? 'COMPLETED' : 'CURRENT'
  await anilistFetch(
    `mutation ($id: Int, $progress: Int, $status: MediaListStatus) { SaveMediaListEntry(mediaId: $id, progress: $progress, status: $status) { id progress status } }`,
    { id, progress, status }
  )
  return true
}

/** Mark a finished episode on Serializd, AniList, and Simkl. Safe to call often. */
export async function syncFinished(opts: Finished) {
  const key = `mfy-synced-${opts.tmdbId}-${opts.season || 0}-${opts.episode || 0}`
  try { if (localStorage.getItem(key)) return [] } catch {}
  const notes: string[] = []
  const jobs: Array<Promise<void>> = [
    pushSerializd(opts).then((ok) => { if (ok) notes.push('Serializd') }).catch(() => {}),
    pushAnilist(opts).then((ok) => { if (ok) notes.push('AniList') }).catch(() => {}),
    pushSimkl(opts).then((ok) => { if (ok) notes.push('Simkl') }).catch(() => {}),
  ]
  await Promise.all(jobs)
  if (notes.length) {
    try { localStorage.setItem(key, notes.join(',')) } catch {}
  }
  return notes
}
