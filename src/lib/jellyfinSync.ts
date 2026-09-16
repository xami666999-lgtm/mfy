import {
  jellyfinConfigured,
  getJellyfinResume,
  reportJellyfinProgress,
  jellyfinImage,
  type JellyfinConfig,
} from '../api/jellyfin'
import type { WatchHistoryItem } from '../types'

export function cfgFromStore(url: string, apiKey: string): JellyfinConfig | null {
  if (!jellyfinConfigured(url, apiKey)) return null
  return { url, apiKey }
}

export async function pullJellyfinHistory(url: string, apiKey: string): Promise<WatchHistoryItem[]> {
  const cfg = cfgFromStore(url, apiKey)
  if (!cfg) return []
  try {
    const items = await getJellyfinResume(cfg)
    return items.map((it) => {
      const tmdb = Number(it.ProviderIds?.Tmdb || it.ProviderIds?.tmdb || 0)
      const pos = (it.UserData?.PlaybackPositionTicks || 0) / 10_000_000
      const dur = (it.RunTimeTicks || 0) / 10_000_000
      const type: 'movie' | 'tv' = it.Type === 'Movie' ? 'movie' : 'tv'
      return {
        id: `jf-${it.Id}`,
        mediaId: tmdb || 0,
        mediaType: type,
        title: it.Name,
        posterPath: jellyfinImage(cfg, it.Id),
        progress: pos,
        duration: dur,
        watchedAt: new Date().toISOString(),
        profileId: 'jellyfin',
      } as WatchHistoryItem
    }).filter((h) => h.mediaId > 0 || h.title)
  } catch (e) {
    console.warn('[jellyfin] resume pull failed', e)
    return []
  }
}

export async function pushJellyfinProgress(
  url: string,
  apiKey: string,
  tmdbId: number,
  type: 'movie' | 'tv',
  positionSec: number,
  durationSec: number,
  paused: boolean
) {
  const cfg = cfgFromStore(url, apiKey)
  if (!cfg || !tmdbId) return
  try {
    await reportJellyfinProgress(cfg, tmdbId, type, positionSec, durationSec, paused)
  } catch (e) {
    console.warn('[jellyfin] progress failed', e)
  }
}
