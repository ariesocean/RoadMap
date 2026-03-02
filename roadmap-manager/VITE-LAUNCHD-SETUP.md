# Vite 服务配置说明

## 概述

使用 macOS launchd 将 Vite 开发服务器配置为系统级后台服务，实现：
- 开机自动启动
- 进程崩溃自动重启
- 不受终端会话影响

## 服务文件位置

- **plist 配置**: `~/Library/LaunchAgents/com.user.roadmap-vite.plist`
- **运行日志**: `./vite.launchd.log`

## 操作命令

### 启动服务
```bash
launchctl start com.user.roadmap-vite
```

### 停止服务
```bash
launchctl stop com.user.roadmap-vite
```

### 查看运行状态
```bash
launchctl list | grep roadmap
```

### 查看日志
```bash
tail -f /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager/vite.launchd.log
```

### 重新加载配置
```bash
launchctl unload ~/Library/LaunchAgents/com.user.roadmap-vite.plist
launchctl load ~/Library/LaunchAgents/com.user.roadmap-vite.plist
```

## 影响说明

### 正面影响
- 电脑重启后自动启动 Vite 服务
- 进程意外崩溃会自动重启
- 不依赖终端窗口

### 注意事项
- `launchctl stop` 手动停止后**不会**自动重启，需手动执行 `start`
- 只有进程崩溃（异常退出）才会触发 `KeepAlive` 重启
- 日志默认追加，可能需要定期清理

### 启动失败的影响
- 如果 Vite 启动后立即报错退出，`KeepAlive` 会反复尝试重启
- macOS 会在约 10 次失败后放弃（ThrottleRestart）
- 频繁重启会占用系统资源，日志文件会快速膨胀
- 如遇启动失败，建议先手动排查问题再启动服务

### 启动失败限制（已配置）
当前 plist 已配置以下限制，防止无限重启：
- **StartInterval**: 30 秒（每次重启间隔）
- **StartLimitInterval**: 300 秒（5 分钟内）
- **StartLimitCount**: 5 次（最多尝试 5 次）

超过限制后服务会进入"放弃"状态，需要手动重启：
```bash
launchctl start com.user.roadmap-vite
```

## 故障排查

### 查看详细日志
```bash
cat /Users/SparkingAries/VibeProjects/RoadMap/roadmap-manager/vite.launchd.log
```

### 检查端口占用
```bash
lsof -i :1430
```

### 检查服务是否在运行
```bash
ps aux | grep vite | grep -v grep
```

## 卸载服务

如果需要完全移除该服务：

```bash
launchctl stop com.user.roadmap-vite
launchctl unload ~/Library/LaunchAgents/com.user.roadmap-vite.plist
rm ~/Library/LaunchAgents/com.user.roadmap-vite.plist
```
