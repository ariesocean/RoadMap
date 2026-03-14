export interface ModelConfig {
  providerID: string;
  modelID: string;
  displayName: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { providerID: 'minimax-cn-coding-plan', modelID: 'MiniMax-M2.5-highspeed', displayName: 'MiniMax M2.5' },
  { providerID: 'bailian-coding-plan', modelID: 'qwen3.5-plus', displayName: 'Qwen3.5 Plus' },
  { providerID: 'openrouter', modelID: 'stepfun/step-3.5-flash:free', displayName: 'Step 3.5 Flash' },
  { providerID: 'opencode', modelID: 'big-pickle', displayName: 'Big Pickle' },
  { providerID: 'zhipuai', modelID: 'glm-4.7-flash', displayName: 'GLM 4.7 Flash' },
];