import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

const userDataPath = app.getPath('userData')
const dbPath = path.join(userDataPath, 'mfy-emulator.db')
const cacheDir = path.join(userDataPath, 'emulator-cache')
const downloadsDir = path.join(userDataPath, 'downloads')
const themesDir = path.join(userDataPath, 'themes')
const biosDir = path.join(userDataPath, 'bios')
const savesDir = path.join(userDataPath, 'saves')
const backupsDir = path.join(userDataPath, 'backups')

for (const dir of [cacheDir, downloadsDir, themesDir, biosDir, savesDir, backupsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

let db: Database.Database | null = null

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 10000')
    initSchema()
  }
  return db
}

function initSchema() {
  if (!db) return
  
  db.exec(`
    -- Games table
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      file_path TEXT NOT NULL UNIQUE,
      emulator_id TEXT,
      artwork_url TEXT,
      background_url TEXT,
      description TEXT,
      developer TEXT,
      publisher TEXT,
      release_date TEXT,
      genre TEXT,
      region TEXT,
      is_favorite INTEGER DEFAULT 0,
      last_played INTEGER,
      playtime INTEGER DEFAULT 0,
      launch_count INTEGER DEFAULT 0,
      save_paths TEXT,
      game_settings TEXT,
      emulator_settings TEXT,
      controller_profile_id TEXT,
      added_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (emulator_id) REFERENCES emulators(id) ON DELETE SET NULL,
      FOREIGN KEY (controller_profile_id) REFERENCES controller_profiles(id) ON DELETE SET NULL
    );

    -- Systems table
    CREATE TABLE IF NOT EXISTS systems (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      generation INTEGER NOT NULL,
      release_year INTEGER NOT NULL,
      description TEXT,
      logo_url TEXT,
      banner_url TEXT,
      background_url TEXT,
      color TEXT,
      extensions TEXT NOT NULL,
      bios_files TEXT,
      default_emulator_id TEXT,
      game_count INTEGER DEFAULT 0,
      is_enabled INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      FOREIGN KEY (default_emulator_id) REFERENCES emulators(id) ON DELETE SET NULL
    );

    -- Emulators table
    CREATE TABLE IF NOT EXISTS emulators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      author TEXT,
      website TEXT,
      download_url TEXT,
      supported_systems TEXT NOT NULL,
      executable_path TEXT,
      install_path TEXT,
      config_path TEXT,
      bios_path TEXT,
      save_path TEXT,
      state_path TEXT,
      screenshot_path TEXT,
      is_installed INTEGER DEFAULT 0,
      is_default TEXT,
      launch_args TEXT,
      config_schema TEXT,
      installed_version TEXT,
      latest_version TEXT,
      update_available INTEGER DEFAULT 0,
      last_checked INTEGER,
      capabilities TEXT
    );

    -- Controller Profiles table
    CREATE TABLE IF NOT EXISTS controller_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      device_id TEXT,
      device_name TEXT,
      vendor_id INTEGER,
      product_id INTEGER,
      mappings TEXT NOT NULL,
      stick_settings TEXT,
      trigger_settings TEXT,
      vibration TEXT,
      dead_zones TEXT,
      is_system_default TEXT,
      is_game_default TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    -- Save Files table
    CREATE TABLE IF NOT EXISTS save_files (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      emulator_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      modified_at INTEGER NOT NULL,
      description TEXT,
      screenshot_url TEXT,
      metadata TEXT,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (emulator_id) REFERENCES emulators(id) ON DELETE CASCADE
    );

    -- Save Backups table
    CREATE TABLE IF NOT EXISTS save_backups (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      files TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      is_auto INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    );

    -- Themes table
    CREATE TABLE IF NOT EXISTS themes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      author TEXT,
      version TEXT,
      preview_images TEXT,
      is_built_in INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      config TEXT NOT NULL,
      assets TEXT,
      layouts TEXT,
      animations TEXT,
      sounds TEXT
    );

    -- Downloads table
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      destination TEXT NOT NULL,
      progress REAL DEFAULT 0,
      total_size INTEGER DEFAULT 0,
      downloaded_size INTEGER DEFAULT 0,
      speed REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      error TEXT,
      retry_count INTEGER DEFAULT 0,
      started_at INTEGER,
      completed_at INTEGER,
      metadata TEXT
    );

    -- Scan Folders table
    CREATE TABLE IF NOT EXISTS scan_folders (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_managed INTEGER DEFAULT 0,
      recursive INTEGER DEFAULT 1,
      include_patterns TEXT,
      exclude_patterns TEXT,
      last_scanned INTEGER,
      game_count INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1
    );

    -- Collections table
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      artwork_url TEXT,
      game_ids TEXT,
      is_system INTEGER DEFAULT 0,
      system_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE
    );

    -- Play Sessions table
    CREATE TABLE IF NOT EXISTS play_sessions (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL,
      emulator_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (emulator_id) REFERENCES emulators(id) ON DELETE CASCADE
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Metadata Cache table
    CREATE TABLE IF NOT EXISTS metadata_cache (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      query TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_games_platform ON games(platform);
    CREATE INDEX IF NOT EXISTS idx_games_emulator ON games(emulator_id);
    CREATE INDEX IF NOT EXISTS idx_games_favorite ON games(is_favorite DESC);
    CREATE INDEX IF NOT EXISTS idx_games_last_played ON games(last_played DESC);
    CREATE INDEX IF NOT EXISTS idx_games_playtime ON games(playtime DESC);
    CREATE INDEX IF NOT EXISTS idx_games_added ON games(added_at DESC);
    CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
    CREATE INDEX IF NOT EXISTS idx_systems_enabled ON systems(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_emulators_installed ON emulators(is_installed);
    CREATE INDEX IF NOT EXISTS idx_save_files_game ON save_files(game_id);
    CREATE INDEX IF NOT EXISTS idx_save_files_emulator ON save_files(emulator_id);
    CREATE INDEX IF NOT EXISTS idx_save_backups_game ON save_backups(game_id);
    CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_game ON play_sessions(game_id);
    CREATE INDEX IF NOT EXISTS idx_play_sessions_started ON play_sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_metadata_cache_expires ON metadata_cache(expires_at);
  `)
}

// Lazy-prepared statements
let statements: Record<string, Database.Statement> = {}

function getStmt(name: string, sql: string): Database.Statement {
  if (!statements[name]) {
    statements[name] = getDb().prepare(sql)
  }
  return statements[name]
}

// Games
const INSERT_GAME_SQL = `
  INSERT OR REPLACE INTO games 
  (id, name, platform, file_path, emulator_id, artwork_url, background_url, description, developer, publisher, release_date, genre, region, is_favorite, last_played, playtime, launch_count, save_paths, game_settings, emulator_settings, controller_profile_id, updated_at)
  VALUES (@id, @name, @platform, @file_path, @emulator_id, @artwork_url, @background_url, @description, @developer, @publisher, @release_date, @genre, @region, @is_favorite, @last_played, @playtime, @launch_count, @save_paths, @game_settings, @emulator_settings, @controller_profile_id, strftime('%s', 'now'))
`

const UPDATE_GAME_PLAY_STATS_SQL = `
  UPDATE games SET 
    last_played = strftime('%s', 'now'),
    playtime = playtime + ?,
    launch_count = launch_count + 1,
    updated_at = strftime('%s', 'now')
  WHERE id = ?
`

const UPDATE_GAME_FAVORITE_SQL = 'UPDATE games SET is_favorite = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?'
const UPDATE_GAME_EMULATOR_SQL = 'UPDATE games SET emulator_id = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?'
const UPDATE_GAME_SETTINGS_SQL = 'UPDATE games SET game_settings = ?, emulator_settings = ?, controller_profile_id = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?'
const UPDATE_GAME_ARTWORK_SQL = 'UPDATE games SET artwork_url = ?, background_url = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?'

const UPDATE_SYSTEM_GAME_COUNT_SQL = 'UPDATE systems SET game_count = ? WHERE id = ?'
const UPDATE_SYSTEM_DEFAULT_EMULATOR_SQL = 'UPDATE systems SET default_emulator_id = ? WHERE id = ?'

const UPDATE_EMULATOR_INSTALL_SQL = 'UPDATE emulators SET is_installed = ?, executable_path = ?, install_path = ?, config_path = ?, bios_path = ?, save_path = ?, state_path = ?, screenshot_path = ?, installed_version = ?, updated_at = strftime(\'%s\', \'now\') WHERE id = ?'
// Note: emulators table doesn't have updated_at column, so we skip it in UPDATE_EMULATOR_DEFAULT and UPDATE_EMULATOR_VERSION
const UPDATE_EMULATOR_DEFAULT_SQL = 'UPDATE emulators SET is_default = ? WHERE id = ?'
const UPDATE_EMULATOR_VERSION_SQL = 'UPDATE emulators SET latest_version = ?, update_available = ?, last_checked = strftime(\'%s\', \'now\') WHERE id = ?'

const UPDATE_CONTROLLER_PROFILE_SQL = `
  INSERT OR REPLACE INTO controller_profiles 
  (id, name, type, device_id, device_name, vendor_id, product_id, mappings, stick_settings, trigger_settings, vibration, dead_zones, is_system_default, is_game_default, updated_at)
  VALUES (@id, @name, @type, @device_id, @device_name, @vendor_id, @product_id, @mappings, @stick_settings, @trigger_settings, @vibration, @dead_zones, @is_system_default, @is_game_default, strftime('%s', 'now'))
`

const UPDATE_SAVE_BACKUP_SQL = `
  INSERT INTO save_backups (id, game_id, name, description, files, size, path, is_auto)
  VALUES (@id, @game_id, @name, @description, @files, @size, @path, @is_auto)
`

const UPDATE_THEME_SQL = `
  INSERT OR REPLACE INTO themes 
  (id, name, display_name, description, author, version, preview_images, is_built_in, is_active, config, assets, layouts, animations, sounds)
  VALUES (@id, @name, @display_name, @description, @author, @version, @preview_images, @is_built_in, @is_active, @config, @assets, @layouts, @animations, @sounds)
`

const SET_ACTIVE_THEME_SQL = 'UPDATE themes SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END'

const UPDATE_DOWNLOAD_PROGRESS_SQL = 'UPDATE downloads SET progress = ?, downloaded_size = ?, speed = ?, status = ? WHERE id = ?'
const UPDATE_DOWNLOAD_COMPLETE_SQL = 'UPDATE downloads SET progress = 1, downloaded_size = total_size, speed = 0, status = \'completed\', completed_at = strftime(\'%s\', \'now\') WHERE id = ?'
const UPDATE_DOWNLOAD_ERROR_SQL = 'UPDATE downloads SET status = \'failed\', error = ?, retry_count = retry_count + 1 WHERE id = ?'

const UPDATE_SCAN_FOLDER_STATS_SQL = 'UPDATE scan_folders SET last_scanned = strftime(\'%s\', \'now\'), game_count = ? WHERE id = ?'

const UPDATE_COLLECTION_SQL = `
  INSERT OR REPLACE INTO collections (id, name, description, artwork_url, game_ids, is_system, system_id, updated_at)
  VALUES (@id, @name, @description, @artwork_url, @game_ids, @is_system, @system_id, strftime('%s', 'now'))
`

const UPDATE_PLAY_SESSION_END_SQL = 'UPDATE play_sessions SET ended_at = ?, duration = ?, is_completed = ? WHERE id = ?'

const SET_SETTING_SQL = 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'

const INSERT_METADATA_CACHE_SQL = `
  INSERT OR REPLACE INTO metadata_cache (id, source, query, result, expires_at)
  VALUES (@id, @source, @query, @result, @expires_at)
`

const CLEAN_METADATA_CACHE_SQL = 'DELETE FROM metadata_cache WHERE expires_at < strftime(\'%s\', \'now\')'

// SELECT statements
const GET_GAME_SQL = 'SELECT * FROM games WHERE id = ?'
const GET_GAME_BY_PATH_SQL = 'SELECT * FROM games WHERE file_path = ?'
const GET_GAMES_SQL = 'SELECT * FROM games ORDER BY added_at DESC LIMIT ? OFFSET ?'
const SEARCH_GAMES_SQL = `
  SELECT * FROM games 
  WHERE name LIKE ? 
  ORDER BY 
    CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
    launch_count DESC
  LIMIT ?
`
const GET_GAMES_BY_PLATFORM_SQL = 'SELECT * FROM games WHERE platform = ? ORDER BY name ASC'
const GET_GAMES_BY_EMULATOR_SQL = 'SELECT * FROM games WHERE emulator_id = ? ORDER BY name ASC'
const GET_FAVORITE_GAMES_SQL = 'SELECT * FROM games WHERE is_favorite = 1 ORDER BY last_played DESC NULLS LAST'
const GET_RECENTLY_PLAYED_SQL = 'SELECT * FROM games WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT ?'
const GET_MOST_PLAYED_SQL = 'SELECT * FROM games ORDER BY playtime DESC LIMIT ?'
const GET_RECENTLY_ADDED_SQL = 'SELECT * FROM games ORDER BY added_at DESC LIMIT ?'
const DELETE_GAME_SQL = 'DELETE FROM games WHERE id = ?'
const GET_GAME_COUNT_SQL = 'SELECT COUNT(*) as count FROM games'
const GET_GAME_COUNT_BY_PLATFORM_SQL = 'SELECT platform, COUNT(*) as count FROM games GROUP BY platform'

const GET_SYSTEM_SQL = 'SELECT * FROM systems WHERE id = ?'
const GET_SYSTEMS_SQL = 'SELECT * FROM systems WHERE is_enabled = 1 ORDER BY "order" ASC, name ASC'
const GET_ALL_SYSTEMS_SQL = 'SELECT * FROM systems ORDER BY "order" ASC, name ASC'

const GET_EMULATOR_SQL = 'SELECT * FROM emulators WHERE id = ?'
const GET_EMULATORS_SQL = 'SELECT * FROM emulators ORDER BY name ASC'
const GET_INSTALLED_EMULATORS_SQL = 'SELECT * FROM emulators WHERE is_installed = 1 ORDER BY name ASC'
const GET_EMULATORS_FOR_SYSTEM_SQL = 'SELECT * FROM emulators WHERE supported_systems LIKE ? AND is_installed = 1 ORDER BY name ASC'

const GET_CONTROLLER_PROFILE_SQL = 'SELECT * FROM controller_profiles WHERE id = ?'
const GET_CONTROLLER_PROFILES_SQL = 'SELECT * FROM controller_profiles ORDER BY name ASC'
const GET_CONTROLLER_PROFILES_BY_TYPE_SQL = 'SELECT * FROM controller_profiles WHERE type = ? ORDER BY name ASC'
const GET_SYSTEM_DEFAULT_PROFILE_SQL = 'SELECT * FROM controller_profiles WHERE json_extract(is_system_default, "$." || ?) = 1 LIMIT 1'
const GET_GAME_DEFAULT_PROFILE_SQL = 'SELECT * FROM controller_profiles WHERE json_extract(is_game_default, "$." || ?) = 1 LIMIT 1'

const GET_SAVE_FILES_SQL = 'SELECT * FROM save_files WHERE game_id = ? ORDER BY modified_at DESC'
const GET_SAVE_FILES_BY_EMULATOR_SQL = 'SELECT * FROM save_files WHERE emulator_id = ? ORDER BY modified_at DESC'
const DELETE_SAVE_FILE_SQL = 'DELETE FROM save_files WHERE id = ?'
const DELETE_GAME_SAVE_FILES_SQL = 'DELETE FROM save_files WHERE game_id = ?'

const GET_SAVE_BACKUPS_SQL = 'SELECT * FROM save_backups WHERE game_id = ? ORDER BY created_at DESC'
const GET_SAVE_BACKUP_SQL = 'SELECT * FROM save_backups WHERE id = ?'
const DELETE_SAVE_BACKUP_SQL = 'DELETE FROM save_backups WHERE id = ?'

const GET_THEME_SQL = 'SELECT * FROM themes WHERE id = ?'
const GET_THEMES_SQL = 'SELECT * FROM themes ORDER BY is_built_in DESC, name ASC'
const GET_ACTIVE_THEME_SQL = 'SELECT * FROM themes WHERE is_active = 1 LIMIT 1'

const GET_DOWNLOAD_SQL = 'SELECT * FROM downloads WHERE id = ?'
const GET_DOWNLOADS_SQL = 'SELECT * FROM downloads ORDER BY started_at DESC LIMIT ? OFFSET ?'
const GET_ACTIVE_DOWNLOADS_SQL = 'SELECT * FROM downloads WHERE status IN (\'pending\', \'downloading\', \'paused\') ORDER BY started_at ASC'
const DELETE_DOWNLOAD_SQL = 'DELETE FROM downloads WHERE id = ?'
const CLEAR_COMPLETED_DOWNLOADS_SQL = 'DELETE FROM downloads WHERE status IN (\'completed\', \'failed\', \'cancelled\')'

const GET_SCAN_FOLDERS_SQL = 'SELECT * FROM scan_folders WHERE enabled = 1 ORDER BY name ASC'
const GET_ALL_SCAN_FOLDERS_SQL = 'SELECT * FROM scan_folders ORDER BY name ASC'
const DELETE_SCAN_FOLDER_SQL = 'DELETE FROM scan_folders WHERE id = ?'

const GET_COLLECTION_SQL = 'SELECT * FROM collections WHERE id = ?'
const GET_COLLECTIONS_SQL = 'SELECT * FROM collections ORDER BY is_system DESC, name ASC'
const GET_SYSTEM_COLLECTIONS_SQL = 'SELECT * FROM collections WHERE system_id = ? ORDER BY name ASC'
const DELETE_COLLECTION_SQL = 'DELETE FROM collections WHERE id = ?'

const GET_PLAY_SESSIONS_SQL = 'SELECT * FROM play_sessions WHERE game_id = ? ORDER BY started_at DESC LIMIT ?'
const GET_RECENT_SESSIONS_SQL = 'SELECT * FROM play_sessions ORDER BY started_at DESC LIMIT ?'

const GET_SETTING_SQL = 'SELECT value FROM settings WHERE key = ?'
const DELETE_SETTING_SQL = 'DELETE FROM settings WHERE key = ?'
const GET_ALL_SETTINGS_SQL = 'SELECT key, value FROM settings'

const GET_METADATA_CACHE_SQL = 'SELECT * FROM metadata_cache WHERE source = ? AND query = ? AND expires_at > strftime(\'%s\', \'now\')'

export const database = {
  // Games
  insertGame: (game: any) => getStmt('INSERT_GAME', INSERT_GAME_SQL).run(game),
  getGame: (id: string) => getStmt('GET_GAME', GET_GAME_SQL).get(id),
  getGameByPath: (filePath: string) => getStmt('GET_GAME_BY_PATH', GET_GAME_BY_PATH_SQL).get(filePath),
  getGames: (limit: number, offset: number) => getStmt('GET_GAMES', GET_GAMES_SQL).all(limit, offset),
  searchGames: (query: string, limit: number) => {
    const likeQuery = `%${query}%`
    return getStmt('SEARCH_GAMES', SEARCH_GAMES_SQL).all(likeQuery, likeQuery, limit)
  },
  getGamesByPlatform: (platform: string) => getStmt('GET_GAMES_BY_PLATFORM', GET_GAMES_BY_PLATFORM_SQL).all(platform),
  getGamesByEmulator: (emulatorId: string) => getStmt('GET_GAMES_BY_EMULATOR', GET_GAMES_BY_EMULATOR_SQL).all(emulatorId),
  getFavoriteGames: () => getStmt('GET_FAVORITE_GAMES', GET_FAVORITE_GAMES_SQL).all(),
  getRecentlyPlayed: (limit: number) => getStmt('GET_RECENTLY_PLAYED', GET_RECENTLY_PLAYED_SQL).all(limit),
  getMostPlayed: (limit: number) => getStmt('GET_MOST_PLAYED', GET_MOST_PLAYED_SQL).all(limit),
  getRecentlyAdded: (limit: number) => getStmt('GET_RECENTLY_ADDED', GET_RECENTLY_ADDED_SQL).all(limit),
  updateGamePlayStats: (id: string, playtime: number) => getStmt('UPDATE_GAME_PLAY_STATS', UPDATE_GAME_PLAY_STATS_SQL).run(playtime, id),
  updateGameFavorite: (id: string, isFavorite: number) => getStmt('UPDATE_GAME_FAVORITE', UPDATE_GAME_FAVORITE_SQL).run(isFavorite, id),
  updateGameEmulator: (id: string, emulatorId: string) => getStmt('UPDATE_GAME_EMULATOR', UPDATE_GAME_EMULATOR_SQL).run(emulatorId, id),
  updateGameSettings: (id: string, gameSettings: string, emulatorSettings: string, controllerProfileId: string) => 
    getStmt('UPDATE_GAME_SETTINGS', UPDATE_GAME_SETTINGS_SQL).run(gameSettings, emulatorSettings, controllerProfileId, id),
  updateGameArtwork: (id: string, artworkUrl: string, backgroundUrl: string) => getStmt('UPDATE_GAME_ARTWORK', UPDATE_GAME_ARTWORK_SQL).run(artworkUrl, backgroundUrl, id),
  deleteGame: (id: string) => getStmt('DELETE_GAME', DELETE_GAME_SQL).run(id),
  getGameCount: () => getStmt('GET_GAME_COUNT', GET_GAME_COUNT_SQL).get(),
  getGameCountByPlatform: () => getStmt('GET_GAME_COUNT_BY_PLATFORM', GET_GAME_COUNT_BY_PLATFORM_SQL).all(),

  // Systems
  insertSystem: (system: any) => getStmt('INSERT_SYSTEM', 'INSERT OR REPLACE INTO systems (id, name, short_name, manufacturer, generation, release_year, description, logo_url, banner_url, background_url, color, extensions, bios_files, default_emulator_id, game_count, is_enabled, "order") VALUES (@id, @name, @short_name, @manufacturer, @generation, @release_year, @description, @logo_url, @banner_url, @background_url, @color, @extensions, @bios_files, @default_emulator_id, @game_count, @is_enabled, @order)').run(system),
  getSystem: (id: string) => getStmt('GET_SYSTEM', GET_SYSTEM_SQL).get(id),
  getSystems: () => getStmt('GET_SYSTEMS', GET_SYSTEMS_SQL).all(),
  getAllSystems: () => getStmt('GET_ALL_SYSTEMS', GET_ALL_SYSTEMS_SQL).all(),
  updateSystemGameCount: (id: string, count: number) => getStmt('UPDATE_SYSTEM_GAME_COUNT', UPDATE_SYSTEM_GAME_COUNT_SQL).run(count, id),
  updateSystemDefaultEmulator: (id: string, emulatorId: string) => getStmt('UPDATE_SYSTEM_DEFAULT_EMULATOR', UPDATE_SYSTEM_DEFAULT_EMULATOR_SQL).run(emulatorId, id),

  // Emulators
  insertEmulator: (emulator: any) => getStmt('INSERT_EMULATOR', 'INSERT OR REPLACE INTO emulators (id, name, version, display_name, description, author, website, download_url, supported_systems, executable_path, install_path, config_path, bios_path, save_path, state_path, screenshot_path, is_installed, is_default, launch_args, config_schema, installed_version, latest_version, update_available, last_checked, capabilities) VALUES (@id, @name, @version, @display_name, @description, @author, @website, @download_url, @supported_systems, @executable_path, @install_path, @config_path, @bios_path, @save_path, @state_path, @screenshot_path, @is_installed, @is_default, @launch_args, @config_schema, @installed_version, @latest_version, @update_available, @last_checked, @capabilities)').run(emulator),
  getEmulator: (id: string) => getStmt('GET_EMULATOR', GET_EMULATOR_SQL).get(id),
  getEmulators: () => getStmt('GET_EMULATORS', GET_EMULATORS_SQL).all(),
  getInstalledEmulators: () => getStmt('GET_INSTALLED_EMULATORS', GET_INSTALLED_EMULATORS_SQL).all(),
  getEmulatorsForSystem: (systemId: string) => getStmt('GET_EMULATORS_FOR_SYSTEM', GET_EMULATORS_FOR_SYSTEM_SQL).all(`%${systemId}%`),
  updateEmulatorInstall: (id: string, isInstalled: number, executablePath: string, installPath: string, configPath: string, biosPath: string, savePath: string, statePath: string, screenshotPath: string, installedVersion: string) => 
    getStmt('UPDATE_EMULATOR_INSTALL', UPDATE_EMULATOR_INSTALL_SQL).run(isInstalled, executablePath, installPath, configPath, biosPath, savePath, statePath, screenshotPath, installedVersion, id),
  updateEmulatorDefault: (id: string, isDefault: string) => getStmt('UPDATE_EMULATOR_DEFAULT', UPDATE_EMULATOR_DEFAULT_SQL).run(isDefault, id),
  updateEmulatorVersion: (id: string, latestVersion: string, updateAvailable: number) => getStmt('UPDATE_EMULATOR_VERSION', UPDATE_EMULATOR_VERSION_SQL).run(latestVersion, updateAvailable, id),

  // Controller Profiles
  insertControllerProfile: (profile: any) => getStmt('INSERT_CONTROLLER_PROFILE', UPDATE_CONTROLLER_PROFILE_SQL).run(profile),
  getControllerProfile: (id: string) => getStmt('GET_CONTROLLER_PROFILE', GET_CONTROLLER_PROFILE_SQL).get(id),
  getControllerProfiles: () => getStmt('GET_CONTROLLER_PROFILES', GET_CONTROLLER_PROFILES_SQL).all(),
  getControllerProfilesByType: (type: string) => getStmt('GET_CONTROLLER_PROFILES_BY_TYPE', GET_CONTROLLER_PROFILES_BY_TYPE_SQL).all(type),
  getSystemDefaultProfile: (systemId: string) => getStmt('GET_SYSTEM_DEFAULT_PROFILE', GET_SYSTEM_DEFAULT_PROFILE_SQL).get(systemId),
  getGameDefaultProfile: (gameId: string) => getStmt('GET_GAME_DEFAULT_PROFILE', GET_GAME_DEFAULT_PROFILE_SQL).get(gameId),

  // Save Files
  insertSaveFile: (saveFile: any) => getStmt('INSERT_SAVE_FILE', 'INSERT OR REPLACE INTO save_files (id, game_id, emulator_id, type, name, path, size, modified_at, description, screenshot_url, metadata) VALUES (@id, @game_id, @emulator_id, @type, @name, @path, @size, @modified_at, @description, @screenshot_url, @metadata)').run(saveFile),
  getSaveFiles: (gameId: string) => getStmt('GET_SAVE_FILES', GET_SAVE_FILES_SQL).all(gameId),
  getSaveFilesByEmulator: (emulatorId: string) => getStmt('GET_SAVE_FILES_BY_EMULATOR', GET_SAVE_FILES_BY_EMULATOR_SQL).all(emulatorId),
  deleteSaveFile: (id: string) => getStmt('DELETE_SAVE_FILE', DELETE_SAVE_FILE_SQL).run(id),
  deleteGameSaveFiles: (gameId: string) => getStmt('DELETE_GAME_SAVE_FILES', DELETE_GAME_SAVE_FILES_SQL).run(gameId),

  // Save Backups
  insertSaveBackup: (backup: any) => getStmt('INSERT_SAVE_BACKUP', UPDATE_SAVE_BACKUP_SQL).run(backup),
  getSaveBackups: (gameId: string) => getStmt('GET_SAVE_BACKUPS', GET_SAVE_BACKUPS_SQL).all(gameId),
  getSaveBackup: (id: string) => getStmt('GET_SAVE_BACKUP', GET_SAVE_BACKUP_SQL).get(id),
  deleteSaveBackup: (id: string) => getStmt('DELETE_SAVE_BACKUP', DELETE_SAVE_BACKUP_SQL).run(id),

  // Themes
  insertTheme: (theme: any) => getStmt('INSERT_THEME', UPDATE_THEME_SQL).run(theme),
  getTheme: (id: string) => getStmt('GET_THEME', GET_THEME_SQL).get(id),
  getThemes: () => getStmt('GET_THEMES', GET_THEMES_SQL).all(),
  getActiveTheme: () => getStmt('GET_ACTIVE_THEME', GET_ACTIVE_THEME_SQL).get(),
  setActiveTheme: (id: string) => getStmt('SET_ACTIVE_THEME', SET_ACTIVE_THEME_SQL).run(id),

  // Downloads
  insertDownload: (download: any) => getStmt('INSERT_DOWNLOAD', 'INSERT INTO downloads (id, type, name, url, destination, progress, total_size, downloaded_size, speed, status, error, retry_count, started_at, completed_at, metadata) VALUES (@id, @type, @name, @url, @destination, @progress, @total_size, @downloaded_size, @speed, @status, @error, @retry_count, @started_at, @completed_at, @metadata)').run(download),
  getDownload: (id: string) => getStmt('GET_DOWNLOAD', GET_DOWNLOAD_SQL).get(id),
  getDownloads: (limit: number, offset: number) => getStmt('GET_DOWNLOADS', GET_DOWNLOADS_SQL).all(limit, offset),
  getActiveDownloads: () => getStmt('GET_ACTIVE_DOWNLOADS', GET_ACTIVE_DOWNLOADS_SQL).all(),
  updateDownloadProgress: (id: string, progress: number, downloadedSize: number, speed: number, status: string) => getStmt('UPDATE_DOWNLOAD_PROGRESS', UPDATE_DOWNLOAD_PROGRESS_SQL).run(progress, downloadedSize, speed, status, id),
  updateDownloadComplete: (id: string) => getStmt('UPDATE_DOWNLOAD_COMPLETE', UPDATE_DOWNLOAD_COMPLETE_SQL).run(id),
  updateDownloadError: (id: string, error: string) => getStmt('UPDATE_DOWNLOAD_ERROR', UPDATE_DOWNLOAD_ERROR_SQL).run(error, id),
  deleteDownload: (id: string) => getStmt('DELETE_DOWNLOAD', DELETE_DOWNLOAD_SQL).run(id),
  clearCompletedDownloads: () => getStmt('CLEAR_COMPLETED_DOWNLOADS', CLEAR_COMPLETED_DOWNLOADS_SQL).run(),

  // Scan Folders
  insertScanFolder: (folder: any) => getStmt('INSERT_SCAN_FOLDER', 'INSERT OR REPLACE INTO scan_folders (id, path, name, is_managed, recursive, include_patterns, exclude_patterns, last_scanned, game_count, enabled) VALUES (@id, @path, @name, @is_managed, @recursive, @include_patterns, @exclude_patterns, @last_scanned, @game_count, @enabled)').run(folder),
  getScanFolders: () => getStmt('GET_SCAN_FOLDERS', GET_SCAN_FOLDERS_SQL).all(),
  getAllScanFolders: () => getStmt('GET_ALL_SCAN_FOLDERS', GET_ALL_SCAN_FOLDERS_SQL).all(),
  updateScanFolderStats: (id: string, gameCount: number) => getStmt('UPDATE_SCAN_FOLDER_STATS', UPDATE_SCAN_FOLDER_STATS_SQL).run(gameCount, id),
  deleteScanFolder: (id: string) => getStmt('DELETE_SCAN_FOLDER', DELETE_SCAN_FOLDER_SQL).run(id),

  // Collections
  insertCollection: (collection: any) => getStmt('INSERT_COLLECTION', UPDATE_COLLECTION_SQL).run(collection),
  getCollection: (id: string) => getStmt('GET_COLLECTION', GET_COLLECTION_SQL).get(id),
  getCollections: () => getStmt('GET_COLLECTIONS', GET_COLLECTIONS_SQL).all(),
  getSystemCollections: (systemId: string) => getStmt('GET_SYSTEM_COLLECTIONS', GET_SYSTEM_COLLECTIONS_SQL).all(systemId),
  deleteCollection: (id: string) => getStmt('DELETE_COLLECTION', DELETE_COLLECTION_SQL).run(id),

  // Play Sessions
  insertPlaySession: (session: any) => getStmt('INSERT_PLAY_SESSION', 'INSERT INTO play_sessions (id, game_id, emulator_id, started_at, ended_at, duration, is_completed) VALUES (@id, @game_id, @emulator_id, @started_at, @ended_at, @duration, @is_completed)').run(session),
  getPlaySessions: (gameId: string, limit: number) => getStmt('GET_PLAY_SESSIONS', GET_PLAY_SESSIONS_SQL).all(gameId, limit),
  getRecentSessions: (limit: number) => getStmt('GET_RECENT_SESSIONS', GET_RECENT_SESSIONS_SQL).all(limit),
  updatePlaySessionEnd: (id: string, endedAt: number, duration: number, isCompleted: number) => getStmt('UPDATE_PLAY_SESSION_END', UPDATE_PLAY_SESSION_END_SQL).run(endedAt, duration, isCompleted, id),

  // Settings
  getSetting: (key: string) => {
    const row = getStmt('GET_SETTING', GET_SETTING_SQL).get(key)
    return row ? JSON.parse(row.value) : null
  },
  setSetting: (key: string, value: any) => getStmt('SET_SETTING', SET_SETTING_SQL).run(key, JSON.stringify(value)),
  deleteSetting: (key: string) => getStmt('DELETE_SETTING', DELETE_SETTING_SQL).run(key),
  getAllSettings: () => {
    const rows = getStmt('GET_ALL_SETTINGS', GET_ALL_SETTINGS_SQL).all()
    const settings: Record<string, any> = {}
    for (const row of rows) {
      settings[row.key] = JSON.parse(row.value)
    }
    return settings
  },

  // Metadata Cache
  insertMetadataCache: (cache: any) => getStmt('INSERT_METADATA_CACHE', INSERT_METADATA_CACHE_SQL).run(cache),
  getMetadataCache: (source: string, query: string) => getStmt('GET_METADATA_CACHE', GET_METADATA_CACHE_SQL).get(source, query),
  cleanMetadataCache: () => getStmt('CLEAN_METADATA_CACHE', CLEAN_METADATA_CACHE_SQL).run(),

  // Utility
  close: () => { if (db) { db.close(); db = null } },
  backup: (destPath: string) => getDb().backup(destPath),
  exec: (sql: string) => getDb().exec(sql),
  prepare: (sql: string) => getDb().prepare(sql),
  transaction: (fn: () => void) => getDb().transaction(fn)(),
}

export default database