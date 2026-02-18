import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/store/sessionStore';
import { SessionList } from './SessionList';
import { ModelSelector } from './ModelSelector';

export const InputArea: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitPrompt, isProcessing, error } = useTaskStore();
  const { clearCurrentSession } = useSession();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!inputValue.trim() || isProcessing) return;

    const prompt = inputValue.trim();

    const { currentSession, addMessage } = useSessionStore.getState();
    if (currentSession) {
      addMessage(currentSession.id, 'user', prompt);
    }

    await submitPrompt(prompt);
    setInputValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleNewSession = () => {
    clearCurrentSession();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 transition-colors duration-300 z-40">
      <div className="max-w-[800px] mx-auto px-2 sm:px-6 pb-3 sm:pb-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Main content card */}
          <form onSubmit={handleSubmit} className="relative bg-white dark:bg-dark-card-bg rounded-2xl shadow-lg border border-border-color dark:border-dark-border-color">
            {/* Textarea Area */}
            <div className="px-4 pt-3 pb-2">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a prompt to create or update tasks..."
                disabled={isProcessing}
                rows={1}
                className="w-full resize-none bg-transparent text-primary-text dark:text-dark-primary-text placeholder:text-placeholder-text/60 focus:outline-none text-sm leading-relaxed disabled:opacity-60"
                style={{ minHeight: '24px', maxHeight: '200px' }}
              />
            </div>

            {/* Toolbar with animated gradient separator */}
            <div className="relative">
              {/* Animated gradient line in the middle */}
              <div className="absolute left-0 right-0 top-0 h-px overflow-hidden">
                <div className={`w-full h-full ${isProcessing ? 'gradient-line-animation' : ''}`} />
              </div>
              
              {/* Toolbar content */}
              <div className="px-3 py-2 flex items-center justify-between bg-secondary-bg/30 dark:bg-dark-secondary-bg/30 rounded-b-2xl relative z-10">
                {/* Left: Model Selector */}
                <div className="flex items-center gap-2">
                  <ModelSelector />
                </div>

                {/* Right: Session Controls */}
                <div className="flex items-center gap-1">
                  <SessionList />
                  <button
                    onClick={handleNewSession}
                    className="p-1.5 rounded-md hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                    title="New conversation"
                    type="button"
                  >
                    <Plus className="w-3.5 h-3.5 text-secondary-text/50 dark:text-dark-secondary-text/50" />
                  </button>
                </div>
              </div>
            </div>
          </form>
      </div>
    </div>
  );
};

export default InputArea;