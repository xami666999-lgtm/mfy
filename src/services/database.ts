import type { 
  Game, System, Emulator, ControllerProfile, SaveFile, SaveBackup, Theme, Download, 
  ScanFolder, Collection, PlaySession, AppSettings, Statistics,
  GameSettings, EmulatorCapabilities 
} from '../types'

interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
  changes?: number
  lastInsertRowid?: number | bigint
}

class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  private async dbRun(query: string, params: any[] = []): Promise<DatabaseResult<any>> {
    return window.electronAPI.db.run(query, params)
  }

  private async dbGet(query: string, params: any[] = []): Promise<DatabaseResult<any>> {
    return window.electronAPI.db.get(query, params)
  }

  private async dbAll(query: string, params: any[] = []): Promise<DatabaseResult<any[]>> {
    return window.electronAPI.db.all(query, params)
  }

  // Games
  async insertGame(game: Game): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO games 
      (id, name, platform, file_path, emulator_id, artwork_url, background_url, description, developer, publisher, release_date, genre, region, is_favorite, last_played, playtime, launch_count, save_paths, game_settings, emulator_settings, controller_profile_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `
    const params = [
      game.id, game.name, game.platform, game.filePath, game.emulatorId || null,
      game.artworkUrl || null, game.backgroundUrl || null, game.description || null,
      game.developer || null, game.publisher || null, game.releaseDate || null,
      JSON.stringify(game.genre || []), game.region || null,
      game.isFavorite ? 1 : 0, game.lastPlayed || null, game.playtime, game.launchCount,
      JSON.stringify(game.savePaths || []),
      JSON.stringify(game.gameSettings || {}),
      JSON.stringify(game.emulatorSettings || {}),
      game.controllerProfileId || null,
    ]
    return this.dbRun(query, params)
  }

  async getGame(id: string): Promise<Game | null> {
    const result = await this.dbGet('SELECT * FROM games WHERE id = ?', [id])
    return result.success && result.data ? this.mapGame(result.data) : null
  }

  async getGameByPath(filePath: string): Promise<Game | null> {
    const result = await this.dbGet('SELECT * FROM games WHERE file_path = ?', [filePath])
    return result.success && result.data ? this.mapGame(result.data) : null
  }

  async getGames(limit = 50, offset = 0): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games ORDER BY added_at DESC LIMIT ? OFFSET ?', [limit, offset])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async searchGames(query: string, limit = 20): Promise<Game[]> {
    const likeQuery = `%${query}%`
    const result = await this.dbAll(`
      SELECT * FROM games 
      WHERE name LIKE ? 
      ORDER BY 
        CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
        launch_count DESC
      LIMIT ?
    `, [likeQuery, likeQuery, limit])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getGamesByPlatform(platform: string): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games WHERE platform = ? ORDER BY name ASC', [platform])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getGamesByEmulator(emulatorId: string): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games WHERE emulator_id = ? ORDER BY name ASC', [emulatorId])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getFavoriteGames(): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games WHERE is_favorite = 1 ORDER BY last_played DESC NULLS LAST')
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getRecentlyPlayed(limit = 20): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT ?', [limit])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getMostPlayed(limit = 20): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games ORDER BY playtime DESC LIMIT ?', [limit])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async getRecentlyAdded(limit = 20): Promise<Game[]> {
    const result = await this.dbAll('SELECT * FROM games ORDER BY added_at DESC LIMIT ?', [limit])
    return result.success && result.data ? result.data.map(this.mapGame) : []
  }

  async updateGamePlayStats(id: string, playtime: number): Promise<void> {
    await this.dbRun('UPDATE games SET last_played = strftime("%s", "now"), playtime = playtime + ?, launch_count = launch_count + 1, updated_at = strftime("%s", "now") WHERE id = ?', [playtime, id])
  }

  async updateGameFavorite(id: string, isFavorite: boolean): Promise<void> {
    await this.dbRun('UPDATE games SET is_favorite = ?, updated_at = strftime("%s", "now") WHERE id = ?', [isFavorite ? 1 : 0, id])
  }

  async updateGameEmulator(id: string, emulatorId: string): Promise<void> {
    await this.dbRun('UPDATE games SET emulator_id = ?, updated_at = strftime("%s", "now") WHERE id = ?', [emulatorId, id])
  }

  async updateGameSettings(id: string, gameSettings: GameSettings, emulatorSettings: Record<string, any>, controllerProfileId?: string): Promise<void> {
    await this.dbRun('UPDATE games SET game_settings = ?, emulator_settings = ?, controller_profile_id = ?, updated_at = strftime("%s", "now") WHERE id = ?', 
      [JSON.stringify(gameSettings), JSON.stringify(emulatorSettings), controllerProfileId || null, id])
  }

  async updateGameArtwork(id: string, artworkUrl?: string, backgroundUrl?: string): Promise<void> {
    await this.dbRun('UPDATE games SET artwork_url = ?, background_url = ?, updated_at = strftime("%s", "now") WHERE id = ?', 
      [artworkUrl || null, backgroundUrl || null, id])
  }

  async deleteGame(id: string): Promise<void> {
    await this.dbRun('DELETE FROM games WHERE id = ?', [id])
  }

  async getGameCount(): Promise<number> {
    const result = await this.dbGet('SELECT COUNT(*) as count FROM games')
    return result.success && result.data ? result.data.count : 0
  }

  async getGameCountByPlatform(): Promise<Record<string, number>> {
    const result = await this.dbAll('SELECT platform, COUNT(*) as count FROM games GROUP BY platform')
    const counts: Record<string, number> = {}
    if (result.success && result.data) {
      for (const row of result.data) {
        counts[row.platform] = row.count
      }
    }
    return counts
  }

  private mapGame(row: any): Game {
    return {
      id: row.id,
      name: row.name,
      platform: row.platform,
      filePath: row.file_path,
      emulatorId: row.emulator_id,
      artworkUrl: row.artwork_url,
      backgroundUrl: row.background_url,
      description: row.description,
      developer: row.developer,
      publisher: row.publisher,
      releaseDate: row.release_date,
      genre: row.genre ? JSON.parse(row.genre) : [],
      region: row.region,
      isFavorite: !!row.is_favorite,
      lastPlayed: row.last_played,
      playtime: row.playtime || 0,
      launchCount: row.launch_count || 0,
      savePaths: row.save_paths ? JSON.parse(row.save_paths) : [],
      gameSettings: row.game_settings ? JSON.parse(row.game_settings) : {},
      emulatorSettings: row.emulator_settings ? JSON.parse(row.emulator_settings) : {},
      controllerProfileId: row.controller_profile_id,
      addedAt: row.added_at,
      updatedAt: row.updated_at,
    }
  }

  // Systems
  async insertSystem(system: System): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO systems 
      (id, name, short_name, manufacturer, generation, release_year, description, logo_url, banner_url, background_url, color, extensions, bios_files, default_emulator_id, game_count, is_enabled, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      system.id, system.name, system.shortName, system.manufacturer, system.generation, system.releaseYear,
      system.description, system.logoUrl || null, system.bannerUrl || null, system.backgroundUrl || null,
      system.color || null, JSON.stringify(system.extensions), JSON.stringify(system.biosFiles || []),
      system.defaultEmulatorId || null, system.gameCount, system.isEnabled ? 1 : 0, system.order,
    ]
    return this.dbRun(query, params)
  }

  async getSystem(id: string): Promise<System | null> {
    const result = await this.dbGet('SELECT * FROM systems WHERE id = ?', [id])
    return result.success && result.data ? this.mapSystem(result.data) : null
  }

  async getSystems(): Promise<System[]> {
    const result = await this.dbAll('SELECT * FROM systems WHERE is_enabled = 1 ORDER BY "order" ASC, name ASC')
    return result.success && result.data ? result.data.map(this.mapSystem) : []
  }

  async getAllSystems(): Promise<System[]> {
    const result = await this.dbAll('SELECT * FROM systems ORDER BY "order" ASC, name ASC')
    return result.success && result.data ? result.data.map(this.mapSystem) : []
  }

  async updateSystemGameCount(id: string, count: number): Promise<void> {
    await this.dbRun('UPDATE systems SET game_count = ? WHERE id = ?', [count, id])
  }

  async updateSystemDefaultEmulator(id: string, emulatorId: string): Promise<void> {
    await this.dbRun('UPDATE systems SET default_emulator_id = ? WHERE id = ?', [emulatorId, id])
  }

  private mapSystem(row: any): System {
    return {
      id: row.id,
      name: row.name,
      shortName: row.short_name,
      manufacturer: row.manufacturer,
      generation: row.generation,
      releaseYear: row.release_year,
      description: row.description,
      logoUrl: row.logo_url,
      bannerUrl: row.banner_url,
      backgroundUrl: row.background_url,
      color: row.color,
      extensions: JSON.parse(row.extensions),
      biosFiles: row.bios_files ? JSON.parse(row.bios_files) : [],
      defaultEmulatorId: row.default_emulator_id,
      gameCount: row.game_count || 0,
      isEnabled: !!row.is_enabled,
      order: row.order || 0,
    }
  }

  // Emulators
  async insertEmulator(emulator: Emulator): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO emulators 
      (id, name, version, display_name, description, author, website, download_url, supported_systems, executable_path, install_path, config_path, bios_path, save_path, state_path, screenshot_path, is_installed, is_default, launch_args, config_schema, installed_version, latest_version, update_available, last_checked, capabilities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      emulator.id, emulator.name, emulator.version, emulator.displayName, emulator.description,
      emulator.author, emulator.website, emulator.downloadUrl, JSON.stringify(emulator.supportedSystems),
      emulator.executablePath || null, emulator.installPath || null, emulator.configPath || null,
      emulator.biosPath || null, emulator.savePath || null, emulator.statePath || null,
      emulator.screenshotPath || null, emulator.isInstalled ? 1 : 0,
      JSON.stringify(emulator.isDefault), JSON.stringify(emulator.launchArgs || {}),
      JSON.stringify(emulator.configSchema), emulator.installedVersion || null,
      emulator.latestVersion || null, emulator.updateAvailable ? 1 : 0,
      emulator.lastChecked || null, JSON.stringify(emulator.capabilities),
    ]
    return this.dbRun(query, params)
  }

  async getEmulator(id: string): Promise<Emulator | null> {
    const result = await this.dbGet('SELECT * FROM emulators WHERE id = ?', [id])
    return result.success && result.data ? this.mapEmulator(result.data) : null
  }

  async getEmulators(): Promise<Emulator[]> {
    const result = await this.dbAll('SELECT * FROM emulators ORDER BY name ASC')
    return result.success && result.data ? result.data.map(this.mapEmulator) : []
  }

  async getInstalledEmulators(): Promise<Emulator[]> {
    const result = await this.dbAll('SELECT * FROM emulators WHERE is_installed = 1 ORDER BY name ASC')
    return result.success && result.data ? result.data.map(this.mapEmulator) : []
  }

  async getEmulatorsForSystem(systemId: string): Promise<Emulator[]> {
    const result = await this.dbAll('SELECT * FROM emulators WHERE supported_systems LIKE ? AND is_installed = 1 ORDER BY name ASC', [`%${systemId}%`])
    return result.success && result.data ? result.data.map(this.mapEmulator) : []
  }

  async updateEmulatorInstall(id: string, isInstalled: boolean, executablePath: string, installPath: string, configPath: string, biosPath: string, savePath: string, statePath: string, screenshotPath: string, installedVersion: string): Promise<void> {
    await this.dbRun('UPDATE emulators SET is_installed = ?, executable_path = ?, install_path = ?, config_path = ?, bios_path = ?, save_path = ?, state_path = ?, screenshot_path = ?, installed_version = ?, updated_at = strftime("%s", "now") WHERE id = ?', 
      [isInstalled ? 1 : 0, executablePath, installPath, configPath, biosPath, savePath, statePath, screenshotPath, installedVersion, id])
  }

  async updateEmulatorDefault(id: string, isDefault: Record<string, boolean>): Promise<void> {
    await this.dbRun('UPDATE emulators SET is_default = ? WHERE id = ?', [JSON.stringify(isDefault), id])
  }

  async updateEmulatorVersion(id: string, latestVersion: string, updateAvailable: boolean): Promise<void> {
    await this.dbRun('UPDATE emulators SET latest_version = ?, update_available = ?, last_checked = strftime("%s", "now") WHERE id = ?', [latestVersion, updateAvailable ? 1 : 0, id])
  }

  private mapEmulator(row: any): Emulator {
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      displayName: row.display_name,
      description: row.description,
      author: row.author,
      website: row.website,
      downloadUrl: row.download_url,
      supportedSystems: JSON.parse(row.supported_systems),
      executablePath: row.executable_path,
      installPath: row.install_path,
      configPath: row.config_path,
      biosPath: row.bios_path,
      savePath: row.save_path,
      statePath: row.state_path,
      screenshotPath: row.screenshot_path,
      isInstalled: !!row.is_installed,
      isDefault: row.is_default ? JSON.parse(row.is_default) : {},
      launchArgs: row.launch_args ? JSON.parse(row.launch_args) : {},
      configSchema: row.config_schema ? JSON.parse(row.config_schema) : undefined,
      installedVersion: row.installed_version,
      latestVersion: row.latest_version,
      updateAvailable: !!row.update_available,
      lastChecked: row.last_checked,
      capabilities: row.capabilities ? JSON.parse(row.capabilities) : {
        saveStates: true,
        screenshots: true,
        recording: false,
        netplay: false,
        achievements: false,
        cheats: true,
        rewind: false,
        turbo: false,
        customResolution: true,
        shaderSupport: false,
        controllerProfiles: true,
        perGameConfig: true,
      },
    }
  }

  // Controller Profiles
  async insertControllerProfile(profile: ControllerProfile): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO controller_profiles 
      (id, name, type, device_id, device_name, vendor_id, product_id, mappings, stick_settings, trigger_settings, vibration, dead_zones, is_system_default, is_game_default, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `
    const params = [
      profile.id, profile.name, profile.type, profile.deviceId || null, profile.deviceName || null,
      profile.vendorId || null, profile.productId || null, JSON.stringify(profile.mappings),
      JSON.stringify(profile.stickSettings || {}), JSON.stringify(profile.triggerSettings || {}),
      JSON.stringify(profile.vibration || { enabled: true, strength: 1 }),
      JSON.stringify(profile.deadZones || { leftStick: 0.1, rightStick: 0.1, leftTrigger: 0.1, rightTrigger: 0.1 }),
      JSON.stringify(profile.isSystemDefault), JSON.stringify(profile.isGameDefault),
    ]
    return this.dbRun(query, params)
  }

  async getControllerProfile(id: string): Promise<ControllerProfile | null> {
    const result = await this.dbGet('SELECT * FROM controller_profiles WHERE id = ?', [id])
    return result.success && result.data ? this.mapControllerProfile(result.data) : null
  }

  async getControllerProfiles(): Promise<ControllerProfile[]> {
    const result = await this.dbAll('SELECT * FROM controller_profiles ORDER BY name ASC')
    return result.success && result.data ? result.data.map(this.mapControllerProfile) : []
  }

  async getControllerProfilesByType(type: string): Promise<ControllerProfile[]> {
    const result = await this.dbAll('SELECT * FROM controller_profiles WHERE type = ? ORDER BY name ASC', [type])
    return result.success && result.data ? result.data.map(this.mapControllerProfile) : []
  }

  async getSystemDefaultProfile(systemId: string): Promise<ControllerProfile | null> {
    const result = await this.dbGet('SELECT * FROM controller_profiles WHERE json_extract(is_system_default, "$." || ?) = 1 LIMIT 1', [systemId])
    return result.success && result.data ? this.mapControllerProfile(result.data) : null
  }

  async getGameDefaultProfile(gameId: string): Promise<ControllerProfile | null> {
    const result = await this.dbGet('SELECT * FROM controller_profiles WHERE json_extract(is_game_default, "$." || ?) = 1 LIMIT 1', [gameId])
    return result.success && result.data ? this.mapControllerProfile(result.data) : null
  }

  private mapControllerProfile(row: any): ControllerProfile {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      deviceId: row.device_id,
      deviceName: row.device_name,
      vendorId: row.vendor_id,
      productId: row.product_id,
      mappings: JSON.parse(row.mappings),
      stickSettings: row.stick_settings ? JSON.parse(row.stick_settings) : undefined,
      triggerSettings: row.trigger_settings ? JSON.parse(row.trigger_settings) : undefined,
      vibration: row.vibration ? JSON.parse(row.vibration) : { enabled: true, strength: 1 },
      deadZones: row.dead_zones ? JSON.parse(row.dead_zones) : { leftStick: 0.1, rightStick: 0.1, leftTrigger: 0.1, rightTrigger: 0.1 },
      isSystemDefault: row.is_system_default ? JSON.parse(row.is_system_default) : {},
      isGameDefault: row.is_game_default ? JSON.parse(row.is_game_default) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  // Save Files
  async insertSaveFile(saveFile: SaveFile): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO save_files 
      (id, game_id, emulator_id, type, name, path, size, modified_at, description, screenshot_url, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      saveFile.id, saveFile.gameId, saveFile.emulatorId, saveFile.type, saveFile.name,
      saveFile.path, saveFile.size, saveFile.modifiedAt, saveFile.description || null,
      saveFile.screenshotUrl || null, JSON.stringify(saveFile.metadata || {}),
    ]
    return this.dbRun(query, params)
  }

  async getSaveFiles(gameId: string): Promise<SaveFile[]> {
    const result = await this.dbAll('SELECT * FROM save_files WHERE game_id = ? ORDER BY modified_at DESC', [gameId])
    return result.success && result.data ? result.data.map(this.mapSaveFile) : []
  }

  async getSaveFilesByEmulator(emulatorId: string): Promise<SaveFile[]> {
    const result = await this.dbAll('SELECT * FROM save_files WHERE emulator_id = ? ORDER BY modified_at DESC', [emulatorId])
    return result.success && result.data ? result.data.map(this.mapSaveFile) : []
  }

  async deleteSaveFile(id: string): Promise<void> {
    await this.dbRun('DELETE FROM save_files WHERE id = ?', [id])
  }

  async deleteGameSaveFiles(gameId: string): Promise<void> {
    await this.dbRun('DELETE FROM save_files WHERE game_id = ?', [gameId])
  }

  private mapSaveFile(row: any): SaveFile {
    return {
      id: row.id,
      gameId: row.game_id,
      emulatorId: row.emulator_id,
      type: row.type,
      name: row.name,
      path: row.path,
      size: row.size,
      modifiedAt: row.modified_at,
      description: row.description,
      screenshotUrl: row.screenshot_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }
  }

  // Save Backups
  async insertSaveBackup(backup: SaveBackup): Promise<DatabaseResult<any>> {
    const query = `
      INSERT INTO save_backups (id, game_id, name, description, files, size, path, is_auto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      backup.id, backup.gameId, backup.name, backup.description || null,
      JSON.stringify(backup.files), backup.size, backup.path, backup.isAuto ? 1 : 0,
    ]
    return this.dbRun(query, params)
  }

  async getSaveBackups(gameId: string): Promise<SaveBackup[]> {
    const result = await this.dbAll('SELECT * FROM save_backups WHERE game_id = ? ORDER BY created_at DESC', [gameId])
    return result.success && result.data ? result.data.map(this.mapSaveBackup) : []
  }

  async getSaveBackup(id: string): Promise<SaveBackup | null> {
    const result = await this.dbGet('SELECT * FROM save_backups WHERE id = ?', [id])
    return result.success && result.data ? this.mapSaveBackup(result.data) : null
  }

  async deleteSaveBackup(id: string): Promise<void> {
    await this.dbRun('DELETE FROM save_backups WHERE id = ?', [id])
  }

  private mapSaveBackup(row: any): SaveBackup {
    return {
      id: row.id,
      gameId: row.game_id,
      name: row.name,
      description: row.description,
      files: JSON.parse(row.files),
      createdAt: row.created_at,
      size: row.size,
      path: row.path,
      isAuto: !!row.is_auto,
    }
  }

  // Themes
  async insertTheme(theme: Theme): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO themes 
      (id, name, display_name, description, author, version, preview_images, is_built_in, is_active, config, assets, layouts, animations, sounds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      theme.id, theme.name, theme.displayName, theme.description, theme.author, theme.version,
      JSON.stringify(theme.previewImages), theme.isBuiltIn ? 1 : 0, theme.isActive ? 1 : 0,
      JSON.stringify(theme.config), JSON.stringify(theme.assets || {}),
      JSON.stringify(theme.layouts), JSON.stringify(theme.animations), JSON.stringify(theme.sounds),
    ]
    return this.dbRun(query, params)
  }

  async getTheme(id: string): Promise<Theme | null> {
    const result = await this.dbGet('SELECT * FROM themes WHERE id = ?', [id])
    return result.success && result.data ? this.mapTheme(result.data) : null
  }

  async getThemes(): Promise<Theme[]> {
    const result = await this.dbAll('SELECT * FROM themes ORDER BY is_built_in DESC, name ASC')
    return result.success && result.data ? result.data.map(this.mapTheme) : []
  }

  async getActiveTheme(): Promise<Theme | null> {
    const result = await this.dbGet('SELECT * FROM themes WHERE is_active = 1 LIMIT 1')
    return result.success && result.data ? this.mapTheme(result.data) : null
  }

  async setActiveTheme(id: string): Promise<void> {
    await this.dbRun('UPDATE themes SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END', [id])
  }

  private mapTheme(row: any): Theme {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      author: row.author,
      version: row.version,
      previewImages: JSON.parse(row.preview_images),
      isBuiltIn: !!row.is_built_in,
      isActive: !!row.is_active,
      config: JSON.parse(row.config),
      assets: row.assets ? JSON.parse(row.assets) : {},
      layouts: JSON.parse(row.layouts),
      animations: JSON.parse(row.animations),
      sounds: JSON.parse(row.sounds),
    }
  }

  // Downloads
  async insertDownload(download: Download): Promise<DatabaseResult<any>> {
    const query = `
      INSERT INTO downloads (id, type, name, url, destination, progress, total_size, downloaded_size, speed, status, error, retry_count, started_at, completed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      download.id, download.type, download.name, download.url, download.destination,
      download.progress, download.totalSize, download.downloadedSize, download.speed,
      download.status, download.error || null, download.retryCount,
      download.startedAt || null, download.completedAt || null, JSON.stringify(download.metadata || {}),
    ]
    return this.dbRun(query, params)
  }

  async getDownload(id: string): Promise<Download | null> {
    const result = await this.dbGet('SELECT * FROM downloads WHERE id = ?', [id])
    return result.success && result.data ? this.mapDownload(result.data) : null
  }

  async getDownloads(limit = 50, offset = 0): Promise<Download[]> {
    const result = await this.dbAll('SELECT * FROM downloads ORDER BY started_at DESC LIMIT ? OFFSET ?', [limit, offset])
    return result.success && result.data ? result.data.map(this.mapDownload) : []
  }

  async getActiveDownloads(): Promise<Download[]> {
    const result = await this.dbAll("SELECT * FROM downloads WHERE status IN ('pending', 'downloading', 'paused') ORDER BY started_at ASC")
    return result.success && result.data ? result.data.map(this.mapDownload) : []
  }

  async updateDownloadProgress(id: string, progress: number, downloadedSize: number, speed: number, status: string): Promise<void> {
    await this.dbRun('UPDATE downloads SET progress = ?, downloaded_size = ?, speed = ?, status = ? WHERE id = ?', [progress, downloadedSize, speed, status, id])
  }

  async updateDownloadComplete(id: string): Promise<void> {
    await this.dbRun('UPDATE downloads SET progress = 1, downloaded_size = total_size, speed = 0, status = "completed", completed_at = strftime("%s", "now") WHERE id = ?', [id])
  }

  async updateDownloadError(id: string, error: string): Promise<void> {
    await this.dbRun('UPDATE downloads SET status = "failed", error = ?, retry_count = retry_count + 1 WHERE id = ?', [error, id])
  }

  async deleteDownload(id: string): Promise<void> {
    await this.dbRun('DELETE FROM downloads WHERE id = ?', [id])
  }

  async clearCompletedDownloads(): Promise<void> {
    await this.dbRun("DELETE FROM downloads WHERE status IN ('completed', 'failed', 'cancelled')")
  }

  private mapDownload(row: any): Download {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      url: row.url,
      destination: row.destination,
      progress: row.progress,
      totalSize: row.total_size,
      downloadedSize: row.downloaded_size,
      speed: row.speed,
      status: row.status,
      error: row.error,
      retryCount: row.retry_count,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
    }
  }

  // Scan Folders
  async insertScanFolder(folder: ScanFolder): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO scan_folders (id, path, name, is_managed, recursive, include_patterns, exclude_patterns, last_scanned, game_count, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      folder.id, folder.path, folder.name, folder.isManaged ? 1 : 0, folder.recursive ? 1 : 0,
      JSON.stringify(folder.includePatterns), JSON.stringify(folder.excludePatterns),
      folder.lastScanned || null, folder.gameCount, folder.enabled ? 1 : 0,
    ]
    return this.dbRun(query, params)
  }

  async getScanFolders(): Promise<ScanFolder[]> {
    const result = await this.dbAll('SELECT * FROM scan_folders WHERE enabled = 1 ORDER BY name ASC')
    return result.success && result.data ? result.data.map(this.mapScanFolder) : []
  }

  async getAllScanFolders(): Promise<ScanFolder[]> {
    const result = await this.dbAll('SELECT * FROM scan_folders ORDER BY name ASC')
    return result.success && result.data ? result.data.map(this.mapScanFolder) : []
  }

  async updateScanFolderStats(id: string, gameCount: number): Promise<void> {
    await this.dbRun('UPDATE scan_folders SET last_scanned = strftime("%s", "now"), game_count = ? WHERE id = ?', [gameCount, id])
  }

  async deleteScanFolder(id: string): Promise<void> {
    await this.dbRun('DELETE FROM scan_folders WHERE id = ?', [id])
  }

  private mapScanFolder(row: any): ScanFolder {
    return {
      id: row.id,
      path: row.path,
      name: row.name,
      isManaged: !!row.is_managed,
      recursive: !!row.recursive,
      includePatterns: JSON.parse(row.include_patterns),
      excludePatterns: JSON.parse(row.exclude_patterns),
      lastScanned: row.last_scanned,
      gameCount: row.game_count,
      enabled: !!row.enabled,
    }
  }

  // Collections
  async insertCollection(collection: Collection): Promise<DatabaseResult<any>> {
    const query = `
      INSERT OR REPLACE INTO collections (id, name, description, artwork_url, game_ids, is_system, system_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
    `
    const params = [
      collection.id, collection.name, collection.description || null, collection.artworkUrl || null,
      JSON.stringify(collection.gameIds), collection.isSystem ? 1 : 0, collection.systemId || null,
    ]
    return this.dbRun(query, params)
  }

  async getCollection(id: string): Promise<Collection | null> {
    const result = await this.dbGet('SELECT * FROM collections WHERE id = ?', [id])
    return result.success && result.data ? this.mapCollection(result.data) : null
  }

  async getCollections(): Promise<Collection[]> {
    const result = await this.dbAll('SELECT * FROM collections ORDER BY is_system DESC, name ASC')
    return result.success && result.data ? result.data.map(this.mapCollection) : []
  }

  async getSystemCollections(systemId: string): Promise<Collection[]> {
    const result = await this.dbAll('SELECT * FROM collections WHERE system_id = ? ORDER BY name ASC', [systemId])
    return result.success && result.data ? result.data.map(this.mapCollection) : []
  }

  async deleteCollection(id: string): Promise<void> {
    await this.dbRun('DELETE FROM collections WHERE id = ?', [id])
  }

  private mapCollection(row: any): Collection {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      artworkUrl: row.artwork_url,
      gameIds: JSON.parse(row.game_ids),
      isSystem: !!row.is_system,
      systemId: row.system_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  // Play Sessions
  async insertPlaySession(session: PlaySession): Promise<DatabaseResult<any>> {
    const query = `
      INSERT INTO play_sessions (id, game_id, emulator_id, started_at, ended_at, duration, is_completed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [session.id, session.gameId, session.emulatorId, session.startedAt, session.endedAt || null, session.duration, session.isCompleted ? 1 : 0]
    return this.dbRun(query, params)
  }

  async getPlaySessions(gameId: string, limit = 50): Promise<PlaySession[]> {
    const result = await this.dbAll('SELECT * FROM play_sessions WHERE game_id = ? ORDER BY started_at DESC LIMIT ?', [gameId, limit])
    return result.success && result.data ? result.data.map(this.mapPlaySession) : []
  }

  async getRecentSessions(limit = 50): Promise<PlaySession[]> {
    const result = await this.dbAll('SELECT * FROM play_sessions ORDER BY started_at DESC LIMIT ?', [limit])
    return result.success && result.data ? result.data.map(this.mapPlaySession) : []
  }

  async updatePlaySessionEnd(id: string, endedAt: number, duration: number, isCompleted: boolean): Promise<void> {
    await this.dbRun('UPDATE play_sessions SET ended_at = ?, duration = ?, is_completed = ? WHERE id = ?', [endedAt, duration, isCompleted ? 1 : 0, id])
  }

  private mapPlaySession(row: any): PlaySession {
    return {
      id: row.id,
      gameId: row.game_id,
      emulatorId: row.emulator_id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      duration: row.duration,
      isCompleted: !!row.is_completed,
    }
  }

  // Settings
  async getSetting<T>(key: string): Promise<T | null> {
    const result = await this.dbGet('SELECT value FROM settings WHERE key = ?', [key])
    if (result.success && result.data) {
      try {
        return JSON.parse(result.data.value)
      } catch {
        return result.data.value as T
      }
    }
    return null
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, JSON.stringify(value)])
  }

  async deleteSetting(key: string): Promise<void> {
    await this.dbRun('DELETE FROM settings WHERE key = ?', [key])
  }

  async getAllSettings(): Promise<AppSettings> {
    const result = await this.dbAll('SELECT key, value FROM settings')
    const settings: Record<string, any> = {}
    if (result.success && result.data) {
      for (const row of result.data) {
        try {
          settings[row.key] = JSON.parse(row.value)
        } catch {
          settings[row.key] = row.value
        }
      }
    }
    return settings as AppSettings
  }

  // Metadata Cache
  async insertMetadataCache(id: string, source: string, query: string, result: any, expiresAt: number): Promise<DatabaseResult<any>> {
    return this.dbRun('INSERT OR REPLACE INTO metadata_cache (id, source, query, result, expires_at) VALUES (?, ?, ?, ?, ?)', [id, source, query, JSON.stringify(result), expiresAt])
  }

  async getMetadataCache(source: string, query: string): Promise<any | null> {
    const result = await this.dbGet('SELECT * FROM metadata_cache WHERE source = ? AND query = ? AND expires_at > strftime("%s", "now")', [source, query])
    return result.success && result.data ? JSON.parse(result.data.result) : null
  }

  async cleanMetadataCache(): Promise<void> {
    await this.dbRun('DELETE FROM metadata_cache WHERE expires_at < strftime("%s", "now")')
  }
}

export const databaseService = DatabaseService.getInstance()