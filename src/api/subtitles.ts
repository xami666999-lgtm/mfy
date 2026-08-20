import { cachedFetch } from '../lib/cache'

const OS_BASE = 'https://api.opensubtitles.com/api/v1'

let runtimeKey = ''

export function setRuntimeSubtitleKey(key: string) {
  runtimeKey = key || ''
}

function getKey(): string {
  return runtimeKey || (import.meta as any).env?.VITE_OPENSUBTITLES_API_KEY || ''
}

export interface SubtitleResult {
  url: string
  name: string
  lang: string
  rating: number
}

/**
 * Auto-download subtitles for a title using the OpenSubtitles API.
 * Requires an API key (free account at opensubtitles.com). Returns an empty
 * array when no key is configured so callers can degrade gracefully.
 */
export async function searchSubtitles(
  mediaType: 'movie' | 'tv',
  imdbId: string,
  season?: number,
  episode?: number
): Promise<SubtitleResult[]> {
  const key = getKey()
  if (!key || !imdbId) return []
  try {
    const params = new URLSearchParams({ imdb_id: imdbId.replace('tt', ''), languages: 'en' })
    if (mediaType === 'tv' && season != null && episode != null) {
      params.set('season_number', String(season))
      params.set('episode_number', String(episode))
    }
    const data = await cachedFetch(`subs:${mediaType}:${imdbId}:${season ?? 0}:${episode ?? 0}`, () =>
      fetch(`${OS_BASE}/subtitles?${params.toString()}`, {
        headers: { 'Api-Key': key, 'User-Agent': 'MFYApp/1.0' },
      }).then(async (r) => {
        if (!r.ok) throw new Error(`OpenSubtitles ${r.status}`)
        return r.json()
      }), 24 * 60 * 60 * 1000)
    const list = data?.data || []
    return list
      .filter((s: any) => s?.attributes?.language === 'English' || s?.attributes?.language === 'eng')
      .map((s: any) => ({
        url: s.attributes?.files?.[0]?.file_id
          ? `${OS_BASE}/download?file_id=${s.attributes.files[0].file_id}`
          : '',
        name: s.attributes?.release || s.attributes?.description || 'Subtitle',
        lang: s.attributes?.language || 'en',
        rating: s.attributes?.ratings || 0,
      }))
      .filter((s: SubtitleResult) => Boolean(s.url))
      .slice(0, 5)
  } catch {
    return []
  }
}

/** Download a subtitle file to a VTT blob URL given its download endpoint. */
export async function downloadSubtitle(downloadUrl: string, key: string): Promise<string | null> {
  if (!downloadUrl || !key) return null
  try {
    const res = await fetch(downloadUrl, {
      method: 'POST',
      headers: { 'Api-Key': key, 'User-Agent': 'MFYApp/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const fileUrl = data?.link
    if (!fileUrl) return null
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) return null
    let text = await fileRes.text()
    if (/^WEBVTT/m.test(text)) {
      return URL.createObjectURL(new Blob([text], { type: 'text/vtt' }))
    }
    text = `WEBVTT\n\n${text.replace(/\r?\n/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')}`
    return URL.createObjectURL(new Blob([text], { type: 'text/vtt' }))
  } catch {
    return null
  }
}