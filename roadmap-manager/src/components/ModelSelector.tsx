import React, { useState, useRef, useEffect } from 'react';
import { useModelStore } from '@/store/modelStore';
import { AVAILABLE_MODELS, ModelConfig } from '@/constants/models';
import { Cpu, ChevronDown } from 'lucide-react';

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useModelStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-secondary-bg/80 dark:hover:bg-dark-secondary-bg/80 transition-colors"
      >
        <Cpu className="w-3.5 h-3.5 text-secondary-text/50 dark:text-dark-secondary-text/50" />
        <span className="text-xs text-secondary-text/80 dark:text-dark-secondary-text/80 truncate">
          {selectedModel?.displayName || AVAILABLE_MODELS[0].displayName}
        </span>
        <ChevronDown className="w-3 h-3 text-secondary-text/50 dark:text-dark-secondary-text/50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-1 min-w-[160px] bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-lg shadow-xl overflow-hidden z-[100]">
          <div className="py-1">
            {AVAILABLE_MODELS.map((model) => (
              <button
                type="button"
                key={model.displayName}
                onClick={() => handleSelect(model)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  selectedModel?.displayName === model.displayName
                    ? 'bg-secondary-bg dark:bg-dark-secondary-bg text-primary-text dark:text-dark-primary-text'
                    : 'text-secondary-text dark:text-dark-secondary-text hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg'
                }`}
              >
                {model.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};