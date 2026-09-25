import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../utils/api';

interface Theme {
  id: string;
  name: string;
  type: 'builtin' | 'retro' | 'custom';
  author: string;
  version: string;
  data: any;
}

interface ThemeState {
  currentTheme: string;
  themes: Theme[];
  applyTheme: (themeId: string) => Promise<void>;
  installTheme: (themeData: any) => Promise<void>;
  createTheme: (theme: any) => Promise<void>;
  fetchThemes: () => Promise<void>;
  fetchMarketplace: () => Promise<any[]>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'hydra-dark',
      themes: [],
      applyTheme: async (themeId: string) => {
        await api.themes.setTheme(themeId);
        set({ currentTheme: themeId });
        const theme = get().themes.find(t => t.id === themeId);
        if (theme) {
          const root = document.documentElement;
          Object.entries(theme.data.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value as string);
          });
        }
      },
      installTheme: async (themeData: any) => {
        const result = await api.themes.installTheme(themeData);
        if (result.success) {
          set((state) => ({ themes: [...state.themes, { ...themeData, id: result.themeId }] }));
        }
      },
      createTheme: async (theme: any) => {
        const result = await api.themes.createTheme(theme);
        if (result.success) {
          set((state) => ({ themes: [...state.themes, { ...theme, id: result.themeId }] }));
        }
      },
      fetchThemes: async () => {
        const themes = await api.themes.getThemes();
        set({ themes });
      },
      fetchMarketplace: async () => {
        return await api.themes.getMarketplace();
      },
    }),
    { name: 'partyup-theme', partialize: (state) => ({ currentTheme: state.currentTheme }) }
  )
);
