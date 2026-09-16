const SIMKL = 'https://api.simkl.com'
const APP = 'mfy'
const VER = '1.7.4'

export function simklReady(clientId?: string, token?: string) {
  return Boolean(clientId && clientId.length > 8 && token && token.length > 8)
}

async function simklFetch<T>(
  path: string,
  clientId: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  const url = new URL(SIMKL + path)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('app-name', APP)
  url.searchParams.set('app-version', VER)
  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `${APP}/${VER}`,
      'simkl-api-key': clientId,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`Simkl ${res.status}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export async function simklStartPin(clientId: string): Promise<{
  user_code: string
  verification_url: string
  expires_in: number
  interval: number
}> {
  return simklFetch('/oauth/pin', clientId)
}

export async function simklPollPin(clientId: string, userCode: string): Promise<{ access_token?: string; result?: string }> {
  return simklFetch(`/oauth/pin/${encodeURIComponent(userCode)}`, clientId)
}

export async function simklCheckin(
  clientId: string,
  token: string,
  tmdbId: number,
  type: 'movie' | 'tv',
  progressPct: number
) {
  const body =
    type === 'movie'
      ? { movie: { ids: { tmdb: tmdbId } }, progress: Math.round(progressPct) }
      : { show: { ids: { tmdb: tmdbId } }, progress: Math.round(progressPct) }
  try {
    await simklFetch('/scrobble/checkin', clientId, token, { method: 'POST', body: JSON.stringify(body) })
  } catch (e) {
    console.warn('[simkl] checkin', e)
  }
}

export async function simklHistory(clientId: string, token: string) {
  try {
    return await simklFetch<any>('/sync/all-items/movies,shows', clientId, token)
  } catch (e) {
    console.warn('[simkl] history', e)
    return null
  }
}
