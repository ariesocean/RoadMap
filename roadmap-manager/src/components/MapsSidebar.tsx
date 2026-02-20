import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, FolderOpen, Check, Menu } from 'lucide-react';
import { useMapsStore, type MapInfo } from '@/store/mapsStore';

const mapsSidebarStyles = `
  .maps-sidebar-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .maps-sidebar-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .maps-sidebar-scroll::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 2px;
  }
  .maps-sidebar-scroll:hover::-webkit-scrollbar-thumb {
    background-color: #4A4A4A;
  }
  
  /* Responsive scaling - balanced with main content */
  .sidebar-container {
    width: clamp(140px, 18vw, 200px);
    font-size: clamp(12px, 1.4vw, 15px);
  }
  
  .sidebar-btn {
    font-size: clamp(11px, 1.3vw, 14px);
    padding: clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px);
  }
  
  .sidebar-item {
    padding: clamp(8px, 1vw, 12px) clamp(10px, 1.2vw, 14px);
  }
  
  .sidebar-icon {
    width: clamp(16px, 1.8vw, 20px);
    height: clamp(16px, 1.8vw, 20px);
  }
  
  .sidebar-toggle {
    width: clamp(32px, 3.5vw, 40px);
    height: clamp(32px, 3.5vw, 40px);
  }
`;

interface MapsSidebarProps {
  onMapSelect?: (map: MapInfo) => void;
  onCreateMap?: (name: string) => void;
  onDeleteMap?: (map: MapInfo) => void;
  onRenameMap?: (map: MapInfo, newName: string) => void;
}

export const MapsSidebar: React.FC<MapsSidebarProps> = ({
  onMapSelect,
  onCreateMap,
  onDeleteMap,
  onRenameMap,
}) => {
  const {
    availableMaps,
    currentMap,
    isSidebarCollapsed,
    toggleSidebar,
  } = useMapsStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newMapName, setNewMapName] = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  useEffect(() => {
    if (showCreateInput && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateInput]);

  const handleMapClick = (map: MapInfo) => {
    if (confirmDeleteId === map.id) {
      setConfirmDeleteId(null);
      return;
    }
    if (editingId === map.id) {
      return;
    }
    onMapSelect?.(map);
  };

  const handleDeleteClick = (e: React.MouseEvent, map: MapInfo) => {
    e.stopPropagation();
    if (confirmDeleteId === map.id) {
      onDeleteMap?.(map);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(map.id);
    }
  };

  const handleRenameClick = (e: React.MouseEvent, map: MapInfo) => {
    e.stopPropagation();
    setEditingId(map.id);
    setEditName(map.name);
  };

  const handleRenameSubmit = (map: MapInfo) => {
    if (editName.trim() && editName.trim() !== map.name) {
      onRenameMap?.(map, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  const handleRenameKeyDown = (map: MapInfo) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(map);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCreateSubmit = () => {
    if (newMapName.trim()) {
      onCreateMap?.(newMapName.trim());
      setNewMapName('');
      setShowCreateInput(false);
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      setNewMapName('');
      setShowCreateInput(false);
    }
  };

  if (isSidebarCollapsed) {
    return (
      <>
        <style>{mapsSidebarStyles}</style>
        <button
          type="button"
          onClick={toggleSidebar}
          className="sidebar-toggle flex items-center justify-center rounded-md text-[#cccccc] hover:text-white hover:bg-white/10 transition-colors"
          title="Expand sidebar"
        >
          <Menu className="w-[clamp(16px,1.8vw,20px)] h-[clamp(16px,1.8vw,20px)]" />
        </button>
      </>
    );
  }

  return (
    <>
      <style>{mapsSidebarStyles}</style>
      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="sidebar-toggle flex items-center justify-center rounded-md text-[#cccccc] hover:text-white hover:bg-white/10 transition-colors"
        title="Collapse sidebar"
      >
        <Menu className="w-[clamp(16px,1.8vw,20px)] h-[clamp(16px,1.8vw,20px)]" />
      </button>

      {/* Sidebar Panel */}
      <div
        className="sidebar-container fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-[#252526] z-30 flex flex-col"
      >
        {/* New Map Button */}
        <div className="px-[clamp(10px,1.2vw,14px)] py-[clamp(12px,1.4vw,16px)]">
          <button
            type="button"
            onClick={() => setShowCreateInput(!showCreateInput)}
            className="sidebar-btn w-full flex items-center justify-center gap-[clamp(6px,0.8vw,8px)] rounded text-[#cccccc] hover:text-white hover:bg-[#3c3c3c] transition-colors"
          >
            <Plus className="w-[clamp(16px,1.8vw,20px)] h-[clamp(16px,1.8vw,20px)]" />
            <span>New Map</span>
          </button>
        </div>

        {/* Create Input */}
        {showCreateInput && (
          <div className="px-[clamp(10px,1.2vw,14px)] pb-[clamp(10px,1.2vw,14px)]">
            <input
              ref={createInputRef}
              type="text"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={() => {
                if (!newMapName.trim()) {
                  setShowCreateInput(false);
                }
              }}
              placeholder="Map name..."
              className="w-full px-[clamp(8px,1vw,12px)] py-[clamp(6px,0.8vw,10px)] rounded bg-[#3c3c3c] text-white placeholder-[#6e6e6e] border border-[#3c3c3c] focus:border-[#0078D4] focus:outline-none"
              style={{ fontSize: 'clamp(12px, 1.3vw, 14px)' }}
            />
          </div>
        )}

        {/* Map List */}
        <div className="flex-1 overflow-y-auto maps-sidebar-scroll px-[clamp(6px,0.8vw,10px)]">
          {availableMaps.length === 0 ? (
            <div className="px-[clamp(10px,1.2vw,14px)] py-8 text-center">
              <FolderOpen className="sidebar-icon mx-auto mb-2 text-[#6e6e6e]" />
              <p className="text-[#6e6e6e]" style={{ fontSize: 'clamp(10px, 1vw, 12px)' }}>No maps found</p>
            </div>
          ) : (
            <div className="space-y-[clamp(4px,0.5vw,6px)]">
              {availableMaps.map((map) => {
                const isCurrent = currentMap?.id === map.id;
                const isEditing = editingId === map.id;
                const isConfirming = confirmDeleteId === map.id;

                return (
                  <div
                    key={map.id}
                    onClick={() => handleMapClick(map)}
                    className={`group relative flex items-center rounded-md cursor-pointer sidebar-item
                      ${isCurrent
                        ? 'bg-[#0078D4] text-white'
                        : 'text-[#cccccc] hover:bg-[#3c3c3c] hover:text-white'
                      }`}
                  >
                    {isEditing ? (
                      <div className="w-full px-[clamp(6px,0.8vw,8px)] py-[clamp(4px,0.5vw,6px)]">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={handleRenameKeyDown(map)}
                          onBlur={() => handleRenameSubmit(map)}
                          className="w-full px-[clamp(4px,0.5vw,6px)] py-[clamp(2px,0.3vw,4px)] rounded bg-[#252526] text-white border border-[#0078D4] focus:outline-none"
                          style={{ fontSize: 'clamp(10px, 1.1vw, 13px)' }}
                        />
                      </div>
                    ) : (
                      <>
                        {/* Map Name */}
                        <span className="flex-1 truncate">
                          {map.name}
                        </span>

                        {/* Action Buttons */}
                        <div className={`flex items-center gap-[clamp(4px,0.5vw,6px)] ${isConfirming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          {!isConfirming ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleRenameClick(e, map)}
                                className="p-[clamp(2px,0.3vw,4px)] rounded hover:bg-white/20 transition-colors"
                                title="Rename"
                              >
                                <Edit2 className="w-[clamp(10px,1.2vw,14px)] h-[clamp(10px,1.2vw,14px)]" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteClick(e, map)}
                                className="p-[clamp(2px,0.3vw,4px)] rounded hover:bg-white/20 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-[clamp(10px,1.2vw,14px)] h-[clamp(10px,1.2vw,14px)]" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(e, map)}
                              className="flex items-center gap-[clamp(4px,0.5vw,6px)] px-[clamp(6px,0.8vw,8px)] py-[clamp(4px,0.5vw,6px)] rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                              style={{ fontSize: 'clamp(11px, 1.3vw, 13px)' }}
                            >
                              <Check className="w-[clamp(14px,1.6vw,18px)] h-[clamp(14px,1.6vw,18px)]" />
                              Confirm
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MapsSidebar;
