export class MetadataService {
  private sources: any[] = [];

  async initialize(store: any, database: any, pluginManager: any) {
    this.sources = [
      { id: 'igdb', name: 'IGDB', type: 'api', enabled: true, weight: 10 },
      { id: 'steam', name: 'Steam Web API', type: 'api', enabled: true, weight: 9 },
      { id: 'steamgriddb', name: 'SteamGridDB', type: 'api', enabled: true, weight: 8 },
      { id: 'launchbox', name: 'LaunchBox GamesDB', type: 'api', enabled: true, weight: 7 },
      { id: 'howlongtobeat', name: 'HowLongToBeat', type: 'scraper', enabled: true, weight: 6 },
      { id: 'pcgamingwiki', name: 'PCGamingWiki', type: 'api', enabled: true, weight: 5 },
      { id: 'steamdb', name: 'SteamDB', type: 'api', enabled: true, weight: 5 },
      { id: 'protondb', name: 'ProtonDB', type: 'api', enabled: true, weight: 4 },
      { id: 'doesitplay', name: 'DoesItPlay', type: 'api', enabled: true, weight: 4 },
      { id: 'rawg', name: 'RAWG', type: 'api', enabled: true, weight: 3 },
      { id: 'mobygames', name: 'MobyGames', type: 'api', enabled: true, weight: 3 },
      { id: 'giantbomb', name: 'Giant Bomb', type: 'api', enabled: true, weight: 2 },
      { id: 'thegamesdb', name: 'TheGamesDB', type: 'api', enabled: true, weight: 2 },
    ];
  }

  async searchGames(query: string) {
    return [];
  }

  async getGameDetails(id: string, source: string) {
    return null;
  }

  async enrichGame(gameId: string) {
    return { success: true };
  }

  async getSources() {
    return this.sources;
  }

  async getRomMetadata(romPath: string) {
    return null;
  }

  async scrapeRomMetadata(romPaths: string[], source: string) {
    return { success: true, results: [] };
  }

  async getRomSources() {
    return [
      { id: 'rom-heaven', name: 'ROM Heaven', systems: ['All'], url: 'https://romheaven.com' },
      { id: 'nopaystation', name: 'NoPayStation', systems: ['PS3', 'PSP', 'PS Vita'], url: 'https://nopaystation.com' },
      { id: 'ziperto', name: 'Ziperto', systems: ['All'], url: 'https://ziperto.com' },
      { id: 'cdromance', name: 'CDRomance', systems: ['PS1', 'PSP', 'PS2', 'Dreamcast'], url: 'https://cdromance.org' },
      { id: 'romhacking', name: 'ROMhacking.net', systems: ['All'], url: 'https://romhacking.net', type: 'hacks' },
      { id: 'myrient', name: 'Myrient/Minerva', systems: ['All'], url: 'https://myrient.erista.me', type: 'archive' },
      { id: 'nswgame', name: 'NSWGame/NXbrew', systems: ['Switch', '3DS', 'Wii', 'WiiU'], url: 'https://nxbrew.net' },
      { id: 'hshop', name: 'hShop', systems: ['3DS'], url: 'https://hshop.erista.me' },
      { id: 'wiiu-downloader', name: 'WiiUDownloader/JNUSTool', systems: ['Wii U'], url: 'https://github.com/Xpl0itU/WiiUDownloader', type: 'tool' },
    ];
  }

  async searchRoms(query: string, system?: string) {
    return [];
  }

  async shutdown() {}
}
