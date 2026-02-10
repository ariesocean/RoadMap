import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { useTaskStore } from '@/store/taskStore';

export const InputArea: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { submitPrompt, isProcessing, error } = useTaskStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    await submitPrompt(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-color shadow-input">
      <div className="max-w-[800px] mx-auto px-6 py-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="➕ Enter a prompt to create or update tasks..."
            disabled={isProcessing}
            className="w-full pr-12 pl-4 py-3 bg-secondary-bg border border-border-color rounded-lg text-primary-text placeholder:text-placeholder-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-60"
          />

          <motion.button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            whileTap={{ scale: 0.95 }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
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

        <p className="mt-2 text-xs text-secondary-text text-center">
          Press Enter to submit, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};