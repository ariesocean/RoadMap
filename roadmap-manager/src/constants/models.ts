export interface ModelConfig {
  providerID: string;
  modelID: string;
  displayName: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.5', displayName: 'MiniMax M2.5' },
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.1', displayName: 'MiniMax M2.1' },
  { providerID: 'kimi-for-coding', modelID: 'k2p5', displayName: 'K2P5' },
  { providerID: 'bailian-coding-plan', modelID: 'qwen3.5-plus', displayName: 'Qwen3.5 Plus' },
  { providerID: 'bailian-coding-plan', modelID: 'qwen3-coder-plus', displayName: 'Qwen3 Coder' },
  { providerID: 'opencode', modelID: 'big-pickle', displayName: 'Big Pickle' },
  { providerID: 'zhipuai', modelID: 'glm-4.7', displayName: 'GLM 4.7' },
];