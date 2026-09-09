/** PocketBase client for MFY watch progress. Collection: mfy_progress */

export type PbCfg = {
  url: string
  email: string
  password?: string
  token?: string
  userId?: string
}

export type PbRow = {
  mediaId: string
  mediaType?: string
  season?: number
  episode?: number
  progress: number
  duration: number
  title?: string
  posterPath?: string | null
  completed?: boolean
  watchedAt?: string
  profileId?: string
}

const CFG = 'mfy-pocketbase'

export function pbGet(): PbCfg {
  try {
    return JSON.parse(localStorage.getItem(CFG) || '{}')
  } catch {
    return { url: '', email: '' }
  }
}

export function pbSet(c: Partial<PbCfg>) {
  const next = { ...pbGet(), ...c }
  try { localStorage.setItem(CFG, JSON.stringify(next)) } catch {}
  return next
}

function base() {
  return String(pbGet().url || '').replace(/\/+$/, '')
}

async function req(path: string, init: RequestInit = {}) {
  const cfg = pbGet()
  const url = `${base()}${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any) }
  if (cfg.token) headers.Authorization = cfg.token
  const r = await fetch(url, { ...init, headers })
  const text = await r.text()
  let j: any = {}
  try { j = text ? JSON.parse(text) : {} } catch { j = { message: text } }
  if (!r.ok) throw new Error(j?.message || `PocketBase ${r.status}`)
  return j
}

export async function pbLogin(url: string, email: string, password: string) {
  pbSet({ url: url.replace(/\/+$/, ''), email, password })
  const j = await req('/api/collections/users/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ identity: email, password }),
  })
  pbSet({ token: j.token, userId: j.record?.id, password: '' })
  return j.record
}

export async function pbRefresh() {
  const cfg = pbGet()
  if (!cfg.token) return null
  try {
    const j = await req('/api/collections/users/auth-refresh', { method: 'POST' })
    pbSet({ token: j.token, userId: j.record?.id })
    return j.record
  } catch {
    if (cfg.email && cfg.password) return pbLogin(cfg.url, cfg.email, cfg.password)
    return null
  }
}

function keyFilter(row: PbRow) {
  const uid = pbGet().userId || ''
  return `user="${uid}" && mediaId="${String(row.mediaId).replace(/"/g, '')}" && season=${Number(row.season || 0)} && episode=${Number(row.episode || 0)}`
}

export async function pbUpsert(row: PbRow) {
  const cfg = pbGet()
  if (!cfg.url || !cfg.token) return false
  const body = {
    user: cfg.userId,
    mediaId: String(row.mediaId),
    mediaType: row.mediaType || 'tv',
    season: Number(row.season || 0),
    episode: Number(row.episode || 0),
    progress: Number(row.progress || 0),
    duration: Number(row.duration || 0),
    title: row.title || '',
    posterPath: row.posterPath || '',
    completed: !!row.completed,
    watchedAt: row.watchedAt || new Date().toISOString(),
    profileId: row.profileId || 'default',
  }
  const found = await req(`/api/collections/mfy_progress/records?filter=${encodeURIComponent(keyFilter(row))}&perPage=1`)
  const id = found?.items?.[0]?.id
  if (id) {
    const prev = found.items[0]
    if (Number(prev.progress || 0) > body.progress) body.progress = Number(prev.progress)
    if (Number(prev.duration || 0) > body.duration) body.duration = Number(prev.duration)
    await req(`/api/collections/mfy_progress/records/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
  } else {
    await req('/api/collections/mfy_progress/records', { method: 'POST', body: JSON.stringify(body) })
  }
  return true
}

export async function pbPull(): Promise<PbRow[]> {
  const cfg = pbGet()
  if (!cfg.url || !cfg.token) return []
  const uid = cfg.userId || ''
  const j = await req(`/api/collections/mfy_progress/records?filter=${encodeURIComponent(`user="${uid}"`)}&perPage=200`)
  return (j.items || []).map((x: any) => ({
    mediaId: String(x.mediaId),
    mediaType: x.mediaType,
    season: Number(x.season || 0),
    episode: Number(x.episode || 0),
    progress: Number(x.progress || 0),
    duration: Number(x.duration || 0),
    title: x.title,
    posterPath: x.posterPath || null,
    completed: !!x.completed,
    watchedAt: x.watchedAt,
    profileId: x.profileId,
  }))
}
