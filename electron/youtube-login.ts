import { BrowserWindow, ipcMain, session } from 'electron'
import Store from 'electron-store'

const YT_PART = 'persist:youtube'

function isSignedInCookies(cookies: Electron.Cookie[]) {
  return cookies.some((c) => /SID|LOGIN_INFO|SAPISID/i.test(c.name))
}

export function setupYouTubeLogin(store: Store, getMain: () => BrowserWindow | null) {
  try {
    session.fromPartition(YT_PART).setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )
  } catch {}

  ipcMain.handle('youtube-login-status', async () => {
    try {
      const cookies = await session.fromPartition(YT_PART).cookies.get({ domain: '.youtube.com' })
      const signedIn = isSignedInCookies(cookies)
      store.set('youtubeSignedIn', signedIn)
      return { signedIn }
    } catch {
      return { signedIn: Boolean(store.get('youtubeSignedIn')) }
    }
  })

  ipcMain.handle('youtube-login', async () => {
    const parent = getMain()
    const win = new BrowserWindow({
      width: 980,
      height: 740,
      parent: parent || undefined,
      modal: false,
      title: 'Sign in to YouTube',
      backgroundColor: '#0f0f0f',
      webPreferences: {
        partition: YT_PART,
        nodeIntegration: false,
        contextIsolation: true,
      },
    })
    win.webContents.setWindowOpenHandler((details) => {
      const url = String(details.url || '')
      if (/accounts\.google|google\.com|youtube\.com|gstatic\.com/i.test(url)) {
        return { action: 'allow' }
      }
      return { action: 'deny' }
    })
    await win.loadURL('https://accounts.google.com/ServiceLogin?service=youtube&continue=https://www.youtube.com/')
    return await new Promise<{ signedIn: boolean }>((resolve) => {
      win.on('closed', async () => {
        try {
          const cookies = await session.fromPartition(YT_PART).cookies.get({ domain: '.youtube.com' })
          const signedIn = isSignedInCookies(cookies)
          store.set('youtubeSignedIn', signedIn)
          resolve({ signedIn })
        } catch {
          resolve({ signedIn: false })
        }
      })
    })
  })
}

export function allowYouTubeNavigation(contents: Electron.WebContents, url: string) {
  try {
    if (contents.session?.partition === YT_PART) return true
  } catch {}
  return /accounts\.google|youtube\.com\/|youtu\.be\//i.test(url || '')
}
