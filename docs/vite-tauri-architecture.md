# Vite + Tauri 架构说明

## 端口配置

### 动态端口检测

本项目采用动态端口检测机制来启动和管理 OpenCode Server。

#### 检测逻辑

1. **默认端口列表**: `[51432, 51466, 51434]`
2. **检测流程**:
   - 首先检查默认端口 51432 是否可用
   - 如果不可用，依次扫描其他常用端口
   - 找到可用端口后，自动启动 OpenCode Server
   - 如果已有服务运行，直接使用现有端口

#### 健康检查

- 使用 HTTP GET 请求到 `http://127.0.0.1:{port}/health` 进行健康状态检查
- 响应状态码为 200 时认为服务可用

### 启动命令

```bash
cd /Users/SparkingAries/VibeProjects/RoadMap
npm run opencode:server
```

或者手动启动:

```bash
OPENCODE_SERVER_PASSWORD="" opencode serve --port 51432
```
