import { useCallback } from 'react';
import { useResultModalStore } from '@/store/resultModalStore';
import { executeModalPrompt } from '@/services/opencodeAPI';

export function useModalPrompt() {
  const {
    setPromptInput,
    setPromptStreaming,
    setPromptError,
    appendContent,
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
          appendContent(text);
        },
        (name) => {
          appendContent(`\n🔧 使用工具: ${name}\n`);
        },
        (name) => {
          appendContent(`✓ ${name} 完成\n`);
        },
        () => {
          appendContent('\n✅ 完成!\n');
          setPromptStreaming(false);
        },
        (error) => {
          appendContent(`\n\n❌ 错误: ${error}`);
          setPromptError(error);
          setPromptStreaming(false);
        }
      );
    } catch {
      setPromptStreaming(false);
    }
  }, [promptInput, promptStreaming, setPromptInput, setPromptError, setPromptStreaming, appendContent]);

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
