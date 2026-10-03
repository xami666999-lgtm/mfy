export type GoogleUser = { sub: string; email: string; name: string; picture: string }

const CLIENT_URL = 'https://xami666999-lgtm.github.io/mfy/google-client.json'

type Gis = {
  accounts: {
    id: {
      initialize: (opts: { client_id: string; callback: (resp: { credential: string }) => void }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
      prompt: () => void
    }
  }
}

let gisPromise: Promise<Gis> | null = null

export async function googleClientId(): Promise<string> {
  const fromEnv = (import.meta as { env?: { VITE_GOOGLE_CLIENT_ID?: string } }).env?.VITE_GOOGLE_CLIENT_ID
  if (fromEnv && fromEnv.length > 12) return fromEnv
  try {
    const local = await fetch(new URL('google-client.json', document.baseURI).toString(), { cache: 'no-store' })
    if (local.ok) {
      const json = await local.json()
      if (json?.clientId) return String(json.clientId)
    }
  } catch {}
  try {
    const remote = await fetch(CLIENT_URL, { cache: 'no-store' })
    if (remote.ok) {
      const json = await remote.json()
      if (json?.clientId) return String(json.clientId)
    }
  } catch {}
  return ''
}

export function decodeCredential(credential: string): GoogleUser {
  const part = credential.split('.')[1] || ''
  const pad = part.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(escape(atob(pad + '='.repeat((4 - (pad.length % 4)) % 4))))
  const payload = JSON.parse(json) as { sub?: string; email?: string; name?: string; picture?: string; aud?: string }
  if (!payload.email) throw new Error('Google did not return an email.')
  return {
    sub: payload.sub || payload.email,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    picture: payload.picture || '',
  }
}

function loadGis(): Promise<Gis> {
  const existing = (window as unknown as { google?: Gis }).google
  if (existing?.accounts?.id) return Promise.resolve(existing)
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      const google = (window as unknown as { google?: Gis }).google
      if (!google?.accounts?.id) reject(new Error('Google sign-in did not load.'))
      else resolve(google)
    }
    script.onerror = () => reject(new Error('Could not reach Google.'))
    document.head.appendChild(script)
  })
  return gisPromise
}

export async function renderGoogleButton(el: HTMLElement, onUser: (user: GoogleUser) => void) {
  const clientId = await googleClientId()
  if (!clientId) throw new Error('Google sign-in is not configured yet.')
  const google = await loadGis()
  google.accounts.id.initialize({
    client_id: clientId,
    callback: (resp) => {
      try { onUser(decodeCredential(resp.credential)) }
      catch (error) { console.error(error) }
    },
  })
  el.replaceChildren()
  google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    width: 320,
    logo_alignment: 'left',
  })
  google.accounts.id.prompt()
}
