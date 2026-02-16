import { create } from 'zustand';

type SegmentType = 'reasoning' | 'text' | 'tool-call' | 'tool-result' | 'done' | 'error' | 'timeout';

interface ContentSegment {
  id: string;
  type: SegmentType;
  content: string;
  timestamp: number;
  metadata?: {
    tool?: string;
  };
}

interface SessionInfo {
  title: string;
  prompt: string;
}

interface ModelInfo {
  providerID: string;
  modelID: string;
}

interface ResultModalState {
  isOpen: boolean;
  title: string;
  segments: ContentSegment[];
  sessionInfo: SessionInfo | null;
  modelInfo: ModelInfo | null;
  onCloseCallback: (() => void) | null;
  isStreaming: boolean;

  isPromptMode: boolean;
  promptInput: string;
  promptStreaming: boolean;
  promptError: string | null;

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void) => void;
  closeModal: () => void;
  appendSegment: (segment: ContentSegment) => void;
  clearSegments: () => void;
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
  segments: [],
  sessionInfo: null,
  modelInfo: null,
  onCloseCallback: null,
  isStreaming: false,

  isPromptMode: false,
  promptInput: '',
  promptStreaming: false,
  promptError: null,

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void) => {
    set({
      isOpen: true,
      title,
      segments: [],
      sessionInfo: sessionInfo || null,
      modelInfo: modelInfo || null,
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
      segments: [],
      sessionInfo: null,
      modelInfo: null,
      onCloseCallback: null,
      isStreaming: false,
      isPromptMode: false,
      promptInput: '',
      promptStreaming: false,
      promptError: null,
    });
    if (callback) callback();
  },

  appendSegment: (segment: ContentSegment) => {
    set((state) => {
      const newSegments = [...state.segments, segment];
      if (newSegments.length > 500) {
        newSegments.shift();
      }
      return { segments: newSegments };
    });
  },

  clearSegments: () => {
    set({ segments: [] });
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
