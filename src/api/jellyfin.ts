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
  UserData?: { PlaybackPositionTicks?: number; PlayedPercentage?: number; Played?: boolean }
}

export interface JellyfinPlugin {
  Name?: string
  Id?: string
  Version?: string
  Status?: string
  Description?: string
}

function baseUrl(config: JellyfinConfig) {
  return String(config.url || '').replace(/\/$/, '')
}

export function jellyfinConfigFromStore(): JellyfinConfig | null {
  try {
    const url = localStorage.getItem('mfy-jellyfin-url') || ''
    const apiKey = localStorage.getItem('mfy-jellyfin-key') || ''
    const userId = localStorage.getItem('mfy-jellyfin-user') || ''
    if (!url || !apiKey) return null
    return { url, apiKey, userId: userId || undefined }
  } catch {
    return null
  }
}

export function persistJellyfin(cfg: { url: string; apiKey: string; userId?: string }) {
  try {
    localStorage.setItem('mfy-jellyfin-url', cfg.url.trim())
    localStorage.setItem('mfy-jellyfin-key', cfg.apiKey.trim())
    if (cfg.userId) localStorage.setItem('mfy-jellyfin-user', cfg.userId)
  } catch {}
}

export async function jellyfinFetch<T>(config: JellyfinConfig, endpoint: string, params: Record<string, string> = {}, method: 'GET' | 'POST' = 'GET'): Promise<T> {
  if (!config.url || !config.apiKey) throw new Error('Jellyfin URL and API key are required.')
  const base = baseUrl(config)
  const query = new URLSearchParams(params)
  const q = query.toString()
  const response = await fetch(`${base}${endpoint}${q ? `?${q}` : ''}`, {
    method,
    headers: {
      'X-Emby-Token': config.apiKey,
      'X-MediaBrowser-Token': config.apiKey,
    },
  })
  if (!response.ok) throw new Error(`Jellyfin request failed (${response.status}).`)
  const text = await response.text()
  if (!text) return {} as T
  try { return JSON.parse(text) as T } catch { return {} as T }
}

export async function getJellyfinSystem(config: JellyfinConfig) {
  return jellyfinFetch<{ ServerName?: string; Version?: string; Id?: string }>(config, '/System/Info')
}

export async function getJellyfinPlugins(config: JellyfinConfig): Promise<JellyfinPlugin[]> {
  const data = await jellyfinFetch<JellyfinPlugin[] | { Items?: JellyfinPlugin[] }>(config, '/Plugins')
  return Array.isArray(data) ? data : (data?.Items || [])
}

export async function getJellyfinUsers(config: JellyfinConfig) {
  return jellyfinFetch<{ Id: string; Name: string }[]>(config, '/Users')
}

export async function ensureUser(config: JellyfinConfig): Promise<JellyfinConfig> {
  if (config.userId) return config
  const users = await getJellyfinUsers(config).catch(() => [])
  const id = users?.[0]?.Id
  if (id) persistJellyfin({ ...config, userId: id })
  return { ...config, userId: id }
}

export async function getJellyfinItems(config: JellyfinConfig, startIndex = 0, limit = 40) {
  const cfg = await ensureUser(config)
  const path = cfg.userId ? `/Users/${cfg.userId}/Items` : '/Items'
  return jellyfinFetch<{ Items: JellyfinItem[]; TotalRecordCount: number }>(cfg, path, {
    StartIndex: String(startIndex),
    Limit: String(limit),
    IncludeItemTypes: 'Movie,Series',
    Recursive: 'true',
    Fields: 'Overview,ProductionYear,CommunityRating,RunTimeTicks,ImageTags,BackdropImageTags,ProviderIds',
    SortBy: 'DateLastContentAdded,SortName',
    SortOrder: 'Descending',
  })
}

export async function getJellyfinResume(config: JellyfinConfig, limit = 16) {
  const cfg = await ensureUser(config)
  const path = cfg.userId ? `/Users/${cfg.userId}/Items/Resume` : '/Items'
  return jellyfinFetch<{ Items: JellyfinItem[] }>(cfg, path, {
    Limit: String(limit),
    Recursive: 'true',
    Fields: 'Overview,UserData,ImageTags,BackdropImageTags,ProviderIds,RunTimeTicks',
  }).catch(async () => {
    if (!cfg.userId) return { Items: [] }
    return jellyfinFetch<{ Items: JellyfinItem[] }>(cfg, `/Users/${cfg.userId}/Items`, {
      Filters: 'IsResumable',
      Recursive: 'true',
      SortBy: 'DatePlayed',
      SortOrder: 'Descending',
      Limit: String(limit),
      Fields: 'UserData,ImageTags,BackdropImageTags,ProviderIds,RunTimeTicks',
    })
  })
}

export async function getJellyfinNextUp(config: JellyfinConfig, limit = 16) {
  const cfg = await ensureUser(config)
  if (!cfg.userId) return { Items: [] as JellyfinItem[] }
  return jellyfinFetch<{ Items: JellyfinItem[] }>(cfg, '/Shows/NextUp', {
    UserId: cfg.userId,
    Limit: String(limit),
    Fields: 'UserData,ImageTags,Overview,ProviderIds,RunTimeTicks',
  }).catch(() => ({ Items: [] }))
}

export function jellyfinImage(config: JellyfinConfig, item: JellyfinItem, kind: 'Primary' | 'Backdrop' = 'Primary') {
  const tag = kind === 'Backdrop' ? item.BackdropImageTags?.[0] : item.ImageTags?.[kind]
  if (!item.Id) return ''
  const q = tag ? `?tag=${encodeURIComponent(tag)}&quality=80` : '?quality=80'
  return `${baseUrl(config)}/Items/${item.Id}/Images/${kind}${q}`
}

export function jellyfinStreamUrl(config: JellyfinConfig, itemId: string) {
  const u = new URLSearchParams({
    static: 'true',
    api_key: config.apiKey,
  })
  return `${baseUrl(config)}/Videos/${itemId}/stream?${u}`
}

export async function jellyfinIntro(config: JellyfinConfig, itemId: string): Promise<{ IntroStart?: number; IntroEnd?: number } | null> {
  const tries = [
    `/Episode/${itemId}/IntroTimestamps/v1`,
    `/Episode/${itemId}/IntroTimestamps`,
    `/SkipIntro/IntroTimestamps`,
  ]
  for (const path of tries) {
    try {
      const data = await jellyfinFetch<any>(config, path, path.includes('SkipIntro') ? { id: itemId } : {})
      if (data && (data.IntroEnd || data.IntroStart || data.introduction)) return data
    } catch {}
  }
  return null
}

export function itemToMedia(item: JellyfinItem) {
  const tmdb = item.ProviderIds?.Tmdb || item.ProviderIds?.tmdb
  const type = item.Type === 'Movie' ? 'movie' : 'tv'
  return {
    id: tmdb || item.Id,
    jellyfinId: item.Id,
    type,
    title: item.Name,
    overview: item.Overview,
    source: 'jellyfin',
  }
}
