import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface SessionDisplayProps {
  onNewSession?: () => void;
}

export const SessionDisplay: React.FC<SessionDisplayProps> = ({ onNewSession }) => {
  const { currentSession, clearCurrentSession } = useSession();

  const handleNewSession = () => {
    clearCurrentSession();
    onNewSession?.();
  };

  if (!currentSession) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary-bg dark:bg-dark-secondary-bg rounded-lg">
        <MessageSquare className="w-4 h-4 text-secondary-text dark:text-dark-secondary-text" />
        <span className="text-sm text-secondary-text dark:text-dark-secondary-text">
          New Conversation
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-secondary-bg dark:bg-dark-secondary-bg rounded-lg">
      <MessageSquare className="w-4 h-4 text-secondary-text dark:text-dark-secondary-text" />
      <span
        className="text-sm font-medium text-primary-text dark:text-dark-primary-text truncate max-w-[200px]"
        title={currentSession.title}
      >
        {currentSession.title}
      </span>
      <button
        onClick={handleNewSession}
        className="p-1 rounded hover:bg-primary/10 dark:hover:bg-primary-dark/10 transition-colors"
        title="Start new conversation"
        aria-label="Start new conversation"
      >
        <Plus className="w-4 h-4 text-primary dark:text-primary-dark" />
      </button>
    </div>
  );
};

export default SessionDisplay;
