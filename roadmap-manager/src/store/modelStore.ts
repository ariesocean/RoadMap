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

// Initialize with the first model if none is selected, or if the saved model is no longer valid
export const initializeModelStore = () => {
  const { selectedModel } = useModelStore.getState();
  const isValidModel = selectedModel && 
    AVAILABLE_MODELS.some(m => m.providerID === selectedModel.providerID && m.modelID === selectedModel.modelID);
  
  if (!selectedModel || !isValidModel) {
    useModelStore.setState({ selectedModel: AVAILABLE_MODELS[0] });
  }
};