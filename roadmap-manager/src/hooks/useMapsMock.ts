import { useEffect } from 'react';
import { useMapsStore, type MapInfo } from '@/store/mapsStore';

/**
 * Mock hook for maps sidebar UI testing (UI ONLY - no backend integration)
 * This provides mock data and handlers for testing the UI components
 */
export const useMapsMock = () => {
  const {
    setAvailableMaps,
    setCurrentMap,
    addMap,
    removeMap,
    updateMapName,
    setLoading,
  } = useMapsStore();

  // Initialize with mock data for UI testing
  useEffect(() => {
    // Mock data - simulating discovered map files
    const mockMaps: MapInfo[] = [
      { id: '1', name: 'roadmap', filename: 'roadmap.md' },
      { id: '2', name: 'trading', filename: 'map-trading.md' },
      { id: '3', name: 'learning-plan', filename: 'map-learning-plan.md' },
      { id: '4', name: 'project-alpha', filename: 'map-project-alpha.md' },
    ];
    setAvailableMaps(mockMaps);
    setCurrentMap(mockMaps[0]);
  }, []);

  // Mock handlers for UI interactions
  const handleMapSelect = (map: MapInfo) => {
    setLoading(true);
    // Simulate loading delay for UX
    setTimeout(() => {
      setCurrentMap(map);
      setLoading(false);
      console.log(`[Mock] Switched to map: ${map.name}`);
    }, 300);
  };

  const handleCreateMap = (name: string) => {
    const newMap: MapInfo = {
      id: Date.now().toString(),
      name: name.toLowerCase().replace(/\s+/g, '-'),
      filename: `map-${name.toLowerCase().replace(/\s+/g, '-')}.md`,
    };
    addMap(newMap);
    console.log(`[Mock] Created new map: ${newMap.name}`);
  };

  const handleDeleteMap = (map: MapInfo) => {
    removeMap(map.id);
    console.log(`[Mock] Deleted map: ${map.name}`);
  };

  const handleRenameMap = (map: MapInfo, newName: string) => {
    const newFilename = map.filename.replace(map.name, newName.toLowerCase().replace(/\s+/g, '-'));
    updateMapName(map.id, newName.toLowerCase().replace(/\s+/g, '-'), newFilename);
    console.log(`[Mock] Renamed map: ${map.name} -> ${newName}`);
  };

  return {
    handleMapSelect,
    handleCreateMap,
    handleDeleteMap,
    handleRenameMap,
  };
};
