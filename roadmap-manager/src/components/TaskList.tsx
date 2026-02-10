import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ClipboardList } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from './TaskCard';

export const TaskList: React.FC = () => {
  const {
    tasks,
    isLoading,
    searchQuery,
    refreshTasks,
  } = useTaskStore();

  useEffect(() => {
    refreshTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      task.originalPrompt.toLowerCase().includes(query) ||
      task.subtasks.some((subtask) =>
        subtask.content.toLowerCase().includes(query)
      )
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full text-center px-6"
      >
        <ClipboardList className="w-16 h-16 text-border-color mb-4" />
        <h3 className="text-lg font-semibold text-primary-text mb-2">
          {searchQuery ? 'No tasks found' : 'No tasks yet'}
        </h3>
        <p className="text-sm text-secondary-text">
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Enter a prompt below to create your first task'}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {filteredTasks.map((task, index) => (
          <TaskCard key={task.id} task={task} index={index} />
        ))}
      </AnimatePresence>
    </div>
  );
};