import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
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
  const { toggleSubtask, updateSubtaskContent } = useTaskStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSubtask(taskId, subtask.id);
  };

  const handleTextClick = () => {
    setIsEditing(true);
    setEditValue(subtask.content);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editValue.trim() && editValue !== subtask.content) {
        await updateSubtaskContent(taskId, subtask.id, editValue.trim());
      }
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(subtask.content);
    }
  };

  const handleBlur = async () => {
    if (editValue.trim() && editValue !== subtask.content) {
      await updateSubtaskContent(taskId, subtask.id, editValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors cursor-pointer group"
      style={{ marginLeft: `${subtask.nestedLevel * 24}px` }}
    >
      <motion.div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          subtask.completed
            ? 'bg-primary border-primary'
            : 'border-border-color dark:border-dark-border-color bg-white dark:bg-dark-card-bg'
        }`}
        whileTap={{ scale: 0.9 }}
        onClick={handleCheckboxClick}
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

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="flex-1 text-sm bg-white dark:bg-dark-secondary-bg border border-primary rounded px-2 py-1 outline-none text-primary-text dark:text-dark-primary-text"
        />
      ) : (
        <span
          className={`flex-1 text-sm transition-all group-hover:text-primary-text dark:group-hover:text-dark-primary-text ${
            subtask.completed
              ? 'text-secondary-text dark:text-dark-secondary-text line-through'
              : 'text-primary-text dark:text-dark-primary-text'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handleTextClick();
          }}
        >
          {subtask.content}
        </span>
      )}

      {!isEditing && (
        <Pencil
          className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            handleTextClick();
          }}
        />
      )}
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