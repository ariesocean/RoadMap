import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, Plus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface SessionListProps {
  onSelect?: () => void;
}

export const SessionList: React.FC<SessionListProps> = ({ onSelect }) => {
  const { sessions, currentSession, switchToSession, deleteSession, createNewSession } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allSessions = Object.values(sessions).sort(
    (a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSession = (sessionId: string) => {
    switchToSession(sessionId);
    setIsOpen(false);
    onSelect?.();
  };

  const handleCreateNewSession = () => {
    createNewSession();
    setIsOpen(false);
    onSelect?.();
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
      >
        <span className="text-xs text-secondary-text dark:text-dark-secondary-text truncate max-w-[120px]">
          {currentSession?.title || 'New Conversation'}
        </span>
        <ChevronDown className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-2 border-b border-border-color dark:border-dark-border-color">
            <button
              onClick={handleCreateNewSession}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary dark:text-primary-dark hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {allSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-secondary-bg dark:bg-dark-secondary-bg'
                    : ''
                }`}
              >
                <span className="text-sm text-primary-text dark:text-dark-primary-text truncate flex-1">
                  {session.title}
                </span>
                {allSessions.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionList;
