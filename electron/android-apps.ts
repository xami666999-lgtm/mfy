import { dialog, shell } from 'electron'
import { execFile, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

type AppKey = 'sportzx' | 'ak47'

const HINTS: Record<AppKey, string[]> = {
  sportzx: ['sportzx', 'sportz', 'spx'],
  ak47: ['ak47', 'ak-47', 'ak_47'],
}

function run(cmd: string, args: string[], timeout = 25000): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, windowsHide: true }, (err, stdout, stderr) => {
      resolve({ code: err ? 1 : 0, out: `${stdout || ''}\n${stderr || ''}` })
    })
  })
}

function exists(p: string) {
  try { return fs.existsSync(p) } catch { return false }
}

function findAdb(): string | null {
  const home = os.homedir()
  const cands = [
    'adb',
    path.join(home, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
    'C:\\platform-tools\\adb.exe',
    'C:\\Android\\platform-tools\\adb.exe',
    'C:\\Program Files\\BlueStacks_nxt\\HD-Adb.exe',
    'C:\\Program Files\\BlueStacks\\HD-Adb.exe',
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'BlueStacks_nxt', 'HD-Adb.exe'),
  ]
  for (const c of cands) {
    if (c === 'adb') continue
    if (exists(c)) return c
  }
  return 'adb'
}

function findBlueStacks(): string | null {
  const cands = [
    'C:\\Program Files\\BlueStacks_nxt\\HD-Player.exe',
    'C:\\Program Files\\BlueStacks\\HD-Player.exe',
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'BlueStacks_nxt', 'HD-Player.exe'),
  ]
  return cands.find(exists) || null
}

async function connectAdb(adb: string) {
  for (const port of ['58526', '5555', '5554', '5037']) {
    await run(adb, ['connect', `127.0.0.1:${port}`], 8000)
  }
}

async function listPackages(adb: string): Promise<string[]> {
  const { out } = await run(adb, ['shell', 'pm', 'list', 'packages'], 20000)
  return out.split(/\r?\n/).map((l) => l.replace(/^package:/, '').trim()).filter(Boolean)
}

function matchPkg(pkgs: string[], key: AppKey): string | null {
  const hints = HINTS[key]
  const hit = pkgs.find((p) => hints.some((h) => p.toLowerCase().includes(h)))
  return hit || null
}

function dockWindow(titleHint: string) {
  const ps = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class W {
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc lp, IntPtr l);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
}
"@
$hint = '${titleHint.replace(/'/g, '')}'
$found = $null
[W]::EnumWindows({ param($h,$l)
  $sb = New-Object System.Text.StringBuilder 256
  [void][W]::GetWindowText($h, $sb, 256)
  $t = $sb.ToString()
  if ($t -and ($t -match $hint -or $t -match 'BlueStacks' -or $t -match 'Subsystem for Android' -or $t -match 'WSA')) { $script:found = $h; return $false }
  return $true
}, [IntPtr]::Zero)
if ($found) { [W]::ShowWindow($found, 3); [W]::SetForegroundWindow($found) }
`
  spawn('powershell.exe', ['-NoProfile', '-Command', ps], { windowsHide: true, detached: true }).unref()
}

export async function launchAndroidApp(key: AppKey) {
  const adb = findAdb()
  const bs = findBlueStacks()
  if (bs) {
    try { spawn(bs, [], { detached: true, stdio: 'ignore' }).unref() } catch {}
  }

  if (adb) {
    await connectAdb(adb)
    let pkgs = await listPackages(adb)
    let pkg = matchPkg(pkgs, key)
    if (!pkg) {
      const pick = await dialog.showOpenDialog({
        title: `Install ${key === 'sportzx' ? 'SportzX' : 'AK47'} APK`,
        filters: [{ name: 'Android package', extensions: ['apk'] }],
        properties: ['openFile'],
      })
      const apk = pick.filePaths?.[0]
      if (apk) {
        const inst = await run(adb, ['install', '-r', apk], 120000)
        if (inst.code !== 0 && !/success/i.test(inst.out)) {
          return { ok: false, reason: inst.out.slice(0, 300) || 'adb install failed. Enable WSA Developer mode or BlueStacks ADB.' }
        }
        pkgs = await listPackages(adb)
        pkg = matchPkg(pkgs, key) || pkgs[pkgs.length - 1]
      }
    }
    if (pkg) {
      await run(adb, ['shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1'], 15000)
      dockWindow(key === 'sportzx' ? 'Sportz' : 'AK47')
      return { ok: true, pkg, via: 'adb' }
    }
  }

  if (bs) {
    dockWindow('BlueStacks')
    return { ok: true, via: 'bluestacks', reason: 'Opened BlueStacks. Install the APK there if it is not installed yet.' }
  }

  await shell.openExternal(key === 'sportzx' ? 'https://sportzx.org/sportzx-app-8/' : 'https://www.ak47sports.net')
  return {
    ok: false,
    reason: 'No WSA/BlueStacks ADB found. Install Windows Subsystem for Android or BlueStacks, turn on ADB, then pick the APK.',
  }
}
