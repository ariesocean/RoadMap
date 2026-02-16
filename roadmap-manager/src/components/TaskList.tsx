import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ClipboardList } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/store/taskStore';
import { TaskCard } from './TaskCard';
import type { Task } from '@/store/types';

const SortableTaskCard = React.forwardRef<HTMLDivElement, { task: Task; index: number }>(
  ({ task, index }, ref) => {
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
      opacity: isDragging ? 0.3 : 1,
    };

    const combinedRef = (node: HTMLDivElement | null) => {
      setNodeRef(node);
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <div ref={combinedRef} style={style} {...attributes}>
        <div {...listeners}>
          <TaskCard task={task} index={index} />
        </div>
      </div>
    );
  }
);

SortableTaskCard.displayName = 'SortableTaskCard';

export const TaskList: React.FC = () => {
  const {
    tasks,
    isLoading,
    searchQuery,
    refreshTasks,
    reorderTasks,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex(t => t.id === active.id);
    const newIndex = tasks.findIndex(t => t.id === over.id);

    const newOrder = [...tasks];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    await reorderTasks(newOrder);
  };

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
        <ClipboardList className="w-16 h-16 text-border-color dark:text-dark-border-color mb-4 transition-colors duration-300" />
        <h3 className="text-lg font-semibold text-primary-text dark:text-dark-primary-text mb-2 transition-colors duration-300">
          {searchQuery ? 'No tasks found' : 'No tasks yet'}
        </h3>
        <p className="text-sm text-secondary-text dark:text-dark-secondary-text transition-colors duration-300">
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Enter a prompt below to create your first task'}
        </p>
      </motion.div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredTasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="max-w-[800px] mx-auto px-6 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task, index) => (
              <SortableTaskCard key={task.id} task={task} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-90 shadow-2xl scale-105">
            <TaskCard task={activeTask} index={0} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
