import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

const handler = (channel: string, ...args: unknown[]) => {
  return ipcRenderer.invoke(channel, ...args);
};

const on = (channel: string, callback: (...args: unknown[]) => void) => {
  const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => callback(...args);
  ipcRenderer.on(channel, subscription);
  return () => ipcRenderer.removeListener(channel, subscription);
};

const send = (channel: string, ...args: unknown[]) => {
  ipcRenderer.send(channel, ...args);
};

contextBridge.exposeInMainWorld('electron', {
  ipc: {
    invoke: handler,
    on,
    send,
  },
  platform: process.platform,
  versions: process.versions,
});

contextBridge.exposeInMainWorld('api', {
  steam: {
    getLibrary: () => handler('steam:get-library'),
    getAchievements: (appId: number) => handler('steam:get-achievements', appId),
    getPlaytime: (appId: number) => handler('steam:get-playtime', appId),
    launchGame: (appId: number, args?: string[]) => handler('steam:launch-game', appId, args),
    getDepots: (appId: number) => handler('steam:get-depots', appId),
    downloadDepot: (appId: number, depotId: number, manifestId: number) => handler('steam:download-depot', appId, depotId, manifestId),
    getWorkshopItems: (appId: number) => handler('steam:get-workshop-items', appId),
    subscribeWorkshop: (publishedFileId: string) => handler('steam:subscribe-workshop', publishedFileId),
    unsubscribeWorkshop: (publishedFileId: string) => handler('steam:unsubscribe-workshop', publishedFileId),
    getDlc: (appId: number) => handler('steam:get-dlc', appId),
    installDlcUnlocker: (appId: number, type: 'creamapi' | 'goldberg' | 'steamless') => handler('steam:install-dlc-unlocker', appId, type),
    getControllerConfig: (appId: number) => handler('steam:get-controller-config', appId),
    setControllerConfig: (appId: number, config: object) => handler('steam:set-controller-config', appId, config),
  },
  torrent: {
    addMagnet: (magnet: string, options?: object) => handler('torrent:add-magnet', magnet, options),
    addTorrent: (path: string, options?: object) => handler('torrent:add-torrent', path, options),
    getTorrents: () => handler('torrent:get-torrents'),
    pause: (hash: string) => handler('torrent:pause', hash),
    resume: (hash: string) => handler('torrent:resume', hash),
    remove: (hash: string, deleteFiles?: boolean) => handler('torrent:remove', hash, deleteFiles),
    getHydraSources: () => handler('torrent:get-hydra-sources'),
    searchHydra: (query: string) => handler('torrent:search-hydra', query),
  },
  emulator: {
    getEmulators: () => handler('emulator:get-emulators'),
    detectEmulators: () => handler('emulator:detect-emulators'),
    launchRom: (emulatorId: string, romPath: string, args?: string[]) => handler('emulator:launch-rom', emulatorId, romPath, args),
    getRoms: (system?: string) => handler('emulator:get-roms', system),
    scanRoms: (paths: string[]) => handler('emulator:scan-roms', paths),
    getRetroArchCores: () => handler('emulator:get-retroarch-cores'),
    installCore: (coreName: string) => handler('emulator:install-core', coreName),
    updateCores: () => handler('emulator:update-cores'),
  },
  roms: {
    getMetadata: (romPath: string) => handler('roms:get-metadata', romPath),
    scrapeMetadata: (romPaths: string[], source: string) => handler('roms:scrape-metadata', romPaths, source),
    getRomSources: () => handler('roms:get-sources'),
    searchRoms: (query: string, system?: string) => handler('roms:search', query, system),
    downloadRom: (url: string, destination: string) => handler('roms:download', url, destination),
  },
  mods: {
    getMods: (gameId: string) => handler('mods:get-mods', gameId),
    installMod: (gameId: string, modId: string, source: string) => handler('mods:install', gameId, modId, source),
    uninstallMod: (gameId: string, modId: string) => handler('mods:uninstall', gameId, modId),
    enableMod: (gameId: string, modId: string) => handler('mods:enable', gameId, modId),
    disableMod: (gameId: string, modId: string) => handler('mods:disable', gameId, modId),
    getLoadOrder: (gameId: string) => handler('mods:get-load-order', gameId),
    setLoadOrder: (gameId: string, order: string[]) => handler('mods:set-load-order', gameId, order),
    getModSources: () => handler('mods:get-sources'),
    searchMods: (gameId: string, query: string) => handler('mods:search', gameId, query),
    installModlist: (gameId: string, modlistUrl: string) => handler('mods:install-modlist', gameId, modlistUrl),
  },
  multiplayer: {
    getClients: () => handler('multiplayer:get-clients'),
    launchClient: (clientId: string, gameId?: string) => handler('multiplayer:launch-client', clientId, gameId),
    getServers: (clientId: string) => handler('multiplayer:get-servers', clientId),
    connectServer: (clientId: string, serverId: string) => handler('multiplayer:connect-server', clientId, serverId),
    installClient: (clientId: string) => handler('multiplayer:install-client', clientId),
  },
  cloudGaming: {
    getServices: () => handler('cloud-gaming:get-services'),
    launchService: (serviceId: string, gameId?: string) => handler('cloud-gaming:launch-service', serviceId, gameId),
    getGames: (serviceId: string) => handler('cloud-gaming:get-games', serviceId),
    connectHost: (host: string, port: number) => handler('cloud-gaming:connect-host', host, port),
  },
  optimization: {
    getProfiles: () => handler('optimization:get-profiles'),
    createProfile: (profile: object) => handler('optimization:create-profile', profile),
    updateProfile: (id: string, profile: object) => handler('optimization:update-profile', id, profile),
    deleteProfile: (id: string) => handler('optimization:delete-profile', id),
    applyProfile: (gameId: string, profileId: string) => handler('optimization:apply-profile', gameId, profileId),
    getTools: () => handler('optimization:get-tools'),
    installTool: (toolId: string) => handler('optimization:install-tool', toolId),
    autoOptimize: (gameId: string) => handler('optimization:auto-optimize', gameId),
  },
  achievements: {
    getAchievements: (gameId: string, platform: string) => handler('achievements:get', gameId, platform),
    unlockAchievement: (gameId: string, achievementId: string, platform: string) => handler('achievements:unlock', gameId, achievementId, platform),
    getRarity: (gameId: string, achievementId: string, platform: string) => handler('achievements:get-rarity', gameId, achievementId, platform),
    getLeaderboard: (gameId: string, platform: string) => handler('achievements:get-leaderboard', gameId, platform),
    showNotification: (achievement: object) => handler('achievements:notify', achievement),
  },
  saves: {
    getSaves: (gameId: string) => handler('saves:get', gameId),
    backupSave: (gameId: string, saveId: string) => handler('saves:backup', gameId, saveId),
    restoreSave: (gameId: string, backupId: string) => handler('saves:restore', gameId, backupId),
    convertSave: (saveId: string, targetPlatform: string) => handler('saves:convert', saveId, targetPlatform),
    getSaveLocations: (gameId: string) => handler('saves:get-locations', gameId),
    autoBackup: (enabled: boolean) => handler('saves:auto-backup', enabled),
  },
  library: {
    getGames: () => handler('library:get-games'),
    addGame: (game: object) => handler('library:add-game', game),
    removeGame: (gameId: string) => handler('library:remove-game', gameId),
    updateGame: (gameId: string, data: object) => handler('library:update-game', gameId, data),
    getViews: () => handler('library:get-views'),
    createView: (view: object) => handler('library:create-view', view),
    getStats: () => handler('library:get-stats'),
    getBacklog: () => handler('library:get-backlog'),
    addToBacklog: (gameId: string) => handler('library:add-to-backlog', gameId),
    rateGame: (gameId: string, rating: number) => handler('library:rate-game', gameId, rating),
    addNote: (gameId: string, note: string) => handler('library:add-note', gameId, note),
    detectDuplicates: () => handler('library:detect-duplicates'),
    scanPortable: (path: string) => handler('library:scan-portable', path),
  },
  social: {
    getFriends: () => handler('social:get-friends'),
    getActivity: () => handler('social:get-activity'),
    joinFriend: (friendId: string, gameId: string) => handler('social:join-friend', friendId, gameId),
    inviteFriend: (friendId: string, gameId: string) => handler('social:invite-friend', friendId, gameId),
    shareMedia: (media: object) => handler('social:share-media', media),
    getReviews: (gameId: string) => handler('social:get-reviews', gameId),
    submitReview: (gameId: string, review: object) => handler('social:submit-review', gameId, review),
    getLeaderboards: (gameId: string) => handler('social:get-leaderboards', gameId),
  },
  discord: {
    updatePresence: (presence: object) => handler('discord:update-presence', presence),
    clearPresence: () => handler('discord:clear-presence'),
    getConnectedUsers: () => handler('discord:get-connected-users'),
  },
  metadata: {
    searchGames: (query: string) => handler('metadata:search', query),
    getGameDetails: (id: string, source: string) => handler('metadata:get-details', id, source),
    enrichGame: (gameId: string) => handler('metadata:enrich', gameId),
    getSources: () => handler('metadata:get-sources'),
  },
  downloads: {
    start: (url: string, options?: object) => handler('downloads:start', url, options),
    pause: (id: string) => handler('downloads:pause', id),
    resume: (id: string) => handler('downloads:resume', id),
    cancel: (id: string) => handler('downloads:cancel', id),
    getDownloads: () => handler('downloads:get'),
    setAria2Options: (options: object) => handler('downloads:set-aria2', options),
  },
settings: {
    get: (key: string) => handler('settings:get', key),
    set: (key: string, value: unknown) => handler('settings:set', key, value),
    getAll: () => handler('settings:get-all'),
    reset: (key?: string) => handler('settings:reset', key),
  },
  hoardSync: {
    backupGame: (gameId: string, gameName: string, sourcePath: string) => handler('hoard-sync:backup', gameId, gameName, sourcePath),
    getSnapshots: (gameId: string) => handler('hoard-sync:get-snapshots', gameId),
    restoreSnapshot: (snapshotId: string, destinationPath: string) => handler('hoard-sync:restore', snapshotId, destinationPath),
    getStorageStats: () => handler('hoard-sync:get-storage-stats'),
  },
  themes: {
    getThemes: () => handler('themes:get'),
    setTheme: (themeId: string) => handler('themes:set', themeId),
    installTheme: (themeData: object) => handler('themes:install', themeData),
    createTheme: (theme: object) => handler('themes:create', theme),
    getMarketplace: () => handler('themes:marketplace'),
  },
  plugins: {
    getPlugins: () => handler('plugins:get'),
    enablePlugin: (id: string) => handler('plugins:enable', id),
    disablePlugin: (id: string) => handler('plugins:disable', id),
    installPlugin: (url: string) => handler('plugins:install', url),
    getMarketplace: () => handler('plugins:marketplace'),
  },
  system: {
    openExternal: (url: string) => handler('system:open-external', url),
    showItemInFolder: (path: string) => handler('system:show-in-folder', path),
    openPath: (path: string) => handler('system:open-path', path),
    getSystemInfo: () => handler('system:get-info'),
    minimize: () => handler('system:minimize'),
    maximize: () => handler('system:maximize'),
    close: () => handler('system:close'),
    setFullscreen: (fullscreen: boolean) => handler('system:set-fullscreen', fullscreen),
  },
});

declare global {
  interface Window {
    electron: {
      ipc: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
        on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
        send: (channel: string, ...args: unknown[]) => void;
      };
      platform: string;
      versions: NodeJS.ProcessVersions;
    };
api: {
      steam: {
        getLibrary: () => Promise<any>;
        getDepots: (appId: string) => Promise<any>;
        getWorkshop: (appId: string) => Promise<any>;
        unlockDLC: (appId: string, dlcIds: string[]) => Promise<any>;
        verifyFiles: (appId: string) => Promise<any>;
        installApp: (appId: string, options?: any) => Promise<any>;
      };
      torrent: {
        addMagnet: (magnet: string, options?: any) => Promise<any>;
        addTorrent: (torrentPath: string, options?: any) => Promise<any>;
        pause: (hash: string) => Promise<any>;
        resume: (hash: string) => Promise<any>;
        remove: (hash: string, deleteFiles?: boolean) => Promise<any>;
        getTorrents: () => Promise<any>;
        getTorrent: (hash: string) => Promise<any>;
        setPriority: (hash: string, priority: number) => Promise<any>;
        setDownloadLimit: (hash: string, limit: number) => Promise<any>;
        setUploadLimit: (hash: string, limit: number) => Promise<any>;
        forceRecheck: (hash: string) => Promise<any>;
      };
      emulator: {
        getSystems: () => Promise<any>;
        getRoms: (systemId: string) => Promise<any>;
        launchRom: (romId: string, options?: any) => Promise<any>;
        scanRoms: (systemId: string) => Promise<any>;
        getEmulators: () => Promise<any>;
        configureEmulator: (emulatorId: string, config: any) => Promise<any>;
        downloadCore: (systemId: string, coreName: string) => Promise<any>;
      };
      modManager: {
        getMods: (gameId: string) => Promise<any>;
        installMod: (gameId: string, modId: string, source: string) => Promise<any>;
        uninstallMod: (gameId: string, modId: string) => Promise<any>;
        enableMod: (gameId: string, modId: string) => Promise<any>;
        disableMod: (gameId: string, modId: string) => Promise<any>;
        getModSources: () => Promise<any>;
        addModSource: (source: any) => Promise<any>;
        checkUpdates: (gameId: string) => Promise<any>;
      };
      multiplayer: {
        getClients: () => Promise<any>;
        launchGame: (clientId: string, gameId: string, options?: any) => Promise<any>;
        getServers: (clientId: string, gameId: string) => Promise<any>;
        createServer: (clientId: string, options: any) => Promise<any>;
        joinServer: (clientId: string, serverInfo: any) => Promise<any>;
      };
      cloudGaming: {
        getServices: () => Promise<any>;
        connect: (serviceId: string, options: any) => Promise<any>;
        disconnect: (serviceId: string) => Promise<any>;
        launchGame: (serviceId: string, gameId: string) => Promise<any>;
      };
      optimization: {
        getProfiles: () => Promise<any>;
        applyProfile: (profileId: string, gameId: string) => Promise<any>;
        createProfile: (profile: any) => Promise<any>;
        scanGame: (gameId: string) => Promise<any>;
      };
      achievement: {
        getPlatforms: () => Promise<any>;
        getAchievements: (platform: string, gameId: string) => Promise<any>;
        unlockAchievement: (platform: string, gameId: string, achievementId: string) => Promise<any>;
        notifyAchievement: (achievement: any) => Promise<any>;
      };
      saveManager: {
        getSaves: (gameId: string) => Promise<any>;
        backupSave: (gameId: string) => Promise<any>;
        restoreSave: (gameId: string, backupId: string) => Promise<any>;
        syncSaves: (gameId: string) => Promise<any>;
      };
      library: {
        getGames: () => Promise<any>;
        addGame: (game: any) => Promise<any>;
        removeGame: (gameId: string) => Promise<any>;
        updateGame: (gameId: string, data: any) => Promise<any>;
        scanLibrary: (path: string) => Promise<any>;
        importFromSteam: () => Promise<any>;
      };
      social: {
        getFriends: (platform: string) => Promise<any>;
        sendMessage: (platform: string, userId: string, message: string) => Promise<any>;
        inviteToGame: (platform: string, userId: string, gameId: string) => Promise<any>;
      };
      discord: {
        updatePresence: (data: any) => Promise<any>;
        clearPresence: () => Promise<any>;
      };
      metadata: {
        search: (query: string) => Promise<any>;
        getGame: (id: string) => Promise<any>;
        getArtwork: (gameId: string, type: string) => Promise<any>;
      };
      download: {
        start: (url: string, options?: any) => Promise<any>;
        pause: (id: string) => Promise<any>;
        resume: (id: string) => Promise<any>;
        cancel: (id: string) => Promise<any>;
        getDownloads: () => Promise<any>;
      };
      hoardSync: {
        getConfig: () => Promise<any>;
        updateConfig: (config: any) => Promise<any>;
        backupGame: (gameId: string, gameName: string, path: string) => Promise<any>;
        restoreSnapshot: (snapshotId: string, destination: string) => Promise<any>;
        getSnapshots: (gameId: string) => Promise<any>;
        getStats: () => Promise<any>;
      };
    };
  }
}
