import { BrowserWindow } from 'electron'

const POPUP = 'https://xami666999-lgtm.github.io/mfy/google.html'

export function openGoogleLogin(parent: BrowserWindow | null): Promise<{ sub: string; email: string; name: string; picture: string }> {
  const win = new BrowserWindow({
    width: 480,
    height: 640,
    parent: parent || undefined,
    modal: Boolean(parent),
    title: 'Sign in with Google',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  })
  win.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  )
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/accounts\.google\.com|googleusercontent\.com|gstatic\.com/i.test(url)) return { action: 'allow' }
    return { action: 'deny' }
  })
  return new Promise((resolve, reject) => {
    let settled = false
    const finish = (user: { sub: string; email: string; name: string; picture: string } | null, error?: string) => {
      if (settled) return
      settled = true
      if (user) resolve(user)
      else reject(new Error(error || 'Google sign-in was closed.'))
      if (!win.isDestroyed()) win.close()
    }
    const readTitle = (title: string) => {
      if (!title.startsWith('mfy-auth:')) return
      try {
        const json = Buffer.from(title.slice(9), 'base64').toString('utf8')
        finish(JSON.parse(json))
      } catch {
        finish(null, 'Google did not return an account.')
      }
    }
    win.on('page-title-updated', (_event, title) => readTitle(title))
    win.on('closed', () => finish(null))
    win.loadURL(POPUP).catch(() => finish(null, 'Could not open Google.'))
  })
}
