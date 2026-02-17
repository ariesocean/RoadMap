## ADDED Requirements
### Requirement: Tauri Backend Commands
应用 MUST 提供 Tauri 命令来处理所有后端功能,确保生产构建正常工作。

#### Scenario: Read roadmap file
- **WHEN** 前端调用 `invoke('read_roadmap')`
- **THEN** 返回 roadmap.md 文件内容

#### Scenario: Write roadmap file
- **WHEN** 前端调用 `invoke('write_roadmap', { content })`
- **THEN** 将内容写入 roadmap.md 文件并返回成功状态

#### Scenario: Get sessions
- **WHEN** 前端调用 `invoke('get_sessions')`
- **THEN** 返回当前项目的会话列表

#### Scenario: Execute navigate
- **WHEN** 前端调用 `invoke('execute_navigate', { prompt, sessionId, model })`
- **THEN** 通过事件流返回执行结果

#### Scenario: Execute modal prompt
- **WHEN** 前端调用 `invoke('execute_modal_prompt', { prompt, sessionId, model })`
- **THEN** 通过事件流返回执行结果

### Requirement: Cross-Platform File Access
应用 MUST 使用 Tauri fs 插件来访问文件系统,确保跨平台兼容性。

#### Scenario: Read file in production
- **WHEN** 应用在生产环境运行
- **THEN** 能够正确读取和写入 roadmap.md 文件

### Requirement: Desktop Build Configuration
应用 MUST 配置正确的构建选项以生成桌面应用。

#### Scenario: Build for macOS
- **WHEN** 运行 `npm run tauri build`
- **THEN** 生成 macOS 桌面应用 (.app)
