import { tmdb } from '../api/tmdb'

export type FillerHit = { nums: Set<number>; dates: Set<string>; count: number }

let byTitle = new Map<string, FillerHit>()
let ready: Promise<void> | null = null

function norm(title: string) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ALIAS: Record<string, string> = {
  'case closed': 'detective conan',
}

export function ensureFiller() {
  if (!ready) {
    ready = fetch(`${import.meta.env.BASE_URL}filler.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, { title?: string; n?: number[]; d?: string[] }>) => {
        const map = new Map<string, FillerHit>()
        for (const row of Object.values(data || {})) {
          const key = norm(row.title || '')
          if (!key) continue
          const count = (row.n || []).length
          const prev = map.get(key)
          if (prev && prev.count >= count) continue
          map.set(key, { nums: new Set(row.n || []), dates: new Set(row.d || []), count })
        }
        byTitle = map
      })
      .catch(() => {})
  }
  return ready
}

export function fillerFor(title: string): FillerHit | null {
  const key = norm(title || '')
  if (!key) return null
  return byTitle.get(key) || byTitle.get(ALIAS[key] || '') || null
}

export function hideFillerOn() {
  try { return localStorage.getItem('mfy-hide-filler') !== '0' } catch { return true }
}

export function setHideFiller(on: boolean) {
  try { localStorage.setItem('mfy-hide-filler', on ? '1' : '0') } catch {}
}

export function absoluteEpisode(seasons: { season_number: number; episode_count?: number }[] | undefined, season: number, episode: number) {
  if (season <= 0) return episode
  let total = 0
  for (const row of seasons || []) {
    if (row.season_number > 0 && row.season_number < season) total += Number(row.episode_count) || 0
  }
  return total + Number(episode || 0)
}

export function episodeIsFiller(show: FillerHit | null, airDate?: string, absolute?: number) {
  if (!show) return false
  const day = String(airDate || '').slice(0, 10)
  if (day) return show.dates.has(day)
  return !!(absolute && show.nums.has(absolute))
}

export async function nextCanonEpisode(id: number, season: number, episode: number, title: string) {
  await ensureFiller()
  const show = fillerFor(title)
  const hide = hideFillerOn() && !!show
  const detail = await tmdb.getTVDetail(id).catch(() => null)
  const seasons = detail?.seasons || []
  let seasonNumber = season
  let after = episode
  for (let guard = 0; guard < 12; guard++) {
    const seasonData = await tmdb.getSeasonDetail(id, seasonNumber).catch(() => null)
    const later = (seasonData?.episodes || []).filter((ep: any) => ep.episode_number > after)
    for (const ep of later) {
      const absolute = absoluteEpisode(seasons, seasonNumber, ep.episode_number)
      if (!hide || !episodeIsFiller(show, ep.air_date, absolute)) {
        return { season: seasonNumber, episode: ep.episode_number, name: ep.name, still: ep.still_path }
      }
    }
    const next = seasons.find((row: any) => row.season_number === seasonNumber + 1 && row.episode_count > 0)
    if (!next) return null
    seasonNumber = next.season_number
    after = 0
  }
  return null
}
