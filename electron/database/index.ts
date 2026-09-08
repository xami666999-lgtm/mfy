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

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 10000')

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

const INSERT_GAME = db.prepare(`
  INSERT OR REPLACE INTO games 
  (id, name, platform, file_path, emulator_id, artwork_url, background_url, description, developer, publisher, release_date, genre, region, is_favorite, last_played, playtime, launch_count, save_paths, game_settings, emulator_settings, controller_profile_id, updated_at)
  VALUES (@id, @name, @platform, @file_path, @emulator_id, @artwork_url, @background_url, @description, @developer, @publisher, @release_date, @genre, @region, @is_favorite, @last_played, @playtime, @launch_count, @save_paths, @game_settings, @emulator_settings, @controller_profile_id, strftime('%s', 'now'))
`)

const GET_GAME = db.prepare('SELECT * FROM games WHERE id = ?')
const GET_GAME_BY_PATH = db.prepare('SELECT * FROM games WHERE file_path = ?')
const GET_GAMES = db.prepare('SELECT * FROM games ORDER BY added_at DESC LIMIT ? OFFSET ?')
const SEARCH_GAMES = db.prepare(`
  SELECT * FROM games 
  WHERE name LIKE ? 
  ORDER BY 
    CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
    launch_count DESC
  LIMIT ?
`)
const GET_GAMES_BY_PLATFORM = db.prepare('SELECT * FROM games WHERE platform = ? ORDER BY name ASC')
const GET_GAMES_BY_EMULATOR = db.prepare('SELECT * FROM games WHERE emulator_id = ? ORDER BY name ASC')
const GET_FAVORITE_GAMES = db.prepare('SELECT * FROM games WHERE is_favorite = 1 ORDER BY last_played DESC NULLS LAST')
const GET_RECENTLY_PLAYED = db.prepare('SELECT * FROM games WHERE last_played IS NOT NULL ORDER BY last_played DESC LIMIT ?')
const GET_MOST_PLAYED = db.prepare('SELECT * FROM games ORDER BY playtime DESC LIMIT ?')
const GET_RECENTLY_ADDED = db.prepare('SELECT * FROM games ORDER BY added_at DESC LIMIT ?')
const UPDATE_GAME_PLAY_STATS = db.prepare(`
  UPDATE games SET 
    last_played = strftime('%s', 'now'),
    playtime = playtime + ?,
    launch_count = launch_count + 1,
    updated_at = strftime('%s', 'now')
  WHERE id = ?
`)
const UPDATE_GAME_FAVORITE = db.prepare('UPDATE games SET is_favorite = ?, updated_at = strftime("%s", "now") WHERE id = ?')
const UPDATE_GAME_EMULATOR = db.prepare('UPDATE games SET emulator_id = ?, updated_at = strftime("%s", "now") WHERE id = ?')
const UPDATE_GAME_SETTINGS = db.prepare('UPDATE games SET game_settings = ?, emulator_settings = ?, controller_profile_id = ?, updated_at = strftime("%s", "now") WHERE id = ?')
const UPDATE_GAME_ARTWORK = db.prepare('UPDATE games SET artwork_url = ?, background_url = ?, updated_at = strftime("%s", "now") WHERE id = ?')
const DELETE_GAME = db.prepare('DELETE FROM games WHERE id = ?')
const GET_GAME_COUNT = db.prepare('SELECT COUNT(*) as count FROM games')
const GET_GAME_COUNT_BY_PLATFORM = db.prepare('SELECT platform, COUNT(*) as count FROM games GROUP BY platform')

const INSERT_SYSTEM = db.prepare(`
  INSERT OR REPLACE INTO systems 
  (id, name, short_name, manufacturer, generation, release_year, description, logo_url, banner_url, background_url, color, extensions, bios_files, default_emulator_id, game_count, is_enabled, "order")
  VALUES (@id, @name, @short_name, @manufacturer, @generation, @release_year, @description, @logo_url, @banner_url, @background_url, @color, @extensions, @bios_files, @default_emulator_id, @game_count, @is_enabled, @order)
`)

const GET_SYSTEM = db.prepare('SELECT * FROM systems WHERE id = ?')
const GET_SYSTEMS = db.prepare('SELECT * FROM systems WHERE is_enabled = 1 ORDER BY "order" ASC, name ASC')
const GET_ALL_SYSTEMS = db.prepare('SELECT * FROM systems ORDER BY "order" ASC, name ASC')
const UPDATE_SYSTEM_GAME_COUNT = db.prepare('UPDATE systems SET game_count = ? WHERE id = ?')
const UPDATE_SYSTEM_DEFAULT_EMULATOR = db.prepare('UPDATE systems SET default_emulator_id = ? WHERE id = ?')

const INSERT_EMULATOR = db.prepare(`
  INSERT OR REPLACE INTO emulators 
  (id, name, version, display_name, description, author, website, download_url, supported_systems, executable_path, install_path, config_path, bios_path, save_path, state_path, screenshot_path, is_installed, is_default, launch_args, config_schema, installed_version, latest_version, update_available, last_checked, capabilities)
  VALUES (@id, @name, @version, @display_name, @description, @author, @website, @download_url, @supported_systems, @executable_path, @install_path, @config_path, @bios_path, @save_path, @state_path, @screenshot_path, @is_installed, @is_default, @launch_args, @config_schema, @installed_version, @latest_version, @update_available, @last_checked, @capabilities)
`)

const GET_EMULATOR = db.prepare('SELECT * FROM emulators WHERE id = ?')
const GET_EMULATORS = db.prepare('SELECT * FROM emulators ORDER BY name ASC')
const GET_INSTALLED_EMULATORS = db.prepare('SELECT * FROM emulators WHERE is_installed = 1 ORDER BY name ASC')
const GET_EMULATORS_FOR_SYSTEM = db.prepare('SELECT * FROM emulators WHERE supported_systems LIKE ? AND is_installed = 1 ORDER BY name ASC')
const UPDATE_EMULATOR_INSTALL = db.prepare('UPDATE emulators SET is_installed = ?, executable_path = ?, install_path = ?, config_path = ?, bios_path = ?, save_path = ?, state_path = ?, screenshot_path = ?, installed_version = ?, updated_at = strftime("%s", "now") WHERE id = ?')
const UPDATE_EMULATOR_DEFAULT = db.prepare('UPDATE emulators SET is_default = ? WHERE id = ?')
const UPDATE_EMULATOR_VERSION = db.prepare('UPDATE emulators SET latest_version = ?, update_available = ?, last_checked = strftime("%s", "now") WHERE id = ?')

const INSERT_CONTROLLER_PROFILE = db.prepare(`
  INSERT OR REPLACE INTO controller_profiles 
  (id, name, type, device_id, device_name, vendor_id, product_id, mappings, stick_settings, trigger_settings, vibration, dead_zones, is_system_default, is_game_default, updated_at)
  VALUES (@id, @name, @type, @device_id, @device_name, @vendor_id, @product_id, @mappings, @stick_settings, @trigger_settings, @vibration, @dead_zones, @is_system_default, @is_game_default, strftime('%s', 'now'))
`)

const GET_CONTROLLER_PROFILE = db.prepare('SELECT * FROM controller_profiles WHERE id = ?')
const GET_CONTROLLER_PROFILES = db.prepare('SELECT * FROM controller_profiles ORDER BY name ASC')
const GET_CONTROLLER_PROFILES_BY_TYPE = db.prepare('SELECT * FROM controller_profiles WHERE type = ? ORDER BY name ASC')
const GET_SYSTEM_DEFAULT_PROFILE = db.prepare('SELECT * FROM controller_profiles WHERE json_extract(is_system_default, "$." || ?) = 1 LIMIT 1')
const GET_GAME_DEFAULT_PROFILE = db.prepare('SELECT * FROM controller_profiles WHERE json_extract(is_game_default, "$." || ?) = 1 LIMIT 1')

const INSERT_SAVE_FILE = db.prepare(`
  INSERT OR REPLACE INTO save_files 
  (id, game_id, emulator_id, type, name, path, size, modified_at, description, screenshot_url, metadata)
  VALUES (@id, @game_id, @emulator_id, @type, @name, @path, @size, @modified_at, @description, @screenshot_url, @metadata)
`)

const GET_SAVE_FILES = db.prepare('SELECT * FROM save_files WHERE game_id = ? ORDER BY modified_at DESC')
const GET_SAVE_FILES_BY_EMULATOR = db.prepare('SELECT * FROM save_files WHERE emulator_id = ? ORDER BY modified_at DESC')
const DELETE_SAVE_FILE = db.prepare('DELETE FROM save_files WHERE id = ?')
const DELETE_GAME_SAVE_FILES = db.prepare('DELETE FROM save_files WHERE game_id = ?')

const INSERT_SAVE_BACKUP = db.prepare(`
  INSERT INTO save_backups (id, game_id, name, description, files, size, path, is_auto)
  VALUES (@id, @game_id, @name, @description, @files, @size, @path, @is_auto)
`)

const GET_SAVE_BACKUPS = db.prepare('SELECT * FROM save_backups WHERE game_id = ? ORDER BY created_at DESC')
const GET_SAVE_BACKUP = db.prepare('SELECT * FROM save_backups WHERE id = ?')
const DELETE_SAVE_BACKUP = db.prepare('DELETE FROM save_backups WHERE id = ?')

const INSERT_THEME = db.prepare(`
  INSERT OR REPLACE INTO themes 
  (id, name, display_name, description, author, version, preview_images, is_built_in, is_active, config, assets, layouts, animations, sounds)
  VALUES (@id, @name, @display_name, @description, @author, @version, @preview_images, @is_built_in, @is_active, @config, @assets, @layouts, @animations, @sounds)
`)

const GET_THEME = db.prepare('SELECT * FROM themes WHERE id = ?')
const GET_THEMES = db.prepare('SELECT * FROM themes ORDER BY is_built_in DESC, name ASC')
const GET_ACTIVE_THEME = db.prepare('SELECT * FROM themes WHERE is_active = 1 LIMIT 1')
const SET_ACTIVE_THEME = db.prepare('UPDATE themes SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END')

const INSERT_DOWNLOAD = db.prepare(`
  INSERT INTO downloads (id, type, name, url, destination, progress, total_size, downloaded_size, speed, status, error, retry_count, started_at, completed_at, metadata)
  VALUES (@id, @type, @name, @url, @destination, @progress, @total_size, @downloaded_size, @speed, @status, @error, @retry_count, @started_at, @completed_at, @metadata)
`)

const GET_DOWNLOAD = db.prepare('SELECT * FROM downloads WHERE id = ?')
const GET_DOWNLOADS = db.prepare('SELECT * FROM downloads ORDER BY started_at DESC LIMIT ? OFFSET ?')
const GET_ACTIVE_DOWNLOADS = db.prepare("SELECT * FROM downloads WHERE status IN ('pending', 'downloading', 'paused') ORDER BY started_at ASC")
const UPDATE_DOWNLOAD_PROGRESS = db.prepare('UPDATE downloads SET progress = ?, downloaded_size = ?, speed = ?, status = ? WHERE id = ?')
const UPDATE_DOWNLOAD_COMPLETE = db.prepare('UPDATE downloads SET progress = 1, downloaded_size = total_size, speed = 0, status = "completed", completed_at = strftime("%s", "now") WHERE id = ?')
const UPDATE_DOWNLOAD_ERROR = db.prepare('UPDATE downloads SET status = "failed", error = ?, retry_count = retry_count + 1 WHERE id = ?')
const DELETE_DOWNLOAD = db.prepare('DELETE FROM downloads WHERE id = ?')
const CLEAR_COMPLETED_DOWNLOADS = db.prepare("DELETE FROM downloads WHERE status IN ('completed', 'failed', 'cancelled')")

const INSERT_SCAN_FOLDER = db.prepare(`
  INSERT OR REPLACE INTO scan_folders (id, path, name, is_managed, recursive, include_patterns, exclude_patterns, last_scanned, game_count, enabled)
  VALUES (@id, @path, @name, @is_managed, @recursive, @include_patterns, @exclude_patterns, @last_scanned, @game_count, @enabled)
`)

const GET_SCAN_FOLDERS = db.prepare('SELECT * FROM scan_folders WHERE enabled = 1 ORDER BY name ASC')
const GET_ALL_SCAN_FOLDERS = db.prepare('SELECT * FROM scan_folders ORDER BY name ASC')
const UPDATE_SCAN_FOLDER_STATS = db.prepare('UPDATE scan_folders SET last_scanned = strftime("%s", "now"), game_count = ? WHERE id = ?')
const DELETE_SCAN_FOLDER = db.prepare('DELETE FROM scan_folders WHERE id = ?')

const INSERT_COLLECTION = db.prepare(`
  INSERT OR REPLACE INTO collections (id, name, description, artwork_url, game_ids, is_system, system_id, updated_at)
  VALUES (@id, @name, @description, @artwork_url, @game_ids, @is_system, @system_id, strftime('%s', 'now'))
`)

const GET_COLLECTION = db.prepare('SELECT * FROM collections WHERE id = ?')
const GET_COLLECTIONS = db.prepare('SELECT * FROM collections ORDER BY is_system DESC, name ASC')
const GET_SYSTEM_COLLECTIONS = db.prepare('SELECT * FROM collections WHERE system_id = ? ORDER BY name ASC')
const DELETE_COLLECTION = db.prepare('DELETE FROM collections WHERE id = ?')

const INSERT_PLAY_SESSION = db.prepare(`
  INSERT INTO play_sessions (id, game_id, emulator_id, started_at, ended_at, duration, is_completed)
  VALUES (@id, @game_id, @emulator_id, @started_at, @ended_at, @duration, @is_completed)
`)

const GET_PLAY_SESSIONS = db.prepare('SELECT * FROM play_sessions WHERE game_id = ? ORDER BY started_at DESC LIMIT ?')
const GET_RECENT_SESSIONS = db.prepare('SELECT * FROM play_sessions ORDER BY started_at DESC LIMIT ?')
const UPDATE_PLAY_SESSION_END = db.prepare('UPDATE play_sessions SET ended_at = ?, duration = ?, is_completed = ? WHERE id = ?')

const GET_SETTING = db.prepare('SELECT value FROM settings WHERE key = ?')
const SET_SETTING = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
const DELETE_SETTING = db.prepare('DELETE FROM settings WHERE key = ?')
const GET_ALL_SETTINGS = db.prepare('SELECT key, value FROM settings')

const INSERT_METADATA_CACHE = db.prepare(`
  INSERT OR REPLACE INTO metadata_cache (id, source, query, result, expires_at)
  VALUES (@id, @source, @query, @result, @expires_at)
`)

const GET_METADATA_CACHE = db.prepare('SELECT * FROM metadata_cache WHERE source = ? AND query = ? AND expires_at > strftime("%s", "now")')
const CLEAN_METADATA_CACHE = db.prepare('DELETE FROM metadata_cache WHERE expires_at < strftime("%s", "now")')

export const database = {
  // Games
  insertGame: (game: any) => INSERT_GAME.run(game),
  getGame: (id: string) => GET_GAME.get(id),
  getGameByPath: (filePath: string) => GET_GAME_BY_PATH.get(filePath),
  getGames: (limit: number, offset: number) => GET_GAMES.all(limit, offset),
  searchGames: (query: string, limit: number) => {
    const likeQuery = `%${query}%`
    return SEARCH_GAMES.all(likeQuery, likeQuery, limit)
  },
  getGamesByPlatform: (platform: string) => GET_GAMES_BY_PLATFORM.all(platform),
  getGamesByEmulator: (emulatorId: string) => GET_GAMES_BY_EMULATOR.all(emulatorId),
  getFavoriteGames: () => GET_FAVORITE_GAMES.all(),
  getRecentlyPlayed: (limit: number) => GET_RECENTLY_PLAYED.all(limit),
  getMostPlayed: (limit: number) => GET_MOST_PLAYED.all(limit),
  getRecentlyAdded: (limit: number) => GET_RECENTLY_ADDED.all(limit),
  updateGamePlayStats: (id: string, playtime: number) => UPDATE_GAME_PLAY_STATS.run(playtime, id),
  updateGameFavorite: (id: string, isFavorite: number) => UPDATE_GAME_FAVORITE.run(isFavorite, id),
  updateGameEmulator: (id: string, emulatorId: string) => UPDATE_GAME_EMULATOR.run(emulatorId, id),
  updateGameSettings: (id: string, gameSettings: string, emulatorSettings: string, controllerProfileId: string) => 
    UPDATE_GAME_SETTINGS.run(gameSettings, emulatorSettings, controllerProfileId, id),
  updateGameArtwork: (id: string, artworkUrl: string, backgroundUrl: string) => UPDATE_GAME_ARTWORK.run(artworkUrl, backgroundUrl, id),
  deleteGame: (id: string) => DELETE_GAME.run(id),
  getGameCount: () => GET_GAME_COUNT.get(),
  getGameCountByPlatform: () => GET_GAME_COUNT_BY_PLATFORM.all(),

  // Systems
  insertSystem: (system: any) => INSERT_SYSTEM.run(system),
  getSystem: (id: string) => GET_SYSTEM.get(id),
  getSystems: () => GET_SYSTEMS.all(),
  getAllSystems: () => GET_ALL_SYSTEMS.all(),
  updateSystemGameCount: (id: string, count: number) => UPDATE_SYSTEM_GAME_COUNT.run(count, id),
  updateSystemDefaultEmulator: (id: string, emulatorId: string) => UPDATE_SYSTEM_DEFAULT_EMULATOR.run(emulatorId, id),

  // Emulators
  insertEmulator: (emulator: any) => INSERT_EMULATOR.run(emulator),
  getEmulator: (id: string) => GET_EMULATOR.get(id),
  getEmulators: () => GET_EMULATORS.all(),
  getInstalledEmulators: () => GET_INSTALLED_EMULATORS.all(),
  getEmulatorsForSystem: (systemId: string) => GET_EMULATORS_FOR_SYSTEM.all(`%${systemId}%`),
  updateEmulatorInstall: (id: string, isInstalled: number, executablePath: string, installPath: string, configPath: string, biosPath: string, savePath: string, statePath: string, screenshotPath: string, installedVersion: string) => 
    UPDATE_EMULATOR_INSTALL.run(isInstalled, executablePath, installPath, configPath, biosPath, savePath, statePath, screenshotPath, installedVersion, id),
  updateEmulatorDefault: (id: string, isDefault: string) => UPDATE_EMULATOR_DEFAULT.run(isDefault, id),
  updateEmulatorVersion: (id: string, latestVersion: string, updateAvailable: number) => UPDATE_EMULATOR_VERSION.run(latestVersion, updateAvailable, id),

  // Controller Profiles
  insertControllerProfile: (profile: any) => INSERT_CONTROLLER_PROFILE.run(profile),
  getControllerProfile: (id: string) => GET_CONTROLLER_PROFILE.get(id),
  getControllerProfiles: () => GET_CONTROLLER_PROFILES.all(),
  getControllerProfilesByType: (type: string) => GET_CONTROLLER_PROFILES_BY_TYPE.all(type),
  getSystemDefaultProfile: (systemId: string) => GET_SYSTEM_DEFAULT_PROFILE.get(systemId),
  getGameDefaultProfile: (gameId: string) => GET_GAME_DEFAULT_PROFILE.get(gameId),

  // Save Files
  insertSaveFile: (saveFile: any) => INSERT_SAVE_FILE.run(saveFile),
  getSaveFiles: (gameId: string) => GET_SAVE_FILES.all(gameId),
  getSaveFilesByEmulator: (emulatorId: string) => GET_SAVE_FILES_BY_EMULATOR.all(emulatorId),
  deleteSaveFile: (id: string) => DELETE_SAVE_FILE.run(id),
  deleteGameSaveFiles: (gameId: string) => DELETE_GAME_SAVE_FILES.run(gameId),

  // Save Backups
  insertSaveBackup: (backup: any) => INSERT_SAVE_BACKUP.run(backup),
  getSaveBackups: (gameId: string) => GET_SAVE_BACKUPS.all(gameId),
  getSaveBackup: (id: string) => GET_SAVE_BACKUP.get(id),
  deleteSaveBackup: (id: string) => DELETE_SAVE_BACKUP.run(id),

  // Themes
  insertTheme: (theme: any) => INSERT_THEME.run(theme),
  getTheme: (id: string) => GET_THEME.get(id),
  getThemes: () => GET_THEMES.all(),
  getActiveTheme: () => GET_ACTIVE_THEME.get(),
  setActiveTheme: (id: string) => SET_ACTIVE_THEME.run(id),

  // Downloads
  insertDownload: (download: any) => INSERT_DOWNLOAD.run(download),
  getDownload: (id: string) => GET_DOWNLOAD.get(id),
  getDownloads: (limit: number, offset: number) => GET_DOWNLOADS.all(limit, offset),
  getActiveDownloads: () => GET_ACTIVE_DOWNLOADS.all(),
  updateDownloadProgress: (id: string, progress: number, downloadedSize: number, speed: number, status: string) => UPDATE_DOWNLOAD_PROGRESS.run(progress, downloadedSize, speed, status, id),
  updateDownloadComplete: (id: string) => UPDATE_DOWNLOAD_COMPLETE.run(id),
  updateDownloadError: (id: string, error: string) => UPDATE_DOWNLOAD_ERROR.run(error, id),
  deleteDownload: (id: string) => DELETE_DOWNLOAD.run(id),
  clearCompletedDownloads: () => CLEAR_COMPLETED_DOWNLOADS.run(),

  // Scan Folders
  insertScanFolder: (folder: any) => INSERT_SCAN_FOLDER.run(folder),
  getScanFolders: () => GET_SCAN_FOLDERS.all(),
  getAllScanFolders: () => GET_ALL_SCAN_FOLDERS.all(),
  updateScanFolderStats: (id: string, gameCount: number) => UPDATE_SCAN_FOLDER_STATS.run(gameCount, id),
  deleteScanFolder: (id: string) => DELETE_SCAN_FOLDER.run(id),

  // Collections
  insertCollection: (collection: any) => INSERT_COLLECTION.run(collection),
  getCollection: (id: string) => GET_COLLECTION.get(id),
  getCollections: () => GET_COLLECTIONS.all(),
  getSystemCollections: (systemId: string) => GET_SYSTEM_COLLECTIONS.all(systemId),
  deleteCollection: (id: string) => DELETE_COLLECTION.run(id),

  // Play Sessions
  insertPlaySession: (session: any) => INSERT_PLAY_SESSION.run(session),
  getPlaySessions: (gameId: string, limit: number) => GET_PLAY_SESSIONS.all(gameId, limit),
  getRecentSessions: (limit: number) => GET_RECENT_SESSIONS.all(limit),
  updatePlaySessionEnd: (id: string, endedAt: number, duration: number, isCompleted: number) => UPDATE_PLAY_SESSION_END.run(endedAt, duration, isCompleted, id),

  // Settings
  getSetting: (key: string) => {
    const row = GET_SETTING.get(key)
    return row ? JSON.parse(row.value) : null
  },
  setSetting: (key: string, value: any) => SET_SETTING.run(key, JSON.stringify(value)),
  deleteSetting: (key: string) => DELETE_SETTING.run(key),
  getAllSettings: () => {
    const rows = GET_ALL_SETTINGS.all()
    const settings: Record<string, any> = {}
    for (const row of rows) {
      settings[row.key] = JSON.parse(row.value)
    }
    return settings
  },

  // Metadata Cache
  insertMetadataCache: (cache: any) => INSERT_METADATA_CACHE.run(cache),
  getMetadataCache: (source: string, query: string) => GET_METADATA_CACHE.get(source, query),
  cleanMetadataCache: () => CLEAN_METADATA_CACHE.run(),

  // Utility
  close: () => db.close(),
  backup: (destPath: string) => db.backup(destPath),
  exec: (sql: string) => db.exec(sql),
  prepare: (sql: string) => db.prepare(sql),
  transaction: (fn: () => void) => db.transaction(fn)(),
}

export default database