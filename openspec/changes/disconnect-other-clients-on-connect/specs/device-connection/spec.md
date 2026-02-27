## ADDED Requirements

### Requirement: Device Connection Management
The system MUST automatically disconnect all previously connected clients when a new browser client connects to the Vite dev server.

#### Scenario: 新客户端连接时断开旧客户端
- **WHEN** 浏览器客户端 A 已连接到 Vite 服务器
- **AND** 浏览器客户端 B 连接到同一个 Vite 服务器
- **THEN** 客户端 A 收到断开连接通知并被断开
- **AND** 只有客户端 B 保持连接状态

#### Scenario: 多个客户端连续连接
- **WHEN** 客户端 A 连接到服务器
- **AND** 客户端 B 连接到服务器（断开 A）
- **AND** 客户端 C 连接到服务器（断开 B）
- **THEN** 只有客户端 C 保持连接状态

#### Scenario: 客户端主动断开
- **WHEN** 客户端 A 连接到服务器
- **AND** 客户端 A 刷新页面或关闭浏览器
- **AND** 客户端 B 连接到服务器
- **THEN** 客户端 B 成功连接且没有其他客户端需要断开

### Requirement: Connection Status Notification
The system MUST send a notification to disconnected clients informing them that they were disconnected due to a new device connection.

#### Scenario: 断开通知
- **WHEN** 客户端 A 已连接
- **AND** 客户端 B 连接到服务器
- **THEN** 客户端 A 收到断开连接消息
