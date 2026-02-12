import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ModelConfig, AVAILABLE_MODELS } from '@/constants/models';

interface ModelStore {
  selectedModel: ModelConfig | null;
  setSelectedModel: (model: ModelConfig) => void;
}

export const useModelStore = create<ModelStore>()(
  persist(
    (set) => ({
      selectedModel: null,
      setSelectedModel: (model: ModelConfig) => set({ selectedModel: model }),
    }),
    {
      name: 'model-storage',
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);

// Initialize with the first model if none is selected
export const initializeModelStore = () => {
  const { selectedModel } = useModelStore.getState();
  if (!selectedModel) {
    useModelStore.setState({ selectedModel: AVAILABLE_MODELS[0] });
  }
};