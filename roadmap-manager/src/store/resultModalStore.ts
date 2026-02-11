import { create } from 'zustand';

interface ResultModalState {
  isOpen: boolean;
  title: string;
  content: string;
  onCloseCallback: (() => void) | null;
  isStreaming: boolean;

  isPromptMode: boolean;
  promptInput: string;
  promptStreaming: boolean;
  promptError: string | null;

  openModal: (title: string, content: string, onClose?: () => void) => void;
  closeModal: () => void;
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  setStreaming: (streaming: boolean) => void;
  setPromptMode: (enabled: boolean) => void;
  setPromptInput: (input: string) => void;
  setPromptStreaming: (streaming: boolean) => void;
  setPromptError: (error: string | null) => void;
  clearPrompt: () => void;
}

export const useResultModalStore = create<ResultModalState>((set) => ({
  isOpen: false,
  title: '',
  content: '',
  onCloseCallback: null,
  isStreaming: false,

  isPromptMode: false,
  promptInput: '',
  promptStreaming: false,
  promptError: null,

  openModal: (title: string, content: string, onClose?: () => void) => {
    set({
      isOpen: true,
      title,
      content,
      onCloseCallback: onClose || null,
      isStreaming: false,
      isPromptMode: false,
      promptInput: '',
      promptStreaming: false,
      promptError: null,
    });
  },

  closeModal: () => {
    const callback = get().onCloseCallback;
    set({
      isOpen: false,
      title: '',
      content: '',
      onCloseCallback: null,
      isStreaming: false,
      isPromptMode: false,
      promptInput: '',
      promptStreaming: false,
      promptError: null,
    });
    if (callback) callback();
  },

  setContent: (content: string) => {
    set({ content });
  },

  appendContent: (text: string) => {
    set((state) => ({ content: state.content + text }));
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  setPromptMode: (enabled: boolean) => {
    set({ isPromptMode: enabled, promptError: null });
  },

  setPromptInput: (input: string) => {
    set({ promptInput: input, promptError: null });
  },

  setPromptStreaming: (streaming: boolean) => {
    set({ promptStreaming: streaming });
  },

  setPromptError: (error: string | null) => {
    set({ promptError: error });
  },

  clearPrompt: () => {
    set({ promptInput: '', promptStreaming: false, promptError: null });
  },
}));

function get() {
  return useResultModalStore.getState();
}
