import type { Database } from '../database/Database.js';
import type { PluginManager } from '../plugins/PluginManager.js';
import Store from 'electron-store';

type StoreType = InstanceType<typeof Store>;

interface Service {
  initialize?: (store: StoreType, database: Database, pluginManager: PluginManager) => Promise<void>;
  shutdown?: () => Promise<void>;
}

export async function initializeServices(
  services: Record<string, Service>,
  store: StoreType,
  database: Database,
  pluginManager: PluginManager
) {
  const initPromises = Object.entries(services).map(async ([name, service]) => {
    if (service && typeof service.initialize === 'function') {
      try {
        await service.initialize(store, database, pluginManager);
        console.log(`Service ${name} initialized`);
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error);
      }
    }
  });

  await Promise.all(initPromises);
}