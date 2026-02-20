import React, { useState, useRef, useEffect } from 'react';
import { useModelStore } from '@/store/modelStore';
import { AVAILABLE_MODELS, ModelConfig } from '@/constants/models';
import { ChevronDown } from 'lucide-react';

// Provider color mapping for visual distinction
const PROVIDER_COLORS: Record<string, { dot: string, text: string }> = {
  'minimax-cn-coding-plan': { dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-300' },
  'alibaba-cn': { dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-300' },
  'opencode': { dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300' },
  'zhipuai': { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' },
  'kimi-for-coding': { dot: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-300' },
};

const getProviderColor = (providerID: string) => {
  return PROVIDER_COLORS[providerID] || { 
    dot: 'bg-gray-500', 
    text: 'text-gray-600 dark:text-gray-400' 
  };
};

// Format provider name for display
const formatProviderName = (providerID: string): string => {
  const names: Record<string, string> = {
    'minimax-cn-coding-plan': 'MiniMax',
    'alibaba-cn': 'Alibaba',
    'opencode': 'OpenCode',
    'zhipuai': 'Zhipu',
    'kimi-for-coding': 'Kimi',
  };
  return names[providerID] || providerID;
};

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentModel = selectedModel || AVAILABLE_MODELS[0];
  const colors = getProviderColor(currentModel.providerID);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (model: ModelConfig) => {
    setSelectedModel(model);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Minimal text-style button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium
          transition-all duration-200 hover:bg-secondary-bg/50 dark:hover:bg-dark-secondary-bg/50
          ${colors.text}
        `}
      >
        <span className="font-semibold">{currentModel.displayName}</span>
        <span className="opacity-60 hidden sm:inline">{formatProviderName(currentModel.providerID)}</span>
        <ChevronDown className="w-3 h-3 opacity-40" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 min-w-[220px] bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-xl shadow-2xl overflow-hidden z-[200]">
          <div className="py-2">
            <div className="px-3 py-1.5 text-[10px] font-semibold text-secondary-text/60 dark:text-dark-secondary-text/60 uppercase tracking-wider">
              Select Model
            </div>
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = currentModel.displayName === model.displayName;
              
              return (
                <button
                  key={`${model.providerID}-${model.modelID}`}
                  onClick={() => handleSelect(model)}
                  className={`
                    w-full text-left px-3 py-2.5 text-xs transition-all duration-150 flex items-center gap-2
                    ${isSelected 
                      ? 'bg-secondary-bg dark:bg-dark-secondary-bg' 
                      : 'hover:bg-secondary-bg/50 dark:hover:bg-dark-secondary-bg/50'
                    }
                  `}
                >
                  <div className="flex flex-col">
                    <span className={`font-semibold ${isSelected ? 'text-primary-text dark:text-dark-primary-text' : 'text-secondary-text dark:text-dark-secondary-text'}`}>
                      {model.displayName}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {formatProviderName(model.providerID)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};