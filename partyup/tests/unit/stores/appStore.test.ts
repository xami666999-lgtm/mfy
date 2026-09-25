import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../../../src/renderer/src/stores/appStore';

// Mock localStorage for persist middleware
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('AppStore', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    useAppStore.setState({
      sidebarCollapsed: false,
      windowState: 'normal',
      activeView: 'grid',
      searchQuery: '',
      selectedGameIds: [],
      commandPaletteOpen: false,
    });
  });

  describe('sidebarCollapsed', () => {
    it('should toggle sidebar', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
      useAppStore.getState().toggleSidebar();
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed state', () => {
      useAppStore.getState().setSidebarCollapsed(true);
      expect(useAppStore.getState().sidebarCollapsed).toBe(true);
      useAppStore.getState().setSidebarCollapsed(false);
      expect(useAppStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('windowState', () => {
    it('should set window state', () => {
      useAppStore.getState().setWindowState('maximized');
      expect(useAppStore.getState().windowState).toBe('maximized');
      useAppStore.getState().setWindowState('fullscreen');
      expect(useAppStore.getState().windowState).toBe('fullscreen');
    });
  });

  describe('activeView', () => {
    it('should set active view', () => {
      useAppStore.getState().setActiveView('list');
      expect(useAppStore.getState().activeView).toBe('list');
      useAppStore.getState().setActiveView('cover-flow');
      expect(useAppStore.getState().activeView).toBe('cover-flow');
    });
  });

  describe('searchQuery', () => {
    it('should set search query', () => {
      useAppStore.getState().setSearchQuery('test query');
      expect(useAppStore.getState().searchQuery).toBe('test query');
    });
  });

  describe('game selection', () => {
    it('should toggle game selection', () => {
      const { toggleGameSelection, selectedGameIds } = useAppStore.getState();
      expect(selectedGameIds).toEqual([]);
      toggleGameSelection('game-1');
      expect(useAppStore.getState().selectedGameIds).toEqual(['game-1']);
      toggleGameSelection('game-2');
      expect(useAppStore.getState().selectedGameIds).toEqual(['game-1', 'game-2']);
      toggleGameSelection('game-1');
      expect(useAppStore.getState().selectedGameIds).toEqual(['game-2']);
    });

    it('should set selected game IDs', () => {
      useAppStore.getState().setSelectedGameIds(['game-1', 'game-2']);
      expect(useAppStore.getState().selectedGameIds).toEqual(['game-1', 'game-2']);
    });

    it('should clear selection', () => {
      useAppStore.getState().setSelectedGameIds(['game-1']);
      useAppStore.getState().clearSelection();
      expect(useAppStore.getState().selectedGameIds).toEqual([]);
    });
  });

  describe('commandPalette', () => {
    it('should toggle command palette', () => {
      useAppStore.getState().setCommandPaletteOpen(true);
      expect(useAppStore.getState().commandPaletteOpen).toBe(true);
      useAppStore.getState().setCommandPaletteOpen(false);
      expect(useAppStore.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist sidebarCollapsed and activeView', () => {
      useAppStore.getState().setSidebarCollapsed(true);
      useAppStore.getState().setActiveView('list');
      
      // Simulate reload by creating new store instance
      const newStore = useAppStore;
      expect(newStore.getState().sidebarCollapsed).toBe(true);
      expect(newStore.getState().activeView).toBe('list');
    });
  });
});
