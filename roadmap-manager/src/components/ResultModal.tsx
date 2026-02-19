import React, { useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useResultModalStore } from '@/store/resultModalStore';
import { useModalPrompt } from '@/hooks/useModalPrompt';

// Simple diff utility to compare two arrays of lines
// Shows only changed lines with context (like git diff)
function computeDiff(before: string[], after: string[]): { type: 'unchanged' | 'added' | 'removed'; content: string; lineNum?: number }[] {
  const result: { type: 'unchanged' | 'added' | 'removed'; content: string; lineNum?: number }[] = [];

  // Use a simple LCS-based diff algorithm
  // Find the longest common subsequence
  const lcs = computeLCS(before, after);

  let beforeIdx = 0;
  let afterIdx = 0;
  let lcsIdx = 0;

  // Keep track of line numbers for context
  let beforeLineNum = 1;
  let afterLineNum = 1;

  while (beforeIdx < before.length || afterIdx < after.length) {
    if (lcsIdx < lcs.length && beforeIdx < before.length && before[beforeIdx] === lcs[lcsIdx] && afterIdx < after.length && after[afterIdx] === lcs[lcsIdx]) {
      // Line is the same in both - unchanged
      result.push({ type: 'unchanged', content: before[beforeIdx], lineNum: beforeLineNum });
      beforeIdx++;
      afterIdx++;
      lcsIdx++;
      beforeLineNum++;
      afterLineNum++;
    } else if (beforeIdx < before.length && (lcsIdx >= lcs.length || before[beforeIdx] !== lcs[lcsIdx])) {
      // Line was removed
      result.push({ type: 'removed', content: before[beforeIdx], lineNum: beforeLineNum });
      beforeIdx++;
      beforeLineNum++;
    } else if (afterIdx < after.length && (lcsIdx >= lcs.length || after[afterIdx] !== lcs[lcsIdx])) {
      // Line was added
      result.push({ type: 'added', content: after[afterIdx], lineNum: afterLineNum });
      afterIdx++;
      afterLineNum++;
    }
  }

  // If result is too long, trim to show only changed parts with context
  // Find first and last changed line indices
  let firstChangeIdx = -1;
  let lastChangeIdx = -1;

  for (let i = 0; i < result.length; i++) {
    if (result[i].type !== 'unchanged') {
      if (firstChangeIdx === -1) firstChangeIdx = i;
      lastChangeIdx = i;
    }
  }

  if (firstChangeIdx !== -1 && lastChangeIdx !== -1) {
    // Show context: 3 lines before and after the changed section
    const contextLines = 3;
    const startIdx = Math.max(0, firstChangeIdx - contextLines);
    const endIdx = Math.min(result.length - 1, lastChangeIdx + contextLines);

    const trimmedResult = result.slice(startIdx, endIdx + 1);

    // Add markers if we trimmed
    if (startIdx > 0) {
      trimmedResult.unshift({ type: 'unchanged', content: '...', lineNum: -1 });
    }
    if (endIdx < result.length - 1) {
      trimmedResult.push({ type: 'unchanged', content: '...', lineNum: -1 });
    }

    return trimmedResult;
  }

  return result;
}

// Compute Longest Common Subsequence
function computeLCS(before: string[], after: string[]): string[] {
  let m = before.length;
  let n = after.length;

  // If files are too large, use a simpler approach
  if (m > 1000 || n > 1000) {
    // Just find common lines at the start and end
    const common: string[] = [];
    let i = 0;
    let j = 0;

    // Find common prefix
    while (i < m && j < n && before[i] === after[j]) {
      common.push(before[i]);
      i++;
      j++;
    }

    // Find common suffix
    const commonSuffix: string[] = [];
    while (i < m && j < n && before[m - 1] === after[n - 1]) {
      commonSuffix.unshift(before[m - 1]);
      m--;
      n--;
    }

    return [...common, ...commonSuffix];
  }

  // Standard LCS DP algorithm
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (before[i - 1] === after[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (before[i - 1] === after[j - 1]) {
      lcs.unshift(before[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

// DiffView component to display unified diff format
const DiffView: React.FC<{ before: string[]; after: string[] }> = ({ before, after }) => {
  const diff = computeDiff(before, after);

  return (
    <div className="space-y-0.5 font-mono text-xs">
      {diff.map((line, idx) => (
        <div
          key={idx}
          className={`px-2 py-0.5 flex ${
            line.type === 'added'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : line.type === 'removed'
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
              : line.content === '...'
              ? 'text-gray-400 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <span className="select-none opacity-50 w-5 mr-2 text-right">
            {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
          </span>
          <span className="flex-1 whitespace-pre-wrap break-all">{line.content}</span>
        </div>
      ))}
    </div>
  );
};

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
                    ) : segment.type === 'user-prompt' ? (
                      <div className="text-cyan-600 dark:text-cyan-400 font-medium">
                        {content}
                      </div>
                    ) : segment.type === 'done' ? (
                      <div className="text-gray-600 dark:text-gray-400">
                        {content || 'Completed!'}
                      </div>
                    ) : segment.type === 'error' ? (
                      <div className="text-red-600 dark:text-red-400">
                        {content}
                      </div>
                    ) : segment.type === 'diff' ? (
                      <div className="mt-2 space-y-3">
                        <div className="font-medium text-green-600 dark:text-green-400 mb-2">File Changes:</div>
                        {segment.metadata?.diffFiles && Array.isArray(segment.metadata.diffFiles) &&
                          segment.metadata.diffFiles.map((file: any, idx: number) => {
                            // Generate unified diff from before/after content
                            const beforeLines = (file.before || '').split('\n');
                            const afterLines = (file.after || '').split('\n');

                            return (
                              <div key={`${segment.id}-diff-${idx}`} className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                                {/* File header */}
                                <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{file.filePath}</span>
                                    {file.status && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        {file.status}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-600 dark:text-green-400">+{file.additions}</span>
                                    <span className="text-red-600 dark:text-red-400">-{file.deletions}</span>
                                  </div>
                                </div>
                                {/* Diff content */}
                                <div className="max-h-60 overflow-auto bg-white dark:bg-gray-900 p-2 font-mono text-xs">
                                  {file.before !== undefined || file.after !== undefined ? (
                                    <DiffView before={beforeLines} after={afterLines} />
                                  ) : (
                                    <div className="text-gray-500 dark:text-gray-400">No diff available</div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        }
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
