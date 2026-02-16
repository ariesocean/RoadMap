import { useCallback } from 'react';
import { useResultModalStore, type ContentSegment } from '@/store/resultModalStore';
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
    promptInput,
    promptStreaming,
    promptError,
    isPromptMode,
    closeModal,
    currentSessionId,
    setCurrentSessionId,
  } = useResultModalStore();

  const submitPrompt = useCallback(async (sessionId?: string) => {
    if (!promptInput.trim() || promptStreaming) return;

    const input = promptInput.trim();
    setPromptInput('');
    setPromptError(null);
    setPromptStreaming(true);

    try {
      await executeModalPrompt(
        input,
        currentSessionId || sessionId,
        (text) => {
          appendSegment(createSegment('text', text));
        },
        (name) => {
          appendSegment(createSegment('tool-call', '', { tool: name }));
        },
        (name) => {
          appendSegment(createSegment('tool-result', '', { tool: name }));
        },
        () => {
          appendSegment(createSegment('done', '完成!'));
          setPromptStreaming(false);
        },
        (error) => {
          appendSegment(createSegment('error', `错误: ${error}`));
          setPromptError(error);
          setPromptStreaming(false);
        },
        (reasoning) => {
          appendSegment(createSegment('reasoning', reasoning));
        },
        (newSessionId) => {
          setCurrentSessionId(newSessionId);
        }
      );
    } catch {
      setPromptStreaming(false);
    }
  }, [promptInput, promptStreaming, setPromptInput, setPromptError, setPromptStreaming, appendSegment, currentSessionId, setCurrentSessionId]);

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
