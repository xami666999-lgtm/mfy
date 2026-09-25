import { app, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import https from 'https'
import { spawn, type ChildProcess } from 'child_process'

const PORT = 8096
let child: ChildProcess | null = null
let lastLog = ''

export function jellyfinPaths() {
  const root = path.join(app.getPath('userData'), 'jellyfin')
  return {
    root,
    serverDir: path.join(root, 'server'),
    dataDir: path.join(root, 'data'),
    pluginDir: path.join(root, 'data', 'plugins'),
    exe: path.join(root, 'server', 'jellyfin.exe'),
  }
}

function download(url: string, dest?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const go = (u: string, hops = 0) => {
      if (hops > 8) return reject(new Error('too many redirects'))
      https.get(u, { headers: { 'User-Agent': 'MFY-JellyfinSidecar' } }, (res) => {
        const loc = res.headers.location
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && loc) {
          res.resume()
          return go(loc.startsWith('http') ? loc : new URL(loc, u).toString(), hops + 1)
        }
        if ((res.statusCode || 0) >= 400) return reject(new Error('http ' + res.statusCode))
        if (dest) {
          const out = fs.createWriteStream(dest)
          res.pipe(out)
          out.on('finish', () => resolve(dest))
          out.on('error', reject)
        } else {
          const chunks: Buffer[] = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        }
      }).on('error', reject)
    }
    go(url)
  })
}

function ensureDirs() {
  const p = jellyfinPaths()
  fs.mkdirSync(p.serverDir, { recursive: true })
  fs.mkdirSync(p.dataDir, { recursive: true })
  fs.mkdirSync(p.pluginDir, { recursive: true })
  return p
}

async function latestWindowsZip(): Promise<string> {
  const raw = await download('https://api.github.com/repos/jellyfin/jellyfin/releases/latest')
  const json = JSON.parse(raw)
  const asset = (json.assets || []).find((a: any) => /windows-x64\.zip$/i.test(a.name) && !/debug/i.test(a.name))
  if (!asset?.browser_download_url) throw new Error('No Windows x64 Jellyfin zip on the latest GitHub release')
  return asset.browser_download_url
}

export async function ensureJellyfinServer(onStatus?: (s: string) => void) {
  const p = ensureDirs()
  if (fs.existsSync(p.exe)) return p
  onStatus?.('Downloading Jellyfin Server (Windows x64)…')
  const url = await latestWindowsZip()
  const zip = path.join(p.root, 'jellyfin-win.zip')
  await download(url, zip)
  onStatus?.('Extracting Jellyfin…')
  await new Promise<void>((resolve, reject) => {
    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -Force -Path "${zip}" -DestinationPath "${p.serverDir}"`], { windowsHide: true })
    ps.on('exit', (code) => code === 0 ? resolve() : reject(new Error('unzip failed ' + code)))
    ps.on('error', reject)
  })
  const nested = findExe(p.serverDir)
  if (nested && nested !== p.exe) {
    // keep nested layout; point exe at whatever we found
  }
  if (!findExe(p.serverDir)) throw new Error('jellyfin.exe missing after extract')
  try { fs.unlinkSync(zip) } catch {}
  return p
}

function findExe(dir: string): string | null {
  const direct = path.join(dir, 'jellyfin.exe')
  if (fs.existsSync(direct)) return direct
  try {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      if (fs.statSync(full).isDirectory()) {
        const hit = findExe(full)
        if (hit) return hit
      }
    }
  } catch {}
  return null
}

export function sidecarStatus() {
  const p = jellyfinPaths()
  const exe = findExe(p.serverDir)
  return {
    running: !!(child && !child.killed && child.exitCode == null),
    pid: child?.pid || null,
    port: PORT,
    url: `http://127.0.0.1:${PORT}`,
    installed: !!exe,
    exe: exe || p.exe,
    pluginDir: p.pluginDir,
    dataDir: p.dataDir,
    log: lastLog,
    plugins: listPluginNames(p.pluginDir),
  }
}

function listPluginNames(dir: string) {
  try {
    return fs.readdirSync(dir).filter((n) => {
      const full = path.join(dir, n)
      try { return fs.statSync(full).isDirectory() || /\.(dll|zip)$/i.test(n) } catch { return false }
    })
  } catch {
    return []
  }
}

export async function startSidecar(onStatus?: (s: string) => void) {
  if (sidecarStatus().running) return sidecarStatus()
  const p = await ensureJellyfinServer(onStatus)
  const exe = findExe(p.serverDir)
  if (!exe) throw new Error('jellyfin.exe not found')
  fs.mkdirSync(p.pluginDir, { recursive: true })
  lastLog = 'starting'
  child = spawn(exe, ['--datadir', p.dataDir, '--nologo'], {
    cwd: path.dirname(exe),
    windowsHide: true,
    env: { ...process.env, JELLYFIN_kestrel__socketBinding__0: `http://127.0.0.1:${PORT}` },
  })
  child.stdout?.on('data', (d) => { lastLog = String(d).slice(-400) })
  child.stderr?.on('data', (d) => { lastLog = String(d).slice(-400) })
  child.on('exit', () => { child = null })
  onStatus?.('Jellyfin starting on http://127.0.0.1:8096')
  return sidecarStatus()
}

export function stopSidecar() {
  try { child?.kill() } catch {}
  child = null
  lastLog = 'stopped'
  return sidecarStatus()
}

export async function installPluginFromFile(filePath: string) {
  const p = ensureDirs()
  const base = path.basename(filePath)
  const dest = path.join(p.pluginDir, base)
  fs.copyFileSync(filePath, dest)
  if (/\.zip$/i.test(base)) {
    const folder = path.join(p.pluginDir, base.replace(/\.zip$/i, ''))
    fs.mkdirSync(folder, { recursive: true })
    await new Promise<void>((resolve, reject) => {
      const ps = spawn('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -Force -Path "${dest}" -DestinationPath "${folder}"`], { windowsHide: true })
      ps.on('exit', (code) => code === 0 ? resolve() : reject(new Error('plugin unzip failed')))
      ps.on('error', reject)
    })
  }
  if (sidecarStatus().running) {
    stopSidecar()
    await startSidecar()
  }
  return sidecarStatus()
}

export async function installPluginFromUrl(url: string) {
  const p = ensureDirs()
  const name = path.basename(new URL(url).pathname) || 'plugin.zip'
  const dest = path.join(p.pluginDir, name)
  await download(url, dest)
  return installPluginFromFile(dest)
}

export async function pickPluginFile() {
  const res = await dialog.showOpenDialog({
    title: 'Install Jellyfin plugin',
    properties: ['openFile'],
    filters: [
      { name: 'Jellyfin plugin', extensions: ['zip', 'dll'] },
      { name: 'All', extensions: ['*'] },
    ],
  })
  const file = res.filePaths[0]
  if (!file) return sidecarStatus()
  return installPluginFromFile(file)
}

export function openDashboard() {
  return shell.openExternal(`http://127.0.0.1:${PORT}`)
}

export function openPluginFolder() {
  const p = ensureDirs()
  return shell.openPath(p.pluginDir)
}
