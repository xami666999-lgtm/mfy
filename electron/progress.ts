import fs from 'fs'
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

type FileShape = {
  updatedAt: string
  items: Record<string, ProgressRow>
}

function keyOf(r: Pick<ProgressRow, 'mediaId' | 'mediaType' | 'season' | 'episode' | 'profileId' | 'email'>) {
  const who = String(r.email || r.profileId || 'default')
  return `${who}|${r.mediaType || 'tv'}|${r.mediaId}|${Number(r.season || 0)}|${Number(r.episode || 0)}`
}

function userDataFile() {
  return path.join(app.getPath('userData'), 'progress.json')
}

function documentsFile(email?: string) {
  const dir = path.join(app.getPath('documents'), 'MFY')
  try { fs.mkdirSync(dir, { recursive: true }) } catch {}
  const name = email ? `progress-${email.replace(/[^a-z0-9.@_-]/gi, '_')}.json` : 'progress.json'
  return path.join(dir, name)
}

function readFile(p: string): FileShape {
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const j = JSON.parse(raw)
    if (j && typeof j.items === 'object') return { updatedAt: j.updatedAt || '', items: j.items }
  } catch {}
  return { updatedAt: '', items: {} }
}

function writeFile(p: string, data: FileShape) {
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    const tmp = p + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
    fs.renameSync(tmp, p)
  } catch {}
}

function better(a?: ProgressRow, b?: ProgressRow): ProgressRow {
  const x = a || { mediaId: '', progress: 0, duration: 0 }
  const y = b || { mediaId: '', progress: 0, duration: 0 }
  const progress = Math.max(Number(x.progress) || 0, Number(y.progress) || 0)
  const duration = Math.max(Number(x.duration) || 0, Number(y.duration) || 0)
  return {
    ...x,
    ...y,
    mediaId: String(y.mediaId || x.mediaId),
    progress,
    duration,
    completed: !!(x.completed || y.completed),
    seriesCompleted: !!(x.seriesCompleted || y.seriesCompleted),
    title: y.title || x.title,
    posterPath: y.posterPath || x.posterPath || null,
    watchedAt: (Date.parse(y.watchedAt || '') || 0) >= (Date.parse(x.watchedAt || '') || 0) ? y.watchedAt : x.watchedAt,
  }
}

export function loadAllProgress(email?: string, profileId?: string) {
  const files = [userDataFile(), documentsFile(), documentsFile(email)]
  const items: Record<string, ProgressRow> = {}
  for (const f of files) {
    const data = readFile(f)
    for (const [k, row] of Object.entries(data.items || {})) {
      items[k] = better(items[k], row)
    }
  }
  return Object.values(items).filter((r) => !email && !profileId
    ? true
    : String(r.email || '') === String(email || '') || String(r.profileId || '') === String(profileId || '') || !r.email)
}

export function saveProgressRow(row: ProgressRow) {
  const k = keyOf(row)
  const files = [userDataFile(), documentsFile(), documentsFile(row.email)]
  for (const f of files) {
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
