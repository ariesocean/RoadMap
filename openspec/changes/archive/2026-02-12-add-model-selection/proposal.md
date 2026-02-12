# Proposal: Add Model Selection to Roadmap Manager

## Overview

Add a model selection dropdown in the top-right corner of the Roadmap Manager UI, allowing users to choose which LLM model to use when executing prompts. The dropdown should only display the modelID portion of each model, but send the complete providerID/modelID format to the OpenCode Server HTTP API.

## Goals

- Add model selection UI component to the header
- Support four specific models with proper provider/model formatting
- Persist selected model preference
- Integrate model selection with existing prompt submission flow

## Models Supported

| Display Name | Full Provider/Model ID |
|-------------|----------------------|
| MiniMax-M2.1 | minimax-cn-coding-plan/MiniMax-M2.1 |
| Qwen3-Coder-Flash | alibaba-cn/qwen3-coder-flash |
| Big-Pickle | opencode/big-pickle |
| GLM-4.7 | zhipuai/glm-4.7 |

## Scope

### In Scope

1. Create model selection store (state management)
2. Add ModelSelector component to Header
3. Modify `taskStore.submitPrompt` to include model in API calls
4. Update Vite middleware to forward model to OpenCode Server
5. Persist selection to localStorage

### Out of Scope

- Tauri desktop mode integration (separate change)
- Custom model configuration UI
- Model availability validation

## Dependencies

- This change builds on the existing `/api/execute-navigate` endpoint
- Requires understanding of OpenCode Server HTTP API format

## Risks

- Low: Changes are localized to prompt submission flow
- Fallback: If no model is selected, continue using default behavior
