import React, { useEffect, useState } from 'react';
import { Header } from './Header';
import { TaskList } from './TaskList';
import { InputArea } from './InputArea';
import { ResultModal } from './ResultModal';
import { useTaskStore } from '@/store/taskStore';
import { useThemeStore } from '@/store/themeStore';
import { initOpencodeSDK, closeOpencodeSDK } from '@/services/opencodeSDK';

export const App: React.FC = () => {
  const { refreshTasks } = useTaskStore();
  const { theme } = useThemeStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initOpencodeSDK().catch(console.error);

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

    refreshTasks();

    return () => {
      closeOpencodeSDK();
    };
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-background dark:bg-dark-background transition-colors duration-300">
        <Header />

        <main className="pt-14 pb-24 px-6">
          <div className="max-w-[800px] mx-auto py-6">
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