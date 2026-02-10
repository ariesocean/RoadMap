import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Subtask } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
}

interface SubtaskItemProps {
  subtask: Subtask;
  taskId: string;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, taskId }) => {
  const { toggleSubtask } = useTaskStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-secondary-bg transition-colors cursor-pointer"
      style={{ marginLeft: `${subtask.nestedLevel * 24}px` }}
      onClick={() => toggleSubtask(taskId, subtask.id)}
    >
      <motion.div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          subtask.completed
            ? 'bg-primary border-primary'
            : 'border-border-color bg-white'
        }`}
        whileTap={{ scale: 0.9 }}
      >
        {subtask.completed && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
      
      <span
        className={`text-sm transition-all ${
          subtask.completed
            ? 'text-secondary-text line-through'
            : 'text-primary-text'
        }`}
      >
        {subtask.content}
      </span>
    </motion.div>
  );
};

export const SubtaskList: React.FC<SubtaskListProps> = ({ subtasks, taskId }) => {
  return (
    <div className="space-y-1">
      {subtasks.map((subtask) => (
        <SubtaskItem key={subtask.id} subtask={subtask} taskId={taskId} />
      ))}
    </div>
  );
};