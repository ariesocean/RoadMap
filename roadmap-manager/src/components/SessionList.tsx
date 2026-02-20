import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, RefreshCw, MessageSquare, Trash2 } from 'lucide-react';
import { useSession } from '@/hooks/useSession';

interface SessionListProps {
  onSelect?: () => void;
}

const sessionListStyles = `
  .session-dropdown-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .session-dropdown-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .session-dropdown-scroll::-webkit-scrollbar-thumb {
    background-color: #E1DFDD;
    border-radius: 3px;
  }
  .dark .session-dropdown-scroll::-webkit-scrollbar-thumb {
    background-color: #4A4A4A;
  }
`;

export const SessionList: React.FC<SessionListProps> = ({ onSelect }) => {
  const { 
    sessions, 
    currentSession, 
    switchToSession, 
    clearCurrentSession,
    refreshSessions,
    isLoadingServerSessions,
    deleteSession,
  } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDeleteSessionId, setConfirmDeleteSessionId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allSessions = Object.values(sessions).sort((a, b) => {
    const aIsNavigate = /navigate:/i.test(a.title);
    const bIsNavigate = /navigate:/i.test(b.title);

    if (aIsNavigate && !bIsNavigate) return -1;
    if (!aIsNavigate && bIsNavigate) return 1;

    const timeA = new Date(a.lastUsedAt).getTime();
    const timeB = new Date(b.lastUsedAt).getTime();
    if (timeA !== timeB) return timeB - timeA;

    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    if (createdA !== createdB) return createdB - createdA;

    return a.title.localeCompare(b.title);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDropdown = () => {
    refreshSessions();
    setIsOpen(true);
  };

  const handleManualRefresh = async () => {
    await refreshSessions();
  };

  const handleCreateNewSession = () => {
    clearCurrentSession();
    setIsOpen(false);
    onSelect?.();
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirmDeleteSessionId === sessionId) {
      deleteSession(sessionId);
      setConfirmDeleteSessionId(null);
    } else {
      setConfirmDeleteSessionId(sessionId);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    if (confirmDeleteSessionId) {
      setConfirmDeleteSessionId(null);
      return;
    }
    switchToSession(sessionId);
    setIsOpen(false);
    onSelect?.();
  };

  return (
    <>
      <style>{sessionListStyles}</style>
      <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
          bg-secondary-bg/80 dark:bg-dark-secondary-bg/80 
          text-secondary-text dark:text-dark-secondary-text
          border border-border-color/50 dark:border-dark-border-color/50
          hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg
          hover:border-border-color dark:hover:border-dark-border-color
          transition-all duration-200 hover:shadow-sm"
      >
        <MessageSquare className="w-3.5 h-3.5 opacity-60" />
        <span className="truncate max-w-[60px] sm:max-w-[160px]">
          {currentSession?.title || 'New Conversation'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-lg shadow-xl overflow-hidden z-[200]">
          <div className="flex items-center justify-between p-2 border-b border-border-color dark:border-dark-border-color">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="flex items-center gap-2 px-3 py-2 text-xs text-primary dark:text-primary-dark hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
              >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualRefresh}
                className={`p-1 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors ${isLoadingServerSessions ? 'cursor-wait' : ''}`}
                title="Refresh sessions"
                disabled={isLoadingServerSessions}
              >
                <RefreshCw className={`w-4 h-4 text-secondary-text transition-all ${isLoadingServerSessions ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-2 text-xs text-secondary-text bg-gray-50 dark:bg-gray-800">
            {allSessions.length} sessions
          </div>

          <div className="max-h-64 overflow-y-auto session-dropdown-scroll">
            {allSessions.map((session) => {
              const isNavigate = /navigate:/i.test(session.title);
              return (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className={`flex flex-col px-3 py-2 cursor-pointer hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-secondary-bg dark:bg-dark-secondary-bg'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs truncate flex-1 ${isNavigate ? 'text-primary-text dark:text-dark-primary-text' : 'text-secondary-text'}`}>
                      {session.title}
                    </span>
                    {isNavigate && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, session.id)}
                        className={`ml-2 p-0.5 rounded transition-all bg-transparent ${
                          confirmDeleteSessionId === session.id
                            ? 'text-red-600 scale-110'
                            : 'text-red-400/15 hover:text-red-500 dark:text-red-500/15 dark:hover:text-red-400'
                        }`}
                        title={confirmDeleteSessionId === session.id ? 'Click again to confirm' : 'Delete session'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {allSessions.length === 0 && (
              <div className="px-3 py-4 text-xs text-secondary-text text-center">
                No sessions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default SessionList;
