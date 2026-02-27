import { useEffect, useCallback } from 'react';
import { useMapsStore, type MapInfo } from '@/store/mapsStore';
import {
  listMaps,
  createMap,
  deleteMap,
  renameMap,
  readMapFile,
  writeMapFile,
  readRoadmapFile,
  writeRoadmapFile,
} from '@/services/fileService';
import { useTaskStore } from '@/store/taskStore';

export const useMaps = () => {
  const {
    availableMaps,
    currentMap,
    isSidebarCollapsed,
    isLoading,
    isSwitching,
    error,
    setAvailableMaps,
    setCurrentMap,
    toggleSidebar,
    setLoading,
    setSwitching,
    setError,
    addMap,
    removeMap,
    updateMapName,
    setLastEditedMapId,
  } = useMapsStore();

  const { refreshTasks } = useTaskStore();
  const { loadingEnabled } = useMapsStore();

  // Initialize: discover available maps on mount only when loadingEnabled is true
  useEffect(() => {
    if (!loadingEnabled) return;
    
    const discoverMaps = async () => {
      setLoading(true);
      try {
        const maps = await listMaps();
        setAvailableMaps(maps);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to discover maps');
      } finally {
        setLoading(false);
      }
    };

    discoverMaps();
  }, [loadingEnabled]);

  // Handle map selection with auto-archive
  const handleMapSelect = useCallback(async (map: MapInfo) => {
    // Don't do anything if already switching or selecting the same map
    if (isSwitching || currentMap?.id === map.id) return;

    setSwitching(true);
    setLoading(true);
    setError(null);

    try {
      // 1. Archive current roadmap.md to previous map file (if exists)
      if (currentMap) {
        const currentContent = await readRoadmapFile();
        await writeMapFile(currentMap, currentContent);
        console.log(`[Maps] Archived current content to: ${currentMap.filename}`);
      }

      // 2. Load new map content into roadmap.md
      const newContent = await readMapFile(map);
      await writeRoadmapFile(newContent, null); // Don't auto-save when loading a new map
      console.log(`[Maps] Loaded new map: ${map.filename}`);

      // 3. Update current map in store
      setCurrentMap(map);

      // 4. Update last edited map
      setLastEditedMapId(map.id);

      // 5. Reload tasks from the new roadmap.md
      await refreshTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch map');
      console.error('[Maps] Error switching map:', err);
    } finally {
      setSwitching(false);
      setLoading(false);
    }
  }, [currentMap, isSwitching, setSwitching, setLoading, setError, setCurrentMap, setLastEditedMapId, refreshTasks]);

  // Handle creating a new map
  const handleCreateMap = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);

    try {
      const newMap = await createMap(name);
      if (newMap) {
        addMap(newMap);
        console.log(`[Maps] Created new map: ${newMap.filename}`);

        // Auto-select the newly created map
        await handleMapSelect(newMap);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, addMap, handleMapSelect]);

  // Handle deleting a map
  const handleDeleteMap = useCallback(async (map: MapInfo) => {
    setLoading(true);
    setError(null);

    try {
      const success = await deleteMap(map);
      if (success) {
        // If deleting the current map, clear the current map
        if (currentMap?.id === map.id) {
          setCurrentMap(null);
          // Clear roadmap.md when deleting current map
          await writeRoadmapFile('# Roadmap\n\n');
          await refreshTasks();
        }
        removeMap(map.id);
        console.log(`[Maps] Deleted map: ${map.filename}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete map');
    } finally {
      setLoading(false);
    }
  }, [currentMap, setLoading, setError, setCurrentMap, removeMap, refreshTasks]);

  // Handle renaming a map
  const handleRenameMap = useCallback(async (map: MapInfo, newName: string) => {
    setLoading(true);
    setError(null);

    try {
      const renamedMap = await renameMap(map, newName);
      if (renamedMap) {
        updateMapName(map.id, renamedMap.name, renamedMap.filename);
        // If renaming the current map, update current map reference
        if (currentMap?.id === map.id) {
          setCurrentMap(renamedMap);
        }
        console.log(`[Maps] Renamed map: ${map.filename} -> ${renamedMap.filename}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename map');
    } finally {
      setLoading(false);
    }
  }, [currentMap, setLoading, setError, updateMapName, setCurrentMap]);

  // Save current roadmap content (for manual save or before unload)
  const saveCurrentMap = useCallback(async () => {
    if (!currentMap) return;

    try {
      const content = await readRoadmapFile();
      await writeMapFile(currentMap, content);
      console.log(`[Maps] Saved current map: ${currentMap.filename}`);
    } catch (err) {
      console.error('[Maps] Error saving current map:', err);
    }
  }, [currentMap]);

  return {
    // State
    availableMaps,
    currentMap,
    isSidebarCollapsed,
    isLoading,
    error,

    // Actions
    handleMapSelect,
    handleCreateMap,
    handleDeleteMap,
    handleRenameMap,
    toggleSidebar,
    saveCurrentMap,
  };
};

export default useMaps;
