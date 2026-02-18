import { create } from 'zustand';

export type SegmentType = 'reasoning' | 'text' | 'tool-call' | 'tool' | 'tool-result' | 'done' | 'error' | 'timeout' | 'user-prompt';

export interface ContentSegment {
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
  currentSessionId: string | null;

  isPromptMode: boolean;
  promptInput: string;
  promptStreaming: boolean;
  promptError: string | null;

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void, sessionId?: string) => void;
  closeModal: () => void;
  appendSegment: (segment: ContentSegment) => void;
  updateLastSegment: (content: string) => void;
  appendToLastSegmentOfType: (type: SegmentType, content: string) => void;
  clearSegments: () => void;
  setStreaming: (streaming: boolean) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  setPromptMode: (enabled: boolean) => void;
  setPromptInput: (input: string) => void;
  setPromptStreaming: (streaming: boolean) => void;
  setPromptError: (error: string | null) => void;
  clearPrompt: () => void;
}

export const useResultModalStore = create<ResultModalState>((set, get) => ({
  isOpen: false,
  title: '',
  segments: [],
  sessionInfo: null,
  modelInfo: null,
  onCloseCallback: null,
  isStreaming: false,
  currentSessionId: null,

  isPromptMode: false,
  promptInput: '',
  promptStreaming: false,
  promptError: null,

  openModal: (title: string, sessionInfo?: SessionInfo, modelInfo?: ModelInfo, onClose?: () => void, sessionId?: string) => {
    set({
      isOpen: true,
      title,
      segments: [],
      sessionInfo: sessionInfo || null,
      modelInfo: modelInfo || null,
      onCloseCallback: onClose || null,
      isStreaming: false,
      currentSessionId: sessionId || null,
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
      currentSessionId: null,
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

  updateLastSegment: (content: string) => {
    set((state) => {
      if (state.segments.length === 0) return state;
      const newSegments = [...state.segments];
      const lastSegment = newSegments[newSegments.length - 1];
      newSegments[newSegments.length - 1] = {
        ...lastSegment,
        content: lastSegment.content + content,
      };
      return { segments: newSegments };
    });
  },

  appendToLastSegmentOfType: (type: SegmentType, content: string) => {
    set((state) => {
      if (state.segments.length === 0) return state;
      const newSegments = [...state.segments];
      for (let i = newSegments.length - 1; i >= 0; i--) {
        if (newSegments[i].type === type) {
          newSegments[i] = {
            ...newSegments[i],
            content: newSegments[i].content + content,
          };
          return { segments: newSegments };
        }
      }
      return state;
    });
  },

  clearSegments: () => {
    set({ segments: [] });
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  setCurrentSessionId: (sessionId: string | null) => {
    set({ currentSessionId: sessionId });
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
