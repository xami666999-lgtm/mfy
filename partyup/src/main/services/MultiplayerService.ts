export class MultiplayerService {
  private clients: any[] = [];

  async initialize(store: any, database: any, pluginManager: any) {
    this.clients = [
      { id: 'plutonium', name: 'Plutonium', games: ['BO1', 'BO2', 'MW3', 'WaW'], installed: false, path: '' },
      { id: 'alterware', name: 'AlterWare', games: ['BO3', 'AW', 'Ghosts'], installed: false, path: '' },
      { id: 'iw4x', name: 'IW4x', games: ['MW2 (2009)'], installed: false, path: '' },
      { id: 'northstar', name: 'Northstar', games: ['Titanfall 2'], installed: false, path: '' },
      { id: 'cncnet', name: 'CnCNet', games: ['C&C', 'Red Alert', 'YR', 'TD', 'RA2'], installed: false, path: '' },
      { id: 'venice-unleashed', name: 'Venice Unleashed', games: ['BF2', 'BF3', 'BF4'], installed: false, path: '' },
      { id: 'sm64-coop', name: 'SM64 Coop Deluxe', games: ['Super Mario 64'], installed: false, path: '' },
      { id: 'slippi', name: 'Slippi', games: ['Super Smash Bros Melee'], installed: false, path: '' },
      { id: 'tilted', name: 'Tilted Online', games: ['Skyrim', 'Fallout 4'], installed: false, path: '' },
      { id: 'nv-mp', name: 'NV:MP', games: ['Fallout: New Vegas'], installed: false, path: '' },
      { id: 'nitrox', name: 'Nitrox', games: ['Subnautica'], installed: false, path: '' },
      { id: 'beammp', name: 'BeamMP', games: ['BeamNG.drive'], installed: false, path: '' },
      { id: 'seamless-coop', name: 'Seamless Co-op', games: ['Elden Ring'], installed: false, path: '' },
      { id: 'ravenm', name: 'RavenM', games: ['Ravenfield'], installed: false, path: '' },
      { id: 'r1delta', name: 'R1Delta', games: ['Titanfall 1'], installed: false, path: '' },
      { id: 'crymp', name: 'CryMP', games: ['Crysis 1'], installed: false, path: '' },
      { id: 'cypress', name: 'Cypress', games: ['PvZ Garden Warfare 1/2'], installed: false, path: '' },
    ];
  }

  async getClients() {
    return this.clients;
  }

  async launchClient(clientId: string, gameId?: string) {
    return { success: true, pid: 1234 };
  }

  async getServers(clientId: string) {
    return [];
  }

  async connectServer(clientId: string, serverId: string) {
    return { success: true };
  }

  async installClient(clientId: string) {
    return { success: true };
  }

  async shutdown() {}
}
