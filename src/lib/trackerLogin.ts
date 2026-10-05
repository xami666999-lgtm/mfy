function b64url(bytes: Uint8Array) {
  let s = ''
  bytes.forEach((b) => { s += String.fromCharCode(b) })
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function challenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64url(new Uint8Array(digest))
}

export function redirectUri() {
  return `${location.origin}${location.pathname}`
}

export function anilistClientId() {
  try { return localStorage.getItem('mfy-anilist-client') || '' } catch { return '' }
}

export function startAnilistLogin(clientId = anilistClientId()) {
  if (!clientId) throw new Error('Add an AniList client ID first. Create one at anilist.co/settings/developer and set the redirect to this site.')
  try { localStorage.setItem('mfy-anilist-client', clientId) } catch {}
  const url = `https://anilist.co/api/v2/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri())}`
  location.assign(url)
}

export async function startSimklLogin(clientId: string) {
  if (!clientId) throw new Error('Add a Simkl client ID from simkl.com/settings/developer. Redirect must be this site. Scope media:write.')
  try { localStorage.setItem('mfy-simkl-client', clientId) } catch {}
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)))
  sessionStorage.setItem('mfy-simkl-verifier', verifier)
  sessionStorage.setItem('mfy-simkl-client', clientId)
  const codeChallenge = await challenge(verifier)
  const url = `https://simkl.com/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri())}&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=${encodeURIComponent('media:read media:write')}&state=mfy`
  location.assign(url)
}

export async function consumeTrackerReturn() {
  const hash = new URLSearchParams((location.hash || '').replace(/^#/, ''))
  const access = hash.get('access_token')
  if (access) {
    try { localStorage.setItem('mfy-anilist-token', access) } catch {}
    history.replaceState(null, '', location.pathname + location.search)
    return 'anilist'
  }
  const q = new URLSearchParams(location.search)
  const code = q.get('code')
  const verifier = sessionStorage.getItem('mfy-simkl-verifier')
  const client = sessionStorage.getItem('mfy-simkl-client') || localStorage.getItem('mfy-simkl-client') || ''
  if (!code || !verifier || !client) return ''
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: client,
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  })
  const res = await fetch('https://api.simkl.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await res.json().catch(() => ({} as { access_token?: string; error?: string }))
  sessionStorage.removeItem('mfy-simkl-verifier')
  history.replaceState(null, '', location.pathname)
  if (!res.ok || !data.access_token) {
    try { sessionStorage.setItem('mfy-tracker-error', 'Simkl refused the sign-in. The client ID has to allow this exact page as the redirect.') } catch {}
    return ''
  }
  try { localStorage.setItem('mfy-simkl-token', data.access_token) } catch {}
  history.replaceState(null, '', location.pathname)
  return 'simkl'
}
