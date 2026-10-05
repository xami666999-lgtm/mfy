const TOKEN_KEY = 'mfy-github-token'
const GIST_KEY = 'mfy-github-gist'

export function githubToken() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

export function saveGithubToken(token: string) {
  const next = token.trim()
  try {
    if (next) localStorage.setItem(TOKEN_KEY, next)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

function authHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${githubToken()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function gh(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers || {}) } })
  const data = await res.json().catch(() => ({} as { message?: string }))
  if (!res.ok) throw new Error(data.message || `GitHub ${res.status}`)
  return data as any
}

let timer = 0
export function scheduleProgressPush(rows: unknown[]) {
  if (!githubToken()) return
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { void pushProgress(rows).catch(() => {}) }, 4000)
}

export async function pushProgress(rows: unknown[]) {
  if (!githubToken()) throw new Error('Add a GitHub token first.')
  const content = JSON.stringify({ watchHistory: rows, savedAt: new Date().toISOString() })
  let id = ''
  try { id = localStorage.getItem(GIST_KEY) || '' } catch {}
  if (!id) {
    const created = await gh('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description: 'MFY watch progress',
        public: false,
        files: { 'mfy-progress.json': { content } },
      }),
    })
    try { localStorage.setItem(GIST_KEY, created.id) } catch {}
    return created.id as string
  }
  await gh(`/gists/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ files: { 'mfy-progress.json': { content } } }),
  })
  return id
}

export async function pullProgress(): Promise<any[] | null> {
  if (!githubToken()) return null
  let id = ''
  try { id = localStorage.getItem(GIST_KEY) || '' } catch {}
  if (!id) {
    const list = await gh('/gists?per_page=30')
    const found = (Array.isArray(list) ? list : []).find((g: any) => g.description === 'MFY watch progress' || g.files?.['mfy-progress.json'])
    if (!found?.id) return null
    id = found.id
    try { localStorage.setItem(GIST_KEY, id) } catch {}
  }
  const gist = await gh(`/gists/${id}`)
  const file = gist.files?.['mfy-progress.json']
  let raw = file?.content || ''
  if (!raw && file?.raw_url) raw = await (await fetch(file.raw_url)).text()
  if (!raw) return null
  const data = JSON.parse(raw)
  return Array.isArray(data) ? data : (data.watchHistory || null)
}
