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
  } = useResultModalStore();

  const submitPrompt = useCallback(async () => {
    if (!promptInput.trim() || promptStreaming) return;

    setPromptInput('');
    setPromptError(null);
    setPromptStreaming(true);

    try {
      await executeModalPrompt(
        promptInput.trim(),
        (text) => {
          appendSegment(createSegment('text', text));
        },
        (_name) => {
          // tool-call - skip
        },
        (name) => {
          appendSegment(createSegment('tool-result', '', { tool: name }));
        },
        () => {
          appendSegment(createSegment('done', '✅ 完成!'));
          setPromptStreaming(false);
        },
        (error) => {
          appendSegment(createSegment('error', `错误: ${error}`));
          setPromptError(error);
          setPromptStreaming(false);
        }
      );
    } catch {
      setPromptStreaming(false);
    }
  }, [promptInput, promptStreaming, setPromptInput, setPromptError, setPromptStreaming, appendSegment]);

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
