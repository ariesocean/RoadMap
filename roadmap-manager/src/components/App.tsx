import React, { useEffect, useState } from 'react';
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

export const App: React.FC = () => {
  const { refreshTasks, searchQuery, setSearchQuery, isConnected } = useTaskStore();
  const { theme, toggleTheme } = useThemeStore();
  const { initializeSession, cleanupAllSessions } = useSession();
  const { isSidebarCollapsed } = useMapsStore();
  const {
    handleMapSelect,
    handleCreateMap,
    handleDeleteMap,
    handleRenameMap,
  } = useMaps();
  const [isInitialized, setIsInitialized] = useState(false);

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

    initializeSession();
    setIsInitialized(true);

    refreshTasks();

    return () => {
      cleanupAllSessions();
      closeOpencodeSDK();
    };
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background dark:bg-dark-background transition-colors duration-300">
        {/* Unified Header */}
        <header className="fixed top-0 left-0 right-0 h-14 bg-[#1e1e1e] z-40 flex items-center px-4 transition-colors duration-300">
          {/* Sidebar Toggle */}
          <MapsSidebar
            onMapSelect={handleMapSelect}
            onCreateMap={handleCreateMap}
            onDeleteMap={handleDeleteMap}
            onRenameMap={handleRenameMap}
          />

          {/* Logo and Title */}
          <div className="flex items-center gap-2 ml-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
              <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-base sm:text-xl font-semibold text-white">
              Roadmap Manager
            </h1>
          </div>
          
          {/* Right Section */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-400" />
              )}
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-32 sm:w-48 pl-9 pr-4 py-2 text-sm bg-[#3c3c3c] text-white placeholder-gray-500 rounded-md border-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        <main
          className="pt-14 pb-20 sm:pb-24 transition-all duration-300"
          style={{ marginLeft: isSidebarCollapsed ? 0 : 'clamp(140px, 18vw, 200px)' }}
        >
          <div className="max-w-[800px] mx-auto py-4 sm:py-6 px-4 sm:px-6">
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
