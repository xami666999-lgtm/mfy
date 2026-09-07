import fs from 'fs'
import os from 'os'
import path from 'path'
import { app } from 'electron'

export type ProgressRow = {
  mediaId: string
  mediaType?: string
  season?: number
  episode?: number
  progress: number
  duration: number
  completed?: boolean
  seriesCompleted?: boolean
  title?: string
  posterPath?: string | null
  watchedAt?: string
  profileId?: string
  email?: string
}

type FileShape = { updatedAt: string; items: Record<string, ProgressRow> }

function keyOf(r: Pick<ProgressRow, 'mediaId' | 'mediaType' | 'season' | 'episode'>) {
  return `${r.mediaType || 'tv'}|${String(r.mediaId)}|${Number(r.season || 0)}|${Number(r.episode || 0)}`
}

function paths() {
  const home = os.homedir()
  return [
    path.join(home, 'MFY-watch.json'),
    path.join(home, 'Documents', 'MFY', 'watch.json'),
    path.join(app.getPath('appData'), 'MFY', 'watch.json'),
    path.join(app.getPath('userData'), 'watch.json'),
  ]
}

function readFile(p: string): FileShape {
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const j = JSON.parse(raw)
    if (j && typeof j.items === 'object') return { updatedAt: j.updatedAt || '', items: j.items }
    if (Array.isArray(j)) {
      const items: Record<string, ProgressRow> = {}
      for (const row of j) items[keyOf(row)] = row
      return { updatedAt: '', items }
    }
  } catch {}
  return { updatedAt: '', items: {} }
}

function writeFile(p: string, data: FileShape) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    const tmp = p + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data), { encoding: 'utf8' })
    const fd = fs.openSync(tmp, 'r+')
    try { fs.fsyncSync(fd) } catch {}
    fs.closeSync(fd)
    fs.renameSync(tmp, p)
  } catch {}
}

function reallyDone(row?: ProgressRow) {
  if (!row) return false
  const p = Number(row.progress) || 0
  const d = Number(row.duration) || 0
  return d >= 10 * 60 && p / d >= 0.95
}

function better(a?: ProgressRow, b?: ProgressRow): ProgressRow {
  const x = a || { mediaId: '', progress: 0, duration: 0 }
  const y = b || { mediaId: '', progress: 0, duration: 0 }
  const progress = Math.max(Number(x.progress) || 0, Number(y.progress) || 0)
  const duration = Math.max(Number(x.duration) || 0, Number(y.duration) || 0)
  const merged: ProgressRow = {
    ...x,
    ...y,
    mediaId: String(y.mediaId || x.mediaId),
    mediaType: y.mediaType || x.mediaType,
    season: y.season ?? x.season,
    episode: y.episode ?? x.episode,
    progress,
    duration,
    title: y.title || x.title,
    posterPath: y.posterPath || x.posterPath || null,
    profileId: y.profileId || x.profileId,
    email: y.email || x.email,
    watchedAt: (Date.parse(y.watchedAt || '') || 0) >= (Date.parse(x.watchedAt || '') || 0) ? y.watchedAt : x.watchedAt,
    seriesCompleted: !!(x.seriesCompleted || y.seriesCompleted),
    completed: false,
  }
  merged.completed = reallyDone(merged)
  return merged
}

export function loadAllProgress() {
  const items: Record<string, ProgressRow> = {}
  for (const f of paths()) {
    for (const row of Object.values(readFile(f).items || {})) {
      const k = keyOf(row)
      items[k] = better(items[k], row)
    }
  }
  return Object.values(items).filter((r) => Number(r.progress) > 5)
}

export function saveProgressRow(row: ProgressRow) {
  if (!row?.mediaId) return false
  if (!(Number(row.progress) > 5)) {
    const existing = loadAllProgress().find((r) => keyOf(r) === keyOf(row))
    if (existing) row = better(existing, { ...row, progress: existing.progress })
    else return false
  }
  const k = keyOf(row)
  for (const f of paths()) {
    const data = readFile(f)
    data.items[k] = better(data.items[k], row)
    data.updatedAt = new Date().toISOString()
    writeFile(f, data)
  }
  return true
}

export function saveProgressList(rows: ProgressRow[], email?: string, profileId?: string) {
  for (const r of rows || []) saveProgressRow({ ...r, email: r.email || email, profileId: r.profileId || profileId })
  return true
}
