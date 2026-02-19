import { useCallback, useRef } from 'react';
import { useResultModalStore, type ContentSegment, type FileDiff } from '@/store/resultModalStore';
import { useTaskStore } from '@/store/taskStore';
import { executeModalPrompt } from '@/services/opencodeAPI';

const createSegment = (type: ContentSegment['type'], content: string, metadata?: ContentSegment['metadata']): ContentSegment => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  timestamp: Date.now(),
  metadata,
});

export function useModalPrompt() {
  const {
    setPromptInput,
    setPromptStreaming,
    setPromptError,
    appendSegment,
    updateLastSegment,
    promptInput,
    promptStreaming,
    promptError,
    isPromptMode,
    closeModal,
    currentSessionId,
    setCurrentSessionId,
  } = useResultModalStore();

  const { refreshTasks } = useTaskStore();

  const lastSegmentTypeRef = useRef<string | null>(null);
  // Track last diff state to filter out duplicate diff events
  const lastDiffStateRef = useRef<Map<string, { additions: number; deletions: number; before?: string; after?: string }>>(new Map());

  const submitPrompt = useCallback(async (sessionId?: string) => {
    if (!promptInput.trim() || promptStreaming) return;

    const input = promptInput.trim();
    setPromptInput('');
    setPromptError(null);
    setPromptStreaming(true);
    lastSegmentTypeRef.current = null;

    appendSegment(createSegment('user-prompt', input));

    const appendOrUpdateSegment = (type: ContentSegment['type'], content: string, metadata?: ContentSegment['metadata']) => {
      if (lastSegmentTypeRef.current === type && (type === 'text' || type === 'reasoning')) {
        updateLastSegment(content);
      } else {
        lastSegmentTypeRef.current = type;
        appendSegment(createSegment(type, content, metadata));
      }
    };

    try {
      await executeModalPrompt(
        input,
        currentSessionId || sessionId,
        (text) => {
          appendOrUpdateSegment('text', text);
        },
        (name) => {
          lastSegmentTypeRef.current = 'tool-call';
          appendSegment(createSegment('tool-call', '', { tool: name }));
        },
        (name) => {
          lastSegmentTypeRef.current = 'tool-result';
          appendSegment(createSegment('tool-result', '', { tool: name }));
        },
        () => {
          lastSegmentTypeRef.current = 'done';
          appendSegment(createSegment('done', '完成!'));
          setPromptStreaming(false);
        },
        (error) => {
          lastSegmentTypeRef.current = 'error';
          appendSegment(createSegment('error', `错误: ${error}`));
          setPromptError(error);
          setPromptStreaming(false);
        },
        (reasoning) => {
          appendOrUpdateSegment('reasoning', reasoning);
        },
        (newSessionId) => {
          setCurrentSessionId(newSessionId);
        },
        async () => {
          setTimeout(async () => {
            await refreshTasks();
          }, 500);
        },
        (diffFiles) => {  // Callback for diff content - filter out already-seen changes
          // Filter to only new/changed files
          const incrementalFiles = diffFiles.filter((file: FileDiff) => {
            const filePath = file.filePath;
            const prevDiff = lastDiffStateRef.current.get(filePath);

            // If we haven't seen this file before, include it
            if (!prevDiff) return true;

            // If additions/deletions changed, this is a new change
            if (prevDiff.additions !== file.additions || prevDiff.deletions !== file.deletions) {
              return true;
            }

            // If content changed but counts are the same, still include it
            // (edge case: same line count but different content)
            if (file.before !== prevDiff.before || file.after !== prevDiff.after) {
              return true;
            }

            // No change detected, skip this file
            return false;
          });

          // Update diff state with all files
          diffFiles.forEach((file: FileDiff) => {
            lastDiffStateRef.current.set(file.filePath, {
              additions: file.additions,
              deletions: file.deletions,
              before: file.before,
              after: file.after,
            });
          });

          // Only append segment if there are incremental changes
          if (incrementalFiles.length > 0) {
            lastSegmentTypeRef.current = 'diff';
            appendSegment(createSegment('diff', 'File changes detected', { diffFiles: incrementalFiles }));
          }
        }
      );
    } catch {
      setPromptStreaming(false);
    }
  }, [promptInput, promptStreaming, setPromptInput, setPromptError, setPromptStreaming, appendSegment, currentSessionId, setCurrentSessionId, refreshTasks]);

  return {
    promptInput,
    setPromptInput,
    promptStreaming,
    promptError,
    isPromptMode,
    submitPrompt,
    closeModal,
  };
}
