import React from 'react';
import { ListTodo, Search, Sun, Moon } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useThemeStore } from '@/store/themeStore';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, isConnected } = useTaskStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 header z-50 transition-colors duration-300">
      <div className="h-full flex items-center justify-between px-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-primary-text dark:text-dark-primary-text transition-colors duration-300">Roadmap Manager</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text transition-colors duration-300" />
            ) : (
              <Sun className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text transition-colors duration-300" />
            )}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder-text dark:text-dark-placeholder-text transition-colors duration-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-48 pl-9 pr-4 py-2 text-sm search-input transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-secondary-text dark:text-dark-secondary-text transition-colors duration-300">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};