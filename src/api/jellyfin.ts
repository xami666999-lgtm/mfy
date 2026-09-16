export interface JellyfinConfig {
  url: string
  apiKey: string
  userId?: string
}

export interface JellyfinItem {
  Id: string
  Name: string
  Type: string
  Overview?: string
  ProductionYear?: number
  ImageTags?: Record<string, string>
  BackdropImageTags?: string[]
  RunTimeTicks?: number
  CommunityRating?: number
  SeriesId?: string
  ParentId?: string
  ProviderIds?: Record<string, string>
  UserData?: {
    PlaybackPositionTicks?: number
    PlayedPercentage?: number
    Played?: boolean
  }
}

function baseUrl(url: string) {
  return url.replace(/\/$/, '')
}

export function jellyfinConfigured(url?: string, apiKey?: string) {
  return Boolean(url && apiKey && url.length > 8 && apiKey.length > 4)
}

export async function jellyfinFetch<T>(
  config: JellyfinConfig,
  endpoint: string,
  params: Record<string, string> = {},
  init: RequestInit = {}
): Promise<T> {
  if (!config.url || !config.apiKey) throw new Error('Jellyfin URL and API key are required.')
  const base = baseUrl(config.url)
  const query = new URLSearchParams(params)
  const qs = query.toString()
  const response = await fetch(`${base}${endpoint}${qs ? `?${qs}` : ''}`, {
    ...init,
    headers: {
      'X-Emby-Token': config.apiKey,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!response.ok) throw new Error(`Jellyfin request failed (${response.status}).`)
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export async function getJellyfinUsers(config: JellyfinConfig): Promise<{ Id: string; Name: string }[]> {
  return jellyfinFetch(config, '/Users')
}

export async function resolveJellyfinUser(config: JellyfinConfig): Promise<string> {
  if (config.userId) return config.userId
  const users = await getJellyfinUsers(config)
  if (!users?.length) throw new Error('No Jellyfin users found.')
  return users[0].Id
}

export async function testJellyfin(config: JellyfinConfig): Promise<string> {
  const users = await getJellyfinUsers(config)
  const name = users?.[0]?.Name || 'server'
  return `Connected as ${name}`
}

export async function getJellyfinItems(
  config: JellyfinConfig,
  startIndex = 0,
  limit = 100
): Promise<{ Items: JellyfinItem[]; TotalRecordCount: number }> {
  const userId = await resolveJellyfinUser(config)
  return jellyfinFetch(config, `/Users/${userId}/Items`, {
    StartIndex: String(startIndex),
    Limit: String(limit),
    IncludeItemTypes: 'Movie,Series,Episode',
    Recursive: 'true',
    Fields: 'Overview,ProductionYear,CommunityRating,RunTimeTicks,ProviderIds,UserData',
    SortBy: 'DatePlayed',
    SortOrder: 'Descending',
  })
}

export async function findJellyfinByTmdb(
  config: JellyfinConfig,
  tmdbId: number,
  type: 'movie' | 'tv'
): Promise<JellyfinItem | null> {
  const userId = await resolveJellyfinUser(config)
  const include = type === 'movie' ? 'Movie' : 'Series,Episode'
  const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(config, `/Users/${userId}/Items`, {
    Recursive: 'true',
    IncludeItemTypes: include,
    AnyProviderIdEquals: `Tmdb.${tmdbId}`,
    Limit: '5',
    Fields: 'ProviderIds,UserData,RunTimeTicks',
  })
  return data?.Items?.[0] || null
}

export async function getJellyfinResume(config: JellyfinConfig, limit = 16): Promise<JellyfinItem[]> {
  const userId = await resolveJellyfinUser(config)
  const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(config, `/Users/${userId}/Items/Resume`, {
    Limit: String(limit),
    Fields: 'ProviderIds,UserData,RunTimeTicks,Overview',
  })
  return data?.Items || []
}

export function jellyfinImage(config: JellyfinConfig, itemId: string) {
  return `${baseUrl(config.url)}/Items/${itemId}/Images/Primary?api_key=${encodeURIComponent(config.apiKey)}`
}

export async function reportJellyfinProgress(
  config: JellyfinConfig,
  tmdbId: number,
  type: 'movie' | 'tv',
  positionSec: number,
  durationSec: number,
  paused: boolean
) {
  const item = await findJellyfinByTmdb(config, tmdbId, type)
  if (!item) return false
  const userId = await resolveJellyfinUser(config)
  const ticks = Math.max(0, Math.floor(positionSec * 10_000_000))
  await jellyfinFetch(config, `/Users/${userId}/PlayingItems/${item.Id}/Progress`, {}, {
    method: 'POST',
    body: JSON.stringify({
      PositionTicks: ticks,
      IsPaused: paused,
      PlayedPercentage: durationSec > 0 ? Math.min(100, (positionSec / durationSec) * 100) : 0,
    }),
  })
  return true
}
