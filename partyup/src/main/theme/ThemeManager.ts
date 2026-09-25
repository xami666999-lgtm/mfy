export class ThemeManager {
  private themes: Map<string, any> = new Map();
  private activeTheme: string = 'partyup-dark';
  private mainWindow: any;

  constructor(mainWindow: any) {
    this.mainWindow = mainWindow;
  }

  async initialize() {
    this.registerBuiltinThemes();
  }

private registerBuiltinThemes() {
    const builtinThemes = [
      {
        id: 'partyup-dark',
        name: 'PartyUp Dark',
        type: 'builtin',
        author: 'PartyUp Team',
        version: '1.0.0',
        data: this.getPartyUpDarkTheme(),
      },
      {
        id: 'partyup-light',
        name: 'PartyUp Light',
        type: 'builtin',
        author: 'PartyUp Team',
        version: '1.0.0',
        data: this.getPartyUpLightTheme(),
      },
      {
        id: 'ps2',
        name: 'PS2 Browser',
        type: 'retro',
        author: 'Community',
        version: '1.0.0',
        data: this.getPS2Theme(),
      },
      {
        id: 'ps3-xmb',
        name: 'PS3 XMB',
        type: 'retro',
        author: 'Community',
        version: '1.0.0',
        data: this.getPS3XMBTheme(),
      },
      {
        id: 'xbox360',
        name: 'Xbox 360 Dashboard',
        type: 'retro',
        author: 'Community',
        version: '1.0.0',
        data: this.getXbox360Theme(),
      },
      {
        id: 'wii',
        name: 'Wii Channel Grid',
        type: 'retro',
        author: 'Community',
        version: '1.0.0',
        data: this.getWiiTheme(),
      },
      {
        id: 'ps1-memory-card',
        name: 'PS1 Memory Card',
        type: 'retro',
        author: 'Community',
        version: '1.0.0',
        data: this.getPS1MemoryCardTheme(),
      },
    ];

    for (const theme of builtinThemes) {
      this.themes.set(theme.id, theme);
    }
  }

  getThemes() {
    return Array.from(this.themes.values());
  }

  async setTheme(themeId: string) {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.activeTheme = themeId;
      this.applyTheme(theme.data);
      return { success: true };
    }
    return { success: false, error: 'Theme not found' };
  }

  async installTheme(themeData: any) {
    const theme = {
      id: themeData.id || crypto.randomUUID(),
      name: themeData.name,
      type: 'custom',
      author: themeData.author || 'User',
      version: themeData.version || '1.0.0',
      data: themeData.data,
    };
    this.themes.set(theme.id, theme);
    return { success: true, themeId: theme.id };
  }

  async createTheme(theme: any) {
    return this.installTheme(theme);
  }

  async getMarketplace() {
    return [
      { id: 'theme-anime', name: 'Anime Theme Pack', author: 'Community', preview: '', downloads: 5000, rating: 4.8, price: 'free' },
      { id: 'theme-cyberpunk', name: 'Cyberpunk 2077', author: 'Community', preview: '', downloads: 4500, rating: 4.7, price: 'free' },
      { id: 'theme-minimal', name: 'Minimalist', author: 'PartyUp Team', preview: '', downloads: 8000, rating: 4.9, price: 'free' },
      { id: 'theme-retro-wave', name: 'Retro Wave', author: 'Community', preview: '', downloads: 3500, rating: 4.6, price: 'free' },
      { id: 'theme-nordic', name: 'Nordic', author: 'Community', preview: '', downloads: 2800, rating: 4.5, price: 'free' },
      { id: 'theme-dracula', name: 'Dracula', author: 'Community', preview: '', downloads: 6000, rating: 4.8, price: 'free' },
      { id: 'theme-gruvbox', name: 'Gruvbox', author: 'Community', preview: '', downloads: 4200, rating: 4.7, price: 'free' },
      { id: 'theme-tokyo-night', name: 'Tokyo Night', author: 'Community', preview: '', downloads: 5500, rating: 4.8, price: 'free' },
    ];
  }

  private applyTheme(themeData: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('theme:apply', themeData);
    }
  }

private getPartyUpDarkTheme() {
    return {
      colors: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        background: '#0a0a14',
        surface: '#141424',
        surfaceHover: '#1e1e32',
        border: '#2a2a4a',
        text: '#f5f5fa',
        textSecondary: '#b5b5cc',
        textMuted: '#7a7a9a',
        accent: '#f97316',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.4)',
        md: '0 4px 8px rgba(0,0,0,0.5)',
        lg: '0 12px 20px rgba(0,0,0,0.6)',
        xl: '0 24px 32px rgba(0,0,0,0.7)',
      },
      fonts: {
        sans: '"Inter", "Segoe UI", system-ui, sans-serif',
        mono: '"JetBrains Mono", "Fira Code", monospace',
        display: '"Space Grotesk", "Inter", sans-serif',
      },
      transitions: { fast: '150ms ease', normal: '250ms ease', slow: '350ms ease' },
    };
  }

  private getPartyUpLightTheme() {
    return {
      ...this.getPartyUpDarkTheme(),
      colors: {
        ...this.getPartyUpDarkTheme().colors,
        background: '#fafafa',
        surface: '#ffffff',
        surfaceHover: '#f5f5f5',
        border: '#e5e5e5',
        text: '#1a1a2e',
        textSecondary: '#4a4a6a',
        textMuted: '#8b8ba5',
      },
    };
  }

  private getPS2Theme() {
    return {
      colors: {
        primary: '#0066cc',
        primaryHover: '#0052a3',
        background: '#001a3a',
        surface: '#002650',
        surfaceHover: '#003366',
        border: '#004488',
        text: '#ffffff',
        textSecondary: '#aaccff',
        textMuted: '#6688aa',
        accent: '#ff6600',
        success: '#00cc00',
        warning: '#ffcc00',
        error: '#ff3333',
        info: '#0099ff',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      borderRadius: { sm: 0, md: 0, lg: 0, xl: 0, full: 0 },
      shadows: {
        sm: '0 2px 4px rgba(0,0,0,0.5)',
        md: '0 4px 8px rgba(0,0,0,0.6)',
        lg: '0 8px 16px rgba(0,0,0,0.7)',
        xl: '0 16px 32px rgba(0,0,0,0.8)',
      },
      fonts: {
        sans: '"Segoe UI", "Trebuchet MS", sans-serif',
        mono: '"Consolas", monospace',
        display: '"Segoe UI", sans-serif',
      },
      transitions: { fast: '100ms linear', normal: '200ms linear', slow: '300ms linear' },
      backgroundPattern: 'ps2-wave',
    };
  }

  private getPS3XMBTheme() {
    return {
      colors: {
        primary: '#0078d7',
        primaryHover: '#0066b8',
        background: '#0a0a0a',
        surface: '#151515',
        surfaceHover: '#1e1e1e',
        border: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        textMuted: '#808080',
        accent: '#ff6b00',
        success: '#00cc66',
        warning: '#ffcc00',
        error: '#ff4444',
        info: '#0099ff',
      },
      spacing: { xs: 6, sm: 12, md: 24, lg: 36, xl: 48 },
      borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
      shadows: {
        sm: '0 1px 3px rgba(0,0,0,0.6)',
        md: '0 3px 9px rgba(0,0,0,0.7)',
        lg: '0 6px 18px rgba(0,0,0,0.8)',
        xl: '0 12px 36px rgba(0,0,0,0.9)',
      },
      fonts: {
        sans: '"Segoe UI", "Helvetica Neue", sans-serif',
        mono: '"Consolas", monospace',
        display: '"Segoe UI Light", sans-serif',
      },
      transitions: { fast: '200ms ease-out', normal: '300ms ease-out', slow: '400ms ease-out' },
      backgroundPattern: 'xmb-wave',
    };
  }

  private getXbox360Theme() {
    return {
      colors: {
        primary: '#107c10',
        primaryHover: '#0e6b0e',
        background: '#0a1a0a',
        surface: '#102010',
        surfaceHover: '#153015',
        border: '#204020',
        text: '#ffffff',
        textSecondary: '#cceecc',
        textMuted: '#88aa88',
        accent: '#ff8c00',
        success: '#107c10',
        warning: '#cc8800',
        error: '#cc0000',
        info: '#0078d7',
      },
      spacing: { xs: 4, sm: 10, md: 20, lg: 30, xl: 40 },
      borderRadius: { sm: 6, md: 10, lg: 14, xl: 18, full: 9999 },
      shadows: {
        sm: '0 2px 5px rgba(0,0,0,0.5)',
        md: '0 5px 12px rgba(0,0,0,0.6)',
        lg: '0 10px 24px rgba(0,0,0,0.7)',
        xl: '0 20px 40px rgba(0,0,0,0.8)',
      },
      fonts: {
        sans: '"Segoe UI", "Xbox One Font", sans-serif',
        mono: '"Consolas", monospace',
        display: '"Segoe UI Semilight", sans-serif',
      },
      transitions: { fast: '150ms ease', normal: '250ms ease', slow: '350ms ease' },
      backgroundPattern: 'xbox-grid',
    };
  }

  private getWiiTheme() {
    return {
      colors: {
        primary: '#00a2e8',
        primaryHover: '#008cc7',
        background: '#f0f0f0',
        surface: '#ffffff',
        surfaceHover: '#f5f5f5',
        border: '#e0e0e0',
        text: '#333333',
        textSecondary: '#666666',
        textMuted: '#999999',
        accent: '#ff6b35',
        success: '#4caf50',
        warning: '#ffc107',
        error: '#f44336',
        info: '#2196f3',
      },
      spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 40 },
      borderRadius: { sm: 12, md: 20, lg: 28, xl: 36, full: 9999 },
      shadows: {
        sm: '0 2px 6px rgba(0,0,0,0.15)',
        md: '0 6px 16px rgba(0,0,0,0.2)',
        lg: '0 12px 32px rgba(0,0,0,0.25)',
        xl: '0 24px 48px rgba(0,0,0,0.3)',
      },
      fonts: {
        sans: '"Nintendo Wii Font", "Segoe UI", sans-serif',
        mono: '"Consolas", monospace',
        display: '"Nintendo Wii Font", sans-serif',
      },
      transitions: { fast: '200ms ease', normal: '300ms ease', slow: '400ms ease' },
      backgroundPattern: 'wii-gradient',
    };
  }

  private getPS1MemoryCardTheme() {
    return {
      colors: {
        primary: '#003399',
        primaryHover: '#002673',
        background: '#000a1a',
        surface: '#001020',
        surfaceHover: '#001830',
        border: '#002040',
        text: '#ffffff',
        textSecondary: '#88aacc',
        textMuted: '#557799',
        accent: '#ff3366',
        success: '#00cc33',
        warning: '#ffcc00',
        error: '#ff3333',
        info: '#0099ff',
      },
      spacing: { xs: 4, sm: 12, md: 20, lg: 28, xl: 36 },
      borderRadius: { sm: 2, md: 4, lg: 6, xl: 8, full: 9999 },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.7)',
        md: '0 2px 6px rgba(0,0,0,0.8)',
        lg: '0 4px 12px rgba(0,0,0,0.9)',
        xl: '0 8px 24px rgba(0,0,0,0.95)',
      },
      fonts: {
        sans: '"PS1 BIOS Font", "Courier New", monospace',
        mono: '"Courier New", monospace',
        display: '"PS1 BIOS Font", monospace',
      },
      transitions: { fast: '50ms linear', normal: '100ms linear', slow: '150ms linear' },
      backgroundPattern: 'ps1-grid',
    };
  }
}
