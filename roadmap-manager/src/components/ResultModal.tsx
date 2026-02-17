import React, { useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useResultModalStore } from '@/store/resultModalStore';
import { useModalPrompt } from '@/hooks/useModalPrompt';

const HIDDEN_TYPES = ['step-start', 'step-end', 'message-complete'] as const;
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitPrompt(undefined);
    }
  }, [submitPrompt]);

  if (!isOpen) return null;

  const isProcessing = isStreaming || promptStreaming;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
            <span className="truncate max-w-[150px] sm:max-w-none">{title || 'AI Assistant'}</span>
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
        <div className="px-3 sm:px-4 py-2 sm:py-4">
          <div
            ref={preRef}
            className="text-[11px] sm:text-[13px] whitespace-pre-wrap break-all font-mono bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 rounded max-h-[40vh] sm:max-h-[50vh] overflow-auto scrollbar-thin"
          >
            {sessionInfo && (
              <div className="mb-2 sm:mb-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Session: </span>
                  <span className="text-gray-700 dark:text-gray-300">{sessionInfo.title}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Prompt: </span>
                  <span className="text-gray-700 dark:text-gray-300">{sessionInfo.prompt}</span>
                </div>
                {modelInfo && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Model: </span>
                    <span className="text-gray-700 dark:text-gray-300">{modelInfo.providerID}/{modelInfo.modelID}</span>
                  </div>
                )}
              </div>
            )}
            {segments.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-400">
                {isProcessing ? 'Waiting for response...' : 'Task completed'}
              </span>
            ) : (
              segments.map((segment, index) => {
                if (HIDDEN_TYPES.includes(segment.type as HiddenType)) return null;
                const content = segment.content ?? '';
                const segmentKey = segment.id ?? `segment-${index}`;
                const isReasoning = segment.type === 'reasoning';

                return (
                  <React.Fragment key={segmentKey}>
                    {isReasoning ? (
                      <div className="opacity-60">
                        <span className="text-purple-600 dark:text-purple-400">Thinking: </span>
                        <span className="text-gray-500 dark:text-gray-400">{content}</span>
                      </div>
                    ) : segment.type === 'text' ? (
                      <div className="text-gray-800 dark:text-gray-200">
                        {content}
                      </div>
                    ) : segment.type === 'tool' || segment.type === 'tool-call' || segment.type === 'tool-result' ? (
                      <div className="text-cyan-500 dark:text-cyan-300 opacity-80">
                        tool {segment.metadata?.tool || segment.content || 'unknown'}
                      </div>
                    ) : segment.type === 'done' ? (
                      <div className="text-gray-600 dark:text-gray-400">
                        {content || 'Completed!'}
                      </div>
                    ) : segment.type === 'error' ? (
                      <div className="text-red-600 dark:text-red-400">
                        {content}
                      </div>
                    ) : segment.type === 'timeout' ? (
                      <div className="text-yellow-600 dark:text-yellow-400">
                        {content}
                      </div>
                    ) : (
                      <div className="text-gray-700 dark:text-gray-300">
                        {content}
                      </div>
                    )}
                    {isReasoning && <div className="my-2" />}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>

        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div className="relative flex items-center">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Continue..."
              disabled={promptStreaming}
              className="w-full pl-2.5 sm:pl-3 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-60"
            />
            <button
              onClick={() => submitPrompt(undefined)}
              disabled={!promptInput.trim() || promptStreaming}
              className="absolute right-1 sm:right-1.5 p-1 sm:p-1.5 bg-purple-600 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-all"
            >
              {promptStreaming ? (
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
