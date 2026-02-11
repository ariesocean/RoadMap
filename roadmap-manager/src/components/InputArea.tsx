import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Plus, MessageSquare } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';
import { useSession } from '@/hooks/useSession';

export const InputArea: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { submitPrompt, isProcessing, error } = useTaskStore();
  const { currentSession, addMessage, updateSessionTitle, createNewSession } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const prompt = inputValue.trim();

    if (currentSession) {
      addMessage(currentSession.id, 'user', prompt);

      if (currentSession.title === 'New Conversation') {
        const title = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt;
        updateSessionTitle(currentSession.id, title);
      }
    }

    await submitPrompt(prompt);
    setInputValue('');
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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card-bg border-t dark:border-dark-border-color shadow-input transition-colors duration-300">
      <div className="max-w-[800px] mx-auto px-6 py-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="flex items-center gap-2 mb-3">
          {currentSession ? (
            <>
              <MessageSquare className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text" />
              <span className="text-xs text-secondary-text dark:text-dark-secondary-text truncate max-w-[180px]">
                {currentSession.title}
              </span>
              <button
                onClick={handleNewSession}
                className="p-0.5 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                title="New conversation"
              >
                <Plus className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text" />
              </button>
            </>
          ) : (
            <>
              <MessageSquare className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text" />
              <span className="text-xs text-secondary-text dark:text-dark-secondary-text">
                New Conversation
              </span>
              <button
                onClick={handleNewSession}
                className="p-0.5 rounded hover:bg-secondary-bg dark:hover:bg-dark-secondary-bg transition-colors"
                title="New conversation"
              >
                <Plus className="w-3 h-3 text-secondary-text dark:text-dark-secondary-text" />
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a prompt to create or update tasks..."
            disabled={isProcessing}
            className="w-full pl-4 pr-12 py-3 bg-secondary-bg dark:bg-dark-secondary-bg border border-border-color dark:border-dark-border-color rounded-lg text-primary-text dark:text-dark-primary-text placeholder:text-placeholder-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
          />

          <motion.button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 p-2 bg-primary text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            {isProcessing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};