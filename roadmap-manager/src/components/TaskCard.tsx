import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Calendar, CheckCircle2 } from 'lucide-react';
import type { Task } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';
import { formatRelativeTime } from '@/utils/dateUtils';
import { SubtaskList } from './SubtaskList';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { toggleTaskExpanded } = useTaskStore();

  const progressPercentage = task.totalSubtasks > 0
    ? (task.completedSubtasks / task.totalSubtasks) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="card mb-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-primary-text mb-1">
            {task.title}
          </h3>
          
          {task.originalPrompt && (
            <p className="text-sm text-secondary-text mb-2 italic">
              "{task.originalPrompt}"
            </p>
          )}
          
          <div className="flex items-center gap-4 text-xs text-secondary-text">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{formatRelativeTime(task.createdAt)}</span>
            </div>
            
            {task.totalSubtasks > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{task.completedSubtasks}/{task.totalSubtasks} completed</span>
              </div>
            )}
          </div>
          
          {task.totalSubtasks > 0 && (
            <div className="mt-3 h-1 bg-secondary-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
        
        {task.subtasks.length > 0 && (
          <button
            onClick={() => toggleTaskExpanded(task.id)}
            className="p-1 hover:bg-secondary-bg rounded transition-colors"
          >
            <motion.div
              animate={{ rotate: task.isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-secondary-text" />
            </motion.div>
          </button>
        )}
      </div>
      
      {task.isExpanded && task.subtasks.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-card-border"
        >
          <SubtaskList subtasks={task.subtasks} taskId={task.id} />
        </motion.div>
      )}
    </motion.div>
  );
};