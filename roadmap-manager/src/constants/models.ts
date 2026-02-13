export interface ModelConfig {
  providerID: string;
  modelID: string;
  displayName: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.5', displayName: 'MiniMax-M2.5' },
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.1', displayName: 'MiniMax-M2.1' },
  { providerID: 'alibaba-cn', modelID: 'qwen3-coder-flash', displayName: 'Qwen3-Coder-Flash' },
  { providerID: 'opencode', modelID: 'big-pickle', displayName: 'Big-Pickle' },
  { providerID: 'zhipuai', modelID: 'glm-4.7', displayName: 'GLM-4.7' },
];