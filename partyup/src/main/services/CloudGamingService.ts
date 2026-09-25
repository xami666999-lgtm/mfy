export class CloudGamingService {
  private services: any[] = [];

  async initialize(store: any, database: any, pluginManager: any) {
    this.services = [
      { id: 'moonlight', name: 'Moonlight', type: 'gamestream', installed: false, path: '', host: '', port: 47989 },
      { id: 'sunshine', name: 'Sunshine', type: 'gamestream-host', installed: false, path: '', port: 47990 },
      { id: 'chiaki', name: 'Chiaki', type: 'ps-remote-play', installed: false, path: '' },
      { id: 'greenlight', name: 'Greenlight', type: 'xcloud', installed: false, path: '' },
      { id: 'better-xcloud', name: 'Better xCloud', type: 'xcloud', installed: false, path: '' },
      { id: 'geforce-now', name: 'GeForce Now', type: 'web', installed: false, url: 'https://play.geforcenow.com' },
      { id: 'steam-link', name: 'Steam Link', type: 'steam', installed: false, path: '' },
      { id: 'parsec', name: 'Parsec', type: 'streaming', installed: false, path: '' },
    ];
  }

  async getServices() {
    return this.services;
  }

  async launchService(serviceId: string, gameId?: string) {
    return { success: true };
  }

  async getGames(serviceId: string) {
    return [];
  }

  async connectHost(host: string, port: number) {
    return { success: true };
  }

  async shutdown() {}
}
