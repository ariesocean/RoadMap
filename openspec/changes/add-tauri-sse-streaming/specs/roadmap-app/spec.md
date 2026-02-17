## MODIFIED Requirements
### Requirement: Tauri Backend Commands
应用 MUST 提供 Tauri 命令来处理所有后端功能,确保生产构建正常工作。

#### Scenario: Execute navigate with SSE streaming
- **WHEN** 前端调用 `invoke('execute_navigate', { prompt, sessionId, model })`
- **THEN** 命令通过 SSE 流式返回: text, tool, tool-result, reasoning, done 等事件类型
- **AND** 事件去重机制确保相同事件不被重复处理

#### Scenario: Execute modal prompt with SSE streaming
- **WHEN** 前端调用 `invoke('execute_modal_prompt', { prompt, sessionId, model })`
- **THEN** 命令通过 SSE 流式返回执行结果
- **AND** 支持 modal-prompt 会话隔离
