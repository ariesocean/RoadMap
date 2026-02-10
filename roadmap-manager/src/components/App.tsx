import React, { useEffect } from 'react';
import { Header } from './Header';
import { TaskList } from './TaskList';
import { InputArea } from './InputArea';
import { useTaskStore } from '@/store/taskStore';

export const App: React.FC = () => {
  const { refreshTasks } = useTaskStore();

  useEffect(() => {
    // Initial load
    refreshTasks();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshTasks]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14 pb-24 px-6">
        <div className="max-w-[800px] mx-auto py-6">
          <TaskList />
        </div>
      </main>

      <InputArea />
    </div>
  );
};

export default App;