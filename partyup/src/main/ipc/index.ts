import { ipcMain, dialog, shell, app } from 'electron';
import Store from 'electron-store';
import { Database } from '../database/Database.js';
import { PluginManager } from '../plugins/PluginManager.js';
import { ThemeManager } from '../theme/ThemeManager.js';

export interface Services {
  steam: any;
  torrent: any;
  emulator: any;
  modManager: any;
  multiplayer: any;
  cloudGaming: any;
  optimization: any;
  achievement: any;
  saveManager: any;
  library: any;
  social: any;
  discord: any;
  metadata: any;
  download: any;
  hoardSync: any;
}

export function setupIpcHandlers(
  mainWindow: Electron.BrowserWindow,
  services: Services,
  store: Store,
  database: Database,
  pluginManager: PluginManager,
  themeManager: ThemeManager
) {
  const handlers: Record<string, (...args: unknown[]) => Promise<unknown>> = {};

  function handle(channel: string, handler: (...args: unknown[]) => Promise<unknown>) {
    handlers[channel] = handler;
    ipcMain.handle(channel, async (_event, ...args) => {
      try {
        return await handler(...args);
      } catch (error) {
        console.error(`IPC Error [${channel}]:`, error);
        throw error;
      }
    });
  }

  // Steam handlers
  handle('steam:get-library', async () => services.steam?.getLibrary());
  handle('steam:get-achievements', async (appId: number) => services.steam?.getAchievements(appId));
  handle('steam:get-playtime', async (appId: number) => services.steam?.getPlaytime(appId));
  handle('steam:launch-game', async (appId: number, args?: string[]) => services.steam?.launchGame(appId, args));
  handle('steam:get-depots', async (appId: number) => services.steam?.getDepots(appId));
  handle('steam:download-depot', async (appId: number, depotId: number, manifestId: number) =>
    services.steam?.downloadDepot(appId, depotId, manifestId)
  );
  handle('steam:get-workshop-items', async (appId: number) => services.steam?.getWorkshopItems(appId));
  handle('steam:subscribe-workshop', async (publishedFileId: string) =>
    services.steam?.subscribeWorkshop(publishedFileId)
  );
  handle('steam:unsubscribe-workshop', async (publishedFileId: string) =>
    services.steam?.unsubscribeWorkshop(publishedFileId)
  );
  handle('steam:get-dlc', async (appId: number) => services.steam?.getDlc(appId));
  handle('steam:install-dlc-unlocker', async (appId: number, type: string) =>
    services.steam?.installDlcUnlocker(appId, type as 'creamapi' | 'goldberg' | 'steamless')
  );
  handle('steam:get-controller-config', async (appId: number) => services.steam?.getControllerConfig(appId));
  handle('steam:set-controller-config', async (appId: number, config: object) =>
    services.steam?.setControllerConfig(appId, config)
  );

  // Torrent handlers
  handle('torrent:add-magnet', async (magnet: string, options?: object) =>
    services.torrent?.addMagnet(magnet, options)
  );
  handle('torrent:add-torrent', async (path: string, options?: object) =>
    services.torrent?.addTorrent(path, options)
  );
  handle('torrent:get-torrents', async () => services.torrent?.getTorrents());
  handle('torrent:pause', async (hash: string) => services.torrent?.pause(hash));
  handle('torrent:resume', async (hash: string) => services.torrent?.resume(hash));
  handle('torrent:remove', async (hash: string, deleteFiles?: boolean) =>
    services.torrent?.remove(hash, deleteFiles)
  );
  handle('torrent:get-hydra-sources', async () => services.torrent?.getHydraSources());
  handle('torrent:search-hydra', async (query: string) => services.torrent?.searchHydra(query));

  // Emulator handlers
  handle('emulator:get-emulators', async () => services.emulator?.getEmulators());
  handle('emulator:detect-emulators', async () => services.emulator?.detectEmulators());
  handle('emulator:launch-rom', async (emulatorId: string, romPath: string, args?: string[]) =>
    services.emulator?.launchRom(emulatorId, romPath, args)
  );
  handle('emulator:get-roms', async (system?: string) => services.emulator?.getRoms(system));
  handle('emulator:scan-roms', async (paths: string[]) => services.emulator?.scanRoms(paths));
  handle('emulator:get-retroarch-cores', async () => services.emulator?.getRetroArchCores());
  handle('emulator:install-core', async (coreName: string) => services.emulator?.installCore(coreName));
  handle('emulator:update-cores', async () => services.emulator?.updateCores());

  // ROM handlers
  handle('roms:get-metadata', async (romPath: string) => services.metadata?.getRomMetadata(romPath));
  handle('roms:scrape-metadata', async (romPaths: string[], source: string) =>
    services.metadata?.scrapeRomMetadata(romPaths, source)
  );
  handle('roms:get-sources', async () => services.metadata?.getRomSources());
  handle('roms:search', async (query: string, system?: string) =>
    services.metadata?.searchRoms(query, system)
  );
  handle('roms:download', async (url: string, destination: string) =>
    services.download?.downloadRom(url, destination)
  );

  // Mod handlers
  handle('mods:get-mods', async (gameId: string) => services.modManager?.getMods(gameId));
  handle('mods:install', async (gameId: string, modId: string, source: string) =>
    services.modManager?.installMod(gameId, modId, source)
  );
  handle('mods:uninstall', async (gameId: string, modId: string) =>
    services.modManager?.uninstallMod(gameId, modId)
  );
  handle('mods:enable', async (gameId: string, modId: string) =>
    services.modManager?.enableMod(gameId, modId)
  );
  handle('mods:disable', async (gameId: string, modId: string) =>
    services.modManager?.disableMod(gameId, modId)
  );
  handle('mods:get-load-order', async (gameId: string) => services.modManager?.getLoadOrder(gameId));
  handle('mods:set-load-order', async (gameId: string, order: string[]) =>
    services.modManager?.setLoadOrder(gameId, order)
  );
  handle('mods:get-sources', async () => services.modManager?.getSources());
  handle('mods:search', async (gameId: string, query: string) =>
    services.modManager?.searchMods(gameId, query)
  );
  handle('mods:install-modlist', async (gameId: string, modlistUrl: string) =>
    services.modManager?.installModlist(gameId, modlistUrl)
  );

  // Multiplayer handlers
  handle('multiplayer:get-clients', async () => services.multiplayer?.getClients());
  handle('multiplayer:launch-client', async (clientId: string, gameId?: string) =>
    services.multiplayer?.launchClient(clientId, gameId)
  );
  handle('multiplayer:get-servers', async (clientId: string) =>
    services.multiplayer?.getServers(clientId)
  );
  handle('multiplayer:connect-server', async (clientId: string, serverId: string) =>
    services.multiplayer?.connectServer(clientId, serverId)
  );
  handle('multiplayer:install-client', async (clientId: string) =>
    services.multiplayer?.installClient(clientId)
  );

  // Cloud Gaming handlers
  handle('cloud-gaming:get-services', async () => services.cloudGaming?.getServices());
  handle('cloud-gaming:launch-service', async (serviceId: string, gameId?: string) =>
    services.cloudGaming?.launchService(serviceId, gameId)
  );
  handle('cloud-gaming:get-games', async (serviceId: string) =>
    services.cloudGaming?.getGames(serviceId)
  );
  handle('cloud-gaming:connect-host', async (host: string, port: number) =>
    services.cloudGaming?.connectHost(host, port)
  );

  // Optimization handlers
  handle('optimization:get-profiles', async () => services.optimization?.getProfiles());
  handle('optimization:create-profile', async (profile: object) =>
    services.optimization?.createProfile(profile)
  );
  handle('optimization:update-profile', async (id: string, profile: object) =>
    services.optimization?.updateProfile(id, profile)
  );
  handle('optimization:delete-profile', async (id: string) =>
    services.optimization?.deleteProfile(id)
  );
  handle('optimization:apply-profile', async (gameId: string, profileId: string) =>
    services.optimization?.applyProfile(gameId, profileId)
  );
  handle('optimization:get-tools', async () => services.optimization?.getTools());
  handle('optimization:install-tool', async (toolId: string) =>
    services.optimization?.installTool(toolId)
  );
  handle('optimization:auto-optimize', async (gameId: string) =>
    services.optimization?.autoOptimize(gameId)
  );

  // Achievement handlers
  handle('achievements:get', async (gameId: string, platform: string) =>
    services.achievement?.getAchievements(gameId, platform)
  );
  handle('achievements:unlock', async (gameId: string, achievementId: string, platform: string) =>
    services.achievement?.unlockAchievement(gameId, achievementId, platform)
  );
  handle('achievements:get-rarity', async (gameId: string, achievementId: string, platform: string) =>
    services.achievement?.getRarity(gameId, achievementId, platform)
  );
  handle('achievements:get-leaderboard', async (gameId: string, platform: string) =>
    services.achievement?.getLeaderboard(gameId, platform)
  );
  handle('achievements:notify', async (achievement: object) =>
    services.achievement?.showNotification(achievement)
  );

// Save handlers
  handle('saves:get', async (gameId: string) => services.saveManager?.getSaves(gameId));
  handle('saves:backup', async (gameId: string, saveId: string) =>
    services.saveManager?.backupSave(gameId, saveId)
  );
  handle('saves:restore', async (gameId: string, backupId: string) =>
    services.saveManager?.restoreSave(gameId, backupId)
  );
  handle('saves:convert', async (saveId: string, targetPlatform: string) =>
    services.saveManager?.convertSave(saveId, targetPlatform)
  );
  handle('saves:get-locations', async (gameId: string) =>
    services.saveManager?.getSaveLocations(gameId)
  );
  handle('saves:auto-backup', async (enabled: boolean) =>
    services.saveManager?.setAutoBackup(enabled)
  );

  // Hoard Sync handlers
  handle('hoard-sync:backup', async (gameId: string, gameName: string, sourcePath: string) =>
    services.hoardSync?.backupGame(gameId, gameName, sourcePath)
  );
  handle('hoard-sync:get-snapshots', async (gameId: string) =>
    services.hoardSync?.getGameSnapshots(gameId)
  );
  handle('hoard-sync:restore', async (snapshotId: string, destinationPath: string) =>
    services.hoardSync?.restoreSnapshot(snapshotId, destinationPath)
  );
  handle('hoard-sync:get-storage-stats', async () =>
    services.hoardSync?.getStorageStats()
  );

  // Library handlers
  handle('library:get-games', async () => services.library?.getGames());
  handle('library:add-game', async (game: object) => services.library?.addGame(game));
  handle('library:remove-game', async (gameId: string) => services.library?.removeGame(gameId));
  handle('library:update-game', async (gameId: string, data: object) =>
    services.library?.updateGame(gameId, data)
  );
  handle('library:get-views', async () => services.library?.getViews());
  handle('library:create-view', async (view: object) => services.library?.createView(view));
  handle('library:get-stats', async () => services.library?.getStats());
  handle('library:get-backlog', async () => services.library?.getBacklog());
  handle('library:add-to-backlog', async (gameId: string) => services.library?.addToBacklog(gameId));
  handle('library:rate-game', async (gameId: string, rating: number) =>
    services.library?.rateGame(gameId, rating)
  );
  handle('library:add-note', async (gameId: string, note: string) =>
    services.library?.addNote(gameId, note)
  );
  handle('library:detect-duplicates', async () => services.library?.detectDuplicates());
  handle('library:scan-portable', async (path: string) => services.library?.scanPortable(path));

  // Social handlers
  handle('social:get-friends', async () => services.social?.getFriends());
  handle('social:get-activity', async () => services.social?.getActivity());
  handle('social:join-friend', async (friendId: string, gameId: string) =>
    services.social?.joinFriend(friendId, gameId)
  );
  handle('social:invite-friend', async (friendId: string, gameId: string) =>
    services.social?.inviteFriend(friendId, gameId)
  );
  handle('social:share-media', async (media: object) => services.social?.shareMedia(media));
  handle('social:get-reviews', async (gameId: string) => services.social?.getReviews(gameId));
  handle('social:submit-review', async (gameId: string, review: object) =>
    services.social?.submitReview(gameId, review)
  );
  handle('social:get-leaderboards', async (gameId: string) =>
    services.social?.getLeaderboards(gameId)
  );

  // Discord handlers
  handle('discord:update-presence', async (presence: object) =>
    services.discord?.updatePresence(presence)
  );
  handle('discord:clear-presence', async () => services.discord?.clearPresence());
  handle('discord:get-connected-users', async () => services.discord?.getConnectedUsers());

  // Metadata handlers
  handle('metadata:search', async (query: string) => services.metadata?.searchGames(query));
  handle('metadata:get-details', async (id: string, source: string) =>
    services.metadata?.getGameDetails(id, source)
  );
  handle('metadata:enrich', async (gameId: string) => services.metadata?.enrichGame(gameId));
  handle('metadata:get-sources', async () => services.metadata?.getSources());

  // Download handlers
  handle('downloads:start', async (url: string, options?: object) =>
    services.download?.startDownload(url, options)
  );
  handle('downloads:pause', async (id: string) => services.download?.pauseDownload(id));
  handle('downloads:resume', async (id: string) => services.download?.resumeDownload(id));
  handle('downloads:cancel', async (id: string) => services.download?.cancelDownload(id));
  handle('downloads:get', async () => services.download?.getDownloads());
  handle('downloads:set-aria2', async (options: object) =>
    services.download?.setAria2Options(options)
  );

  // Settings handlers
  handle('settings:get', async (key: string) => store.get(key));
  handle('settings:set', async (key: string, value: unknown) => {
    store.set(key, value);
    return true;
  });
  handle('settings:get-all', async () => store.store);
  handle('settings:reset', async (key?: string) => {
    if (key) {
      store.delete(key);
    } else {
      store.clear();
    }
    return true;
  });

  // Theme handlers
  handle('themes:get', async () => themeManager.getThemes());
  handle('themes:set', async (themeId: string) => themeManager.setTheme(themeId));
  handle('themes:install', async (themeData: object) => themeManager.installTheme(themeData));
  handle('themes:create', async (theme: object) => themeManager.createTheme(theme));
  handle('themes:marketplace', async () => themeManager.getMarketplace());

  // Plugin handlers
  handle('plugins:get', async () => pluginManager.getPlugins());
  handle('plugins:enable', async (id: string) => pluginManager.enablePlugin(id));
  handle('plugins:disable', async (id: string) => pluginManager.disablePlugin(id));
  handle('plugins:install', async (url: string) => pluginManager.installPlugin(url));
  handle('plugins:marketplace', async () => pluginManager.getMarketplace());

  // System handlers
  handle('system:open-external', async (url: string) => shell.openExternal(url));
  handle('system:show-in-folder', async (path: string) => shell.showItemInFolder(path));
  handle('system:open-path', async (path: string) => shell.openPath(path));
  handle('system:get-info', async () => ({
    platform: process.platform,
    arch: process.arch,
    versions: process.versions,
    appVersion: app.getVersion(),
  }));
  handle('system:minimize', async () => mainWindow.minimize());
  handle('system:maximize', async () =>
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
  );
  handle('system:close', async () => mainWindow.close());
  handle('system:set-fullscreen', async (fullscreen: boolean) =>
    mainWindow.setFullScreen(fullscreen)
  );
}
