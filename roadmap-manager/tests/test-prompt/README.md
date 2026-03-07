# test-prompt 测试

## 测试文件
[test-prompt.mjs](./test-prompt.mjs)

## 测试场景
OpenCode SDK 通信测试脚本，用于验证：
- 与 OpenCode Server 的连接
- MCP 工具调用
- 消息发送与接收

## 上下文需求
- **依赖**: Node.js, OpenCode SDK
- **前置条件**: OpenCode Server 运行
- **环境变量**: 无特殊要求

## 覆盖功能
- ✓ SDK 初始化
- ✓ 工具列表获取
- ✓ 提示发送
- ✓ 响应解析

## 运行方式
```bash
# 运行测试
node tests/test-prompt/test-prompt.mjs
```
