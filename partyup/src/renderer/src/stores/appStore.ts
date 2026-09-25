import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  windowState: 'normal' | 'maximized' | 'minimized' | 'fullscreen';
  setWindowState: (state: AppState['windowState']) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedGameIds: string[];
  setSelectedGameIds: (ids: string[]) => void;
  toggleGameSelection: (id: string) => void;
  clearSelection: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      windowState: 'normal',
      setWindowState: (state) => set({ windowState: state }),
      activeView: 'grid',
      setActiveView: (view) => set({ activeView: view }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedGameIds: [],
      setSelectedGameIds: (ids) => set({ selectedGameIds: ids }),
      toggleGameSelection: (id) => set((state) => ({
        selectedGameIds: state.selectedGameIds.includes(id)
          ? state.selectedGameIds.filter(i => i !== id)
          : [...state.selectedGameIds, id]
      })),
      clearSelection: () => set({ selectedGameIds: [] }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    { name: 'partyup-app', partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, activeView: state.activeView }) }
  )
);
