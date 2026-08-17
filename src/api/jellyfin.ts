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
}

export async function jellyfinFetch<T>(config: JellyfinConfig, endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!config.url || !config.apiKey) throw new Error('Jellyfin URL and API key are required.')
  const base = config.url.replace(/\/$/, '')
  const query = new URLSearchParams(params)
  const response = await fetch(`${base}${endpoint}?${query}`, { headers: { 'X-Emby-Token': config.apiKey } })
  if (!response.ok) throw new Error(`Jellyfin request failed (${response.status}).`)
  return response.json()
}

export async function getJellyfinItems(config: JellyfinConfig, startIndex = 0, limit = 100): Promise<{ Items: JellyfinItem[]; TotalRecordCount: number }> {
  return jellyfinFetch(config, '/Items', {
    StartIndex: String(startIndex),
    Limit: String(limit),
    IncludeItemTypes: 'Movie,Series',
    Recursive: 'true',
    Fields: 'Overview,ProductionYear,CommunityRating,RunTimeTicks,ImageTags,BackdropImageTags',
    SortBy: 'SortName',
    SortOrder: 'Ascending',
  })
}
