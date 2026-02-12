import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Plus } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/store/sessionStore';
import { SessionList } from './SessionList';
import { ModelSelector } from './ModelSelector';

export const InputArea: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitPrompt, isProcessing, error } = useTaskStore();
  const { createNewSession } = useSession();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      handleSubmit(e);
    }
  };

  const handleNewSession = () => {
    createNewSession();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 transition-colors duration-300 z-40">
      <div className="max-w-[800px] mx-auto px-6 pb-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Unified Input Card */}
          <div className="bg-white dark:bg-dark-card-bg border border-border-color dark:border-dark-border-color rounded-2xl shadow-lg">
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

            {/* Toolbar */}
            <div className="px-2 py-2 border-t border-border-color/30 dark:border-dark-border-color/30 flex items-center justify-between bg-secondary-bg/20 dark:bg-dark-secondary-bg/20">
              {/* Left: Session Controls */}
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

              {/* Right: Model & Send */}
              <div className="flex items-center gap-1">
                <ModelSelector />
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  whileTap={{ scale: 0.95 }}
                  className={`ml-2 p-1.5 rounded-md transition-all flex items-center justify-center ${
                    !inputValue.trim() || isProcessing
                      ? 'bg-secondary-bg/50 text-secondary-text/30 dark:bg-dark-secondary-bg/50 dark:text-dark-secondary-text/30 cursor-not-allowed'
                      : 'bg-primary text-white hover:opacity-90 shadow-sm'
                  }`}
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-3.5 h-3.5" />
                    </motion.div>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputArea;