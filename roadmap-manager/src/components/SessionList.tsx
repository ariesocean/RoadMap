import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Trash2, Plus, RefreshCw, MessageSquare } from 'lucide-react';
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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const SessionList: React.FC<SessionListProps> = ({ onSelect }) => {
  const { 
    sessions, 
    currentSession, 
    switchToSession, 
    deleteSession, 
    createNewSession, 
    refreshSessions,
    isLocalSession,
    isLoadingServerSessions,
    serverSessions,
  } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allSessions = Object.values(sessions).sort((a, b) => {
    const timeA = new Date(a.lastUsedAt).getTime();
    const timeB = new Date(b.lastUsedAt).getTime();
    if (timeA !== timeB) return timeB - timeA;
    
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    if (createdA !== createdB) return createdB - createdA;
    
    return a.title.localeCompare(b.title);
  });

  const serverSessionsOnly = allSessions.filter(s => !isLocalSession(s.id));
  const localSessionsOnly = allSessions.filter(s => isLocalSession(s.id));
  const orderedSessions = [...serverSessionsOnly, ...localSessionsOnly];

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
    <>
      <style>{sessionListStyles}</style>
      <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleOpenDropdown}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary-bg/80 dark:hover:bg-dark-secondary-bg/80 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5 text-secondary-text/50 dark:text-dark-secondary-text/50" />
        <span className="text-xs text-secondary-text/80 dark:text-dark-secondary-text/80 truncate">
          {currentSession?.title || 'New Conversation'}
        </span>
        <ChevronDown className="w-3 h-3 text-secondary-text/50 dark:text-dark-secondary-text/50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-lg shadow-xl overflow-hidden z-[100]">
          <div className="flex items-center justify-between p-2 border-b border-border-color dark:border-dark-border-color">
            <button
              type="button"
              onClick={handleCreateNewSession}
              className="flex items-center gap-2 px-3 py-2 text-sm text-primary dark:text-primary-dark hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
            <div className="flex items-center gap-2">
              {isLoadingServerSessions ? (
                <RefreshCw className="w-4 h-4 text-secondary-text animate-spin" />
              ) : (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="p-1 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                  title="Refresh sessions"
                >
                  <RefreshCw className="w-4 h-4 text-secondary-text" />
                </button>
              )}
            </div>
          </div>

          <div className="p-2 text-xs text-secondary-text bg-gray-50 dark:bg-gray-800">
            {allSessions.length} sessions ({serverSessions.length} from server)
          </div>

          <div className="max-h-64 overflow-y-auto session-dropdown-scroll">
            {orderedSessions.map((session) => {
              const serverSession = serverSessions.find(s => s.id === session.id);
              const isFromServer = !!serverSession;
              
              return (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`flex flex-col px-3 py-2 cursor-pointer hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors ${
                    currentSession?.id === session.id
                      ? 'bg-secondary-bg dark:bg-dark-secondary-bg'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-text dark:text-dark-primary-text truncate flex-1">
                      {session.title}
                    </span>
                    {isFromServer && (
                      <span className="text-xs text-blue-500 ml-2">Server</span>
                    )}
                    {allSessions.length > 1 && isLocalSession(session.id) && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors ml-2"
                        title="Delete session"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                  </div>
                  {isFromServer && serverSession && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-secondary-text">
                      <span>{formatTime(serverSession.time?.created || 0)}</span>
                      {serverSession.summary && (
                        <>
                          <span>(+{serverSession.summary.additions}/-{serverSession.summary.deletions})</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {orderedSessions.length === 0 && (
              <div className="px-3 py-4 text-sm text-secondary-text text-center">
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
