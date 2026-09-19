import { database } from './database'
import { execFile } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { app } from 'electron'

export type EmulatorCapability = 
  | 'save_states'
  | 'cheat_codes'
  | 'netplay'
  | 'rewind'
  | 'save_files'
  | 'memory_card'
  | 'controller_rumble'
  | 'cheat_database'

export type EmulatorProfile = {
  id: string
  name: string
  controller_profile_id?: string
  launch_args?: string
  stick_settings?: {
    dead_zone_left: number
    dead_zone_right: number
    dead_zone_up: number
    dead_zone_down: number
  }
  trigger_settings?: {
    left_dead_zone: number
    right_dead_zone: number
  }
  vibration?: boolean
  dead_zones?: {
    left: number
    right: number
  }
}

export type EmulatorProvider = {
  id: string
  name: string
  displayName: string
  executable: string
  version: string
  supportedSystems: string[]
  capabilities: EmulatorCapability[]
  defaultProfile: EmulatorProfile
  scanGameFolders: (systemId: string) => Promise<any[]>
  launchGame: (game: any, profile?: EmulatorProfile, options?: { fullscreen?: boolean; resolution?: string }) => Promise<{ success: boolean; pid?: number; error?: string }>
  getGameSavePath: (gameId: string) => string | null
  getGameStatePath: (gameId: string) => string | null
}

export class EmulatorProviderAdapter implements EmulatorProvider {
  constructor(
    public id: string,
    public name: string,
    public displayName: string,
    public executable: string,
    public version: string,
    public supportedSystems: string[],
    public capabilities: EmulatorCapability[],
    public defaultProfile: EmulatorProfile = {
      id: '',
      name: '',
    },
  ) {}

  async scanGameFolders(systemId: string): Promise<any[]> {
    // Get system info from database
    const system = database.getSystem(systemId)
    if (!system) return []

    const extensions = system.extensions ? system.extensions.split(',').map(e => e.trim()) : []
    const scanDir = path.join(app.getPath('userData'), 'scan-folders', systemId)

    try {
      if (!await fs.access(scanDir)) {
        await fs.mkdir(scanDir, { recursive: true })
        return []
      }

      const entries = await fs.readdir(scanDir, { recursive: true, withFileTypes: true })
      const games: any[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Recursively find games
          const files = await fs.readdir(path.join(scanDir, entry.name), { recursive: true })
          const gameFiles = files.filter(f => {
            const ext = path.extname(f).toLowerCase()
            return extensions.some(e => e.toLowerCase() === ext.replace('.', ''))
          })

          if (gameFiles.length > 0) {
            games.push({
              name: entry.name,
              path: path.join(scanDir, entry.name),
              fileCount: gameFiles.length,
              systemId,
            })
          }
        }
      }

      return games
    } catch (error) {
      console.error(`Error scanning game folders for system ${systemId}:`, error)
      return []
    }
  }

  async launchGame(
    game: any,
    profile?: EmulatorProfile,
    options?: { fullscreen?: boolean; resolution?: string }
  ): Promise<{ success: boolean; pid?: number; error?: string }> {
    try {
      const emulator = database.getEmulator(game.emulatorId || this.id)
      if (!emulator) {
        return { success: false, error: 'Emulator not found' }
      }

      // Build launch arguments from profile and emulator config
      let launchArgs: string[] = [...(profile?.launch_args || [])]

      // Add emulator-specific args
      if (emulator.launch_args) {
        const baseArgs = emulator.launch_args
        launchArgs = [...launchArgs, ...baseArgs.split(' ')]
      }

      // Add options
      if (options?.fullscreen) launchArgs.push('-fullscreen')
      if (options?.resolution) launchArgs.push('-resolution', options.resolution)

      // Build environment
      const env = { ...process.env }
      if (emulator.biosPath) env.BIOS_PATH = emulator.biosPath
      if (emulator.savePath) env.SAVE_PATH = emulator.savePath
      if (emulator.statePath) env.STATE_PATH = emulator.statePath

      // Determine executable path
      const executable = emulator.executablePath || this.executable
      if (!executable || !(await this.executableExists(executable))) {
        return { success: false, error: 'Emulator executable not found' }
      }

      // Determine game file path
      const gameFilePath = game.filePath || game.path || ''
      if (!gameFilePath) {
        return { success: false, error: 'No game file path specified' }
      }

      // Launch the emulator
      const child = require('child_process').spawn(executable, [gameFilePath, ...launchArgs], {
        cwd: path.dirname(executable),
        env,
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })

      child.unref()

      // Update play stats
      database.updateGamePlayStats(game.id, 0)

      return { success: true, pid: child.pid }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async executableExists(executable: string): Promise<boolean> {
    return new Promise((resolve) => {
      require('fs').access(executable, (err) => {
        resolve(!err)
      })
    })
  }

  getGameSavePath(gameId: string): string | null {
    const game = database.getGame(gameId)
    if (!game || !game.emulatorId) return null

    const emulator = database.getEmulator(game.emulatorId)
    return emulator?.savePath || null
  }

  getGameStatePath(gameId: string): string | null {
    const game = database.getGame(gameId)
    if (!game || !game.emulatorId) return null

    const emulator = database.getEmulator(game.emulatorId)
    return emulator?.statePath || null
  }
}

// Built-in emulator providers
export const builtInProviders: EmulatorProvider[] = [
  new EmulatorProviderAdapter(
    'duckstation',
    'DuckStation',
    'DuckStation',
    '', // Will be detected
    'latest',
    ['ps1', 'playstation'],
    ['save_states', 'cheat_codes'],
    {
      id: 'duckstation',
      name: 'DuckStation',
      launch_args: '-s',
    }
  ),

  new EmulatorProviderAdapter(
    'pcsx2',
    'PCSX2',
    'PCSX2',
    '', // Will be detected
    'latest',
    ['ps2', 'playstation2'],
    ['save_states', 'cheat_codes', 'netplay'],
    {
      id: 'pcsx2',
      name: 'PCSX2',
      launch_args: '-fullscreen',
    }
  ),

  new EmulatorProviderAdapter(
    'rpcs3',
    'RPCS3',
    'RPCS3',
    '', // Will be detected
    'latest',
    ['ps3', 'playstation3'],
    ['save_states', 'cheat_codes'],
    {
      id: 'rpcs3',
      name: 'RPCS3',
      launch_args: '--debug',
    }
  ),

  new EmulatorProviderAdapter(
    'ppsspp',
    'PPSSPP',
    'PPSSPP',
    '', // Will be detected
    'latest',
    ['psp', 'playstationportable'],
    ['save_states', 'cheat_codes'],
    {
      id: 'ppsspp',
      name: 'PPSSPP',
      launch_args: '',
    }
  ),
]

export function getProvider(emulatorId: string): EmulatorProvider | undefined {
  const provider = builtInProviders.find(p => p.id === emulatorId)
  if (provider) return provider

  // Try to find from database
  const emulator = database.getEmulator(emulatorId)
  if (emulator) {
    const existingProvider = builtInProviders.find(p => p.id === emulator.name.toLowerCase().replace(/ /g, ''))
    if (existingProvider) return existingProvider
  }

  return undefined
}

export function getProviderForSystem(systemId: string): EmulatorProvider | undefined {
  const system = database.getSystem(systemId)
  if (!system) return undefined

  const emulators = database.getEmulatorsForSystem(systemId)
  if (emulators.length > 0) {
    return getProvider(emulators[0].id)
  }

  // Fallback to first built-in provider that supports the system
  const lowerSystem = system.short_name.toLowerCase()
  return builtInProviders.find(p => 
    p.supportedSystems.some(s => s.toLowerCase().includes(lowerSystem))
  )
}