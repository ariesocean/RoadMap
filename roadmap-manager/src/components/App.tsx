import React, { useEffect, useState, useRef } from 'react';
import { ListTodo, Search, Sun, Moon } from 'lucide-react';
import { TaskList } from './TaskList';
import { InputArea } from './InputArea';
import { ResultModal } from './ResultModal';
import { MapsSidebar } from './MapsSidebar';
import { useMaps } from '@/hooks/useMaps';
import { useMapsStore } from '@/store/mapsStore';
import { useTaskStore } from '@/store/taskStore';
import { useThemeStore } from '@/store/themeStore';
import { useSession } from '@/hooks/useSession';
import { initOpencodeSDK, closeOpencodeSDK } from '@/services/opencodeSDK';
import { initializeModelStore } from '@/store/modelStore';
import { readRoadmapFile, writeMapFile } from '@/services/fileService';

export const App: React.FC = () => {
  const { refreshTasks, searchQuery, setSearchQuery, isConnected, toggleConnected } = useTaskStore();
  const { theme, toggleTheme } = useThemeStore();
  const { cleanupAllSessions } = useSession();
  const { isSidebarCollapsed, setLoadingEnabled, setCurrentMap, currentMap, setSidebarCollapsed, availableMaps, lastEditedMapId, lastEditedMapIdLoaded, loadingEnabled, loadLastEditedMapId, resetLastEditedMapIdLoaded } = useMapsStore();
  const {
    handleMapSelect,
    handleCreateMap,
    handleDeleteMap,
    handleRenameMap,
  } = useMaps();
  const [isInitialized, setIsInitialized] = useState(false);
  const hasAutoSelectedMap = useRef(false);

  // Auto-select last edited map when connecting and maps are loaded
  useEffect(() => {
    if (!isInitialized) return;

    // Only auto-select if:
    // - loadingEnabled is true (maps have been discovered)
    // - There are available maps
    // - We've loaded lastEditedMapId from backend
    // - We have a lastEditedMapId
    // - haven't auto-selected yet
    if (loadingEnabled && availableMaps.length > 0 && lastEditedMapIdLoaded && lastEditedMapId && !hasAutoSelectedMap.current) {
      const lastMap = availableMaps.find(m => m.id === lastEditedMapId);

      if (lastMap && currentMap?.id !== lastMap.id) {
        // Auto-select the last edited map
        hasAutoSelectedMap.current = true;
        handleMapSelect(lastMap);
      } else if (lastMap && currentMap?.id === lastMap.id && isConnected) {
        // Map is already selected, just need to refresh tasks
        hasAutoSelectedMap.current = true;
        refreshTasks();
      }
    }
  }, [isInitialized, availableMaps, lastEditedMapId, lastEditedMapIdLoaded, currentMap, loadingEnabled, isConnected, handleMapSelect, refreshTasks]);

  // Reset auto-select flag when disconnecting
  useEffect(() => {
    if (!isConnected) {
      hasAutoSelectedMap.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    initOpencodeSDK().catch(console.error);

    initializeModelStore();

    const savedTheme = localStorage.getItem('theme-storage');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        const savedThemeValue = parsed.state?.theme || 'light';
        useThemeStore.getState().setTheme(savedThemeValue);
      } catch {
        useThemeStore.getState().setTheme('light');
      }
    } else {
      useThemeStore.getState().setTheme('light');
    }

    setIsInitialized(true);

    return () => {
      cleanupAllSessions();
      closeOpencodeSDK();
    };
  }, [cleanupAllSessions]);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background dark:bg-dark-background transition-colors duration-300">
        {/* Unified Header */}
        <header className="fixed top-0 left-0 right-0 h-14 header z-40 flex items-center px-3 sm:px-4 md:px-5 lg:px-6 transition-colors duration-300 border-b border-border-color">
          {/* Sidebar Toggle */}
          <MapsSidebar
            onMapSelect={handleMapSelect}
            onCreateMap={handleCreateMap}
            onDeleteMap={handleDeleteMap}
            onRenameMap={handleRenameMap}
          />

          {/* Logo and Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 ml-2">
            <div className="w-7 h-7 sm:w-8 md:w-8 lg:w-8 bg-primary rounded-lg flex items-center justify-center">
              <ListTodo className="w-4 h-4 sm:w-5 md:w-5 lg:w-5 text-white" />
            </div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary-text dark:text-dark-primary-text">
              <span className="inline sm:hidden">Roadmap</span>
              <span className="hidden sm:inline">Roadmap Manager</span>
            </h1>
          </div>
          
          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text" />
              ) : (
                <Sun className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text" />
              )}
            </button>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder-text dark:text-dark-placeholder-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-[88px] sm:w-40 md:w-44 lg:w-48 pl-9 pr-4 py-2 text-sm search-input"
              />
            </div>
            
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80"
              onClick={async () => {
                const newState = !isConnected;
                toggleConnected();
                setLoadingEnabled(newState);

                if (newState) {
                  // When connecting: load last edited map ID from backend ONLY
                  const lastMapId = await loadLastEditedMapId();
                  if (lastMapId) {
                    // Auto-select will handle this via the useEffect
                  }
                } else {
                  // When disconnecting: save current roadmap to current map file
                  if (currentMap) {
                    const currentContent = await readRoadmapFile();
                    await writeMapFile(currentMap, currentContent);
                    console.log(`[Maps] Saved content to: ${currentMap.filename}`);
                  }
                  // Clear current map only - lastEditedMapId stays as-is for next connect
                  setCurrentMap(null);
                  setSidebarCollapsed(true);
                  resetLastEditedMapIdLoaded();
                  refreshTasks(); // Clear tasks since we're disconnected
                }
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-secondary-text dark:text-dark-secondary-text">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </header>

        <main
          className="pt-14 pb-20 sm:pb-20 md:pb-22 lg:pb-24 transition-all duration-300"
          style={{ marginLeft: isSidebarCollapsed ? 0 : 'clamp(140px, 18vw, 200px)' }}
        >
          <div className="max-w-[800px] mx-auto py-4 sm:py-5 md:py-5 lg:py-6 px-3 sm:px-4 md:px-5 lg:px-6">
            <TaskList />
          </div>
        </main>

        <InputArea />

        <ResultModal />
      </div>
    </div>
  );
};

export default App;
