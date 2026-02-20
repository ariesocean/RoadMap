import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapInfo } from '@/services/fileService';

interface MapsState {
  // State
  availableMaps: MapInfo[];
  currentMap: MapInfo | null;
  isSidebarCollapsed: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAvailableMaps: (maps: MapInfo[]) => void;
  setCurrentMap: (map: MapInfo | null) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addMap: (map: MapInfo) => void;
  removeMap: (mapId: string) => void;
  updateMapName: (mapId: string, newName: string, newFilename: string) => void;
}

export type { MapInfo };

export const useMapsStore = create<MapsState>()(
  persist(
    (set) => ({
      // Initial state
      availableMaps: [],
      currentMap: null,
      isSidebarCollapsed: false,
      isLoading: false,
      error: null,

      // Actions
      setAvailableMaps: (maps) => set({ availableMaps: maps }),

      setCurrentMap: (map) => set({ currentMap: map }),

      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      addMap: (map) => set((state) => ({
        availableMaps: [...state.availableMaps, map]
      })),

      removeMap: (mapId) => set((state) => ({
        availableMaps: state.availableMaps.filter(m => m.id !== mapId),
        currentMap: state.currentMap?.id === mapId ? null : state.currentMap
      })),

      updateMapName: (mapId, newName, newFilename) => set((state) => ({
        availableMaps: state.availableMaps.map(m =>
          m.id === mapId
            ? { ...m, name: newName, filename: newFilename }
            : m
        ),
        currentMap: state.currentMap?.id === mapId
          ? { ...state.currentMap, name: newName, filename: newFilename }
          : state.currentMap
      })),
    }),
    {
      name: 'maps-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
      }),
    }
  )
);
