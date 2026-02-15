import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, CheckCircle2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';
import { formatDate } from '@/utils/dateUtils';
import { SubtaskList } from './SubtaskList';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index }) => {
  const { toggleTaskExpanded } = useTaskStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-secondary-text/50" />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-primary-text dark:text-dark-primary-text mb-1 transition-colors duration-300">
              {task.title}
            </h3>

            {task.originalPrompt && (
              <p className="text-sm text-secondary-text dark:text-dark-secondary-text mb-2 italic transition-colors duration-300">
                "{task.originalPrompt}"
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-secondary-text dark:text-dark-secondary-text transition-colors duration-300">
              {task.totalSubtasks > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{task.completedSubtasks}/{task.totalSubtasks} completed</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-secondary-text/80 dark:text-dark-secondary-text/80 transition-colors duration-300">
            {formatDate(task.createdAt)}
          </span>

          {task.subtasks.length > 0 && (
            <button
              onClick={() => toggleTaskExpanded(task.id)}
              className="p-1 hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
            >
              <motion.div
                animate={{ rotate: task.isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-secondary-text dark:text-dark-secondary-text transition-colors duration-300" />
              </motion.div>
            </button>
          )}
        </div>
      </div>

      {task.totalSubtasks > 0 && (
        <div className="mt-3 h-1 bg-secondary-bg dark:bg-dark-secondary-bg rounded-full overflow-hidden transition-colors duration-300">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {task.isExpanded && task.subtasks.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 pt-4 border-t border-card-border dark:border-dark-card-border transition-colors duration-300"
        >
          <SubtaskList subtasks={task.subtasks} taskId={task.id} />
        </motion.div>
      )}
    </motion.div>
  );
};