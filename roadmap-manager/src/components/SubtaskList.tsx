import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  DragOverEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Subtask } from '@/store/types';
import { useTaskStore } from '@/store/taskStore';

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
}

interface SortableSubtaskItemProps {
  subtask: Subtask;
  taskId: string;
  isOverNesting?: boolean;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5'
      }
    }
  })
};

const SortableSubtaskItem: React.FC<SortableSubtaskItemProps & { 
  isOverNesting?: boolean; 
}> = ({ subtask, taskId, isOverNesting }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SubtaskItemContent 
        subtask={subtask} 
        taskId={taskId} 
        isOverNesting={isOverNesting}
      />
    </div>
  );
};

const SubtaskItemContent: React.FC<SortableSubtaskItemProps & { 
  isOverNesting?: boolean; 
}> = ({ 
  subtask, 
  taskId, 
  isOverNesting = false
}) => {
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
      className={`flex items-center gap-2 py-2 px-2 rounded-md transition-colors ${
        isOverNesting 
          ? 'bg-primary/10 dark:bg-primary/20 border-2 border-primary border-dashed' 
          : 'hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg'
      }`}
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
  const { reorderSubtasks } = useTaskStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState(subtasks);
  const [isInNestingMode, setIsInNestingMode] = useState(false);
  const [targetNestingLevel, setTargetNestingLevel] = useState<number | null>(null);

  useEffect(() => {
    setLocalSubtasks(subtasks);
  }, [subtasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!activeId) return;
    
    const { active, over, delta } = event;
    
    if (over && over.id !== active.id) {
      if (Math.abs(delta.x) > Math.abs(delta.y) && Math.abs(delta.x) > 20) {
        setIsInNestingMode(true);
        
        const activeSubtask = localSubtasks.find(s => s.id === active.id);
        if (activeSubtask) {
          const newLevel = activeSubtask.nestedLevel + (delta.x > 0 ? 1 : -1);
          setTargetNestingLevel(Math.max(0, Math.min(6, newLevel)));
        }
      } else {
        setIsInNestingMode(false);
        setTargetNestingLevel(null);
      }
    } else {
      setIsInNestingMode(false);
      setTargetNestingLevel(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsInNestingMode(false);
    setTargetNestingLevel(null);

    if (!over) return;

    if (isInNestingMode && targetNestingLevel !== null) {
      const activeSubtask = localSubtasks.find(s => s.id === active.id);
      if (activeSubtask && activeSubtask.nestedLevel !== targetNestingLevel) {
        const updatedSubtasks = localSubtasks.map(s => {
          if (s.id === active.id) {
            return { ...s, nestedLevel: targetNestingLevel };
          }
          return s;
        });
        
        setLocalSubtasks(updatedSubtasks);
        
        const updateData = updatedSubtasks.map(({ id, nestedLevel }) => ({
          id,
          nestedLevel
        }));
        await reorderSubtasks(taskId, updateData);
      }
    } else if (active.id !== over.id) {
      const oldIndex = localSubtasks.findIndex(s => s.id === active.id);
      const newIndex = localSubtasks.findIndex(s => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(localSubtasks, oldIndex, newIndex);
        setLocalSubtasks(newOrder);

        const updateData = newOrder.map(({ id, nestedLevel }) => ({
          id,
          nestedLevel
        }));
        await reorderSubtasks(taskId, updateData);
      }
    }
  };
  
  const activeSubtask = activeId
    ? localSubtasks.find(s => s.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <SortableContext
        items={localSubtasks.map(s => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {localSubtasks.map((subtask) => (
            <SortableSubtaskItem
              key={subtask.id}
              subtask={subtask}
              taskId={taskId}
              isOverNesting={activeId === subtask.id && isInNestingMode}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeSubtask ? (
          <div className="opacity-80">
            <SubtaskItemContent
              subtask={activeSubtask}
              taskId={taskId}
              isOverNesting={isInNestingMode}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
