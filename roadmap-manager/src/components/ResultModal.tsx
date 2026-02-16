import React, { useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useResultModalStore } from '@/store/resultModalStore';
import { useModalPrompt } from '@/hooks/useModalPrompt';

const HIDDEN_TYPES = ['tool-call', 'step-start', 'step-end', 'message-complete'] as const;
type HiddenType = typeof HIDDEN_TYPES[number];

export const ResultModal: React.FC = () => {
  const {
    isOpen,
    title,
    segments,
    sessionInfo,
    modelInfo,
    closeModal,
    isStreaming,
    promptStreaming,
  } = useResultModalStore();
  const {
    promptInput,
    setPromptInput,
    submitPrompt,
  } = useModalPrompt();
  const preRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && preRef.current) {
      preRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments, isOpen, promptStreaming]);

  if (!isOpen) return null;

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPrompt();
    }
  }, [submitPrompt]);

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
        {sessionInfo && (
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <div>Session: {sessionInfo.title}</div>
            <div>Prompt: {sessionInfo.prompt}</div>
            {modelInfo && <div>Model: {modelInfo.providerID}/{modelInfo.modelID}</div>}
          </div>
        )}
        <div className="px-4 py-3">
          <div
            ref={preRef}
            className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded max-h-[50vh] overflow-auto"
          >
            {segments.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">
                {isProcessing ? 'Waiting for response...' : 'Task completed'}
              </span>
            ) : (
              segments.map((segment, index) => {
                if (HIDDEN_TYPES.includes(segment.type as HiddenType)) return null;
                const content = segment.content ?? '';
                const segmentKey = segment.id ?? `segment-${index}`;

                switch (segment.type) {
                  case 'reasoning':
                    return (
                      <div key={segmentKey} className="text-white italic">
                        Thinking: {content}
                      </div>
                    );
                  case 'text':
                    return (
                      <div key={segmentKey} className="text-white font-bold">
                        {content}
                      </div>
                    );
                  case 'tool-result':
                    return (
                      <div key={segmentKey} className="text-cyan-400">
                        tool {segment.metadata?.tool || 'unknown'}
                      </div>
                    );
                  case 'done':
                    return (
                      <div key={segmentKey} className="text-green-400">
                        ✅ {content || 'Completed!'}
                      </div>
                    );
                  case 'error':
                    return (
                      <div key={segmentKey} className="text-red-400">
                        ❌ {content}
                      </div>
                    );
                  case 'timeout':
                    return (
                      <div key={segmentKey} className="text-yellow-400">
                        ⏱️ {content}
                      </div>
                    );
                  default:
                    return (
                      <div key={segmentKey} className="text-gray-300">
                        {content}
                      </div>
                    );
                }
              })
            )}
          </div>
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
