import { useCallback, useRef } from 'react';
import { useResultModalStore, type ContentSegment } from '@/store/resultModalStore';
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
        (diffFiles) => {  // Added callback for diff content
          console.log('[useModalPrompt] onDiffContent called with:', diffFiles);
          lastSegmentTypeRef.current = 'diff';
          appendSegment(createSegment('diff', 'File changes detected', { diffFiles }));
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
