export class DiscordService {
  private connected = false;

  async initialize(store: any, database: any, pluginManager: any) {}

  async updatePresence(presence: any) {
    return { success: true };
  }

  async clearPresence() {
    return { success: true };
  }

  async getConnectedUsers() {
    return [];
  }

  async shutdown() {}
}
