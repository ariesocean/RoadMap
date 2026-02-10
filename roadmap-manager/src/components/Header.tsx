import React from 'react';
import { ListTodo, Search } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, isConnected } = useTaskStore();

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border-color z-50">
      <div className="h-full flex items-center justify-between px-6 max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-primary-text">Roadmap Manager</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-placeholder-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-48 pl-9 pr-4 py-2 text-sm border border-border-color rounded-md bg-secondary-bg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-secondary-text">
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};