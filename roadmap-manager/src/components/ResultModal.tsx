import React, { useRef, useEffect } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useResultModalStore } from '@/store/resultModalStore';
import { useModalPrompt } from '@/hooks/useModalPrompt';

export const ResultModal: React.FC = () => {
  const {
    isOpen,
    title,
    content,
    closeModal,
    isStreaming,
    promptStreaming,
  } = useResultModalStore();
  const {
    promptInput,
    setPromptInput,
    submitPrompt,
  } = useModalPrompt();
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (isOpen && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [content, isOpen, promptStreaming]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  };

  const isProcessing = isStreaming || promptStreaming;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-base font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            {title || 'AI Assistant'}
            {isProcessing && (
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            )}
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3">
          <pre
            ref={preRef}
            className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-[50vh] overflow-auto"
          >
            {content || (isProcessing ? 'Waiting for response...' : 'Task completed')}
          </pre>
        </div>

        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="relative flex items-center">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue the conversation..."
              disabled={promptStreaming}
              className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              onClick={submitPrompt}
              disabled={!promptInput.trim() || promptStreaming}
              className="absolute right-1.5 p-1.5 bg-purple-600 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-all"
            >
              {promptStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
