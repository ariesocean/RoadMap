import { create } from 'zustand';

interface ResultModalState {
  isOpen: boolean;
  title: string;
  content: string;
  onCloseCallback: (() => void) | null;
  isStreaming: boolean;

  openModal: (title: string, content: string, onClose?: () => void) => void;
  closeModal: () => void;
  setContent: (content: string) => void;
  appendContent: (text: string) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useResultModalStore = create<ResultModalState>((set) => ({
  isOpen: false,
  title: '',
  content: '',
  onCloseCallback: null,
  isStreaming: false,

  openModal: (title: string, content: string, onClose?: () => void) => {
    set({
      isOpen: true,
      title,
      content,
      onCloseCallback: onClose || null,
      isStreaming: false,
    });
  },

  closeModal: () => {
    const callback = get().onCloseCallback;
    set({ isOpen: false, title: '', content: '', onCloseCallback: null, isStreaming: false });
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
}));

function get() {
  return useResultModalStore.getState();
}
