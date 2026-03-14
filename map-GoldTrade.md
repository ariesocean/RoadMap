# arbitrage_strategy development(ASD) [created: 2026-02-11 03:53]
> arbitrage_strategy development(ASD)

## Subtasks
* [ ] 根据spread_trade,scalp_trade梳理流程逻辑,生成文档
* [ ] 开发ArbitrageTrade基类
* [ ] 开发FutSpotTrade继承ArbitrageTrade, 用于期限套利
* [ ] 开发ScalpTrade继承ArbitrageTrade, 用于极限套利

**Last Updated:** 2026-02-11 03:53

---
# trade-gateway test (TGT) [created: 2026-02-11 04:06]
> trade-gateway test (TGT)

## Subtasks
* [ ] 接口下单测试
  * [ ] 市价/超价/低价下单测试
  * [ ] 建仓平仓同时进行
  * [ ] 多笔订单同时平仓
* [ ] 优化WT平台下单逻辑
  * [ ] 整理所有碰到过的失败订单信息
  * [x] login逻辑加loginstatus检查

**Last Updated:** 2026-02-11 04:06

---
# AI Agent Development [created: 2026-02-15 13:58]
> Get ready for AI Agent Build step by step

## Subtasks
* [x] Research and select web browser tool for AI agent - Answer PLAYWRIGHT
* [x] Build AI-Bridge CLI for OpenCode serve communication
  * [x] Test opencode-cli

**Last Updated:** 2026-02-15 13:58

---
# Roadmap Manager Refine [created: 2026-02-15 14:34]
> Roadmap Manager Refine

## Subtasks
* [x] taskCard功能优化
  * [x] taskCard支持手动拖动排序
  * [x] Main task description支持点击编辑
* [x] 支持手动删除子任务
  * [x] 点击输入框清空则删除整行任务
* [x] 切换方案: 通过OpenCode Serve API实现集成, 替代CLI方案
* [x] 调研 opencode serve 现有API接口
- [x] 当前有一个bug，如果在一个新的路径下没有session的情况下不点击new conversation的话会执行失败
- [ ] 部署到TradingHub (开一个新的worktrees: login-design)
  * [x] 清除绝对路径
  * [x] 添加用户验证功能
  * [x] 每个用户使用一个独立的路径，运行opencode serve以及保存maps
  - [x] 弹窗modal中的session输出信息不要有后缀
  - [x] signup的聊天框密码框有白边框，不好看，去掉，与整体风格要统一
  * [ ] 有办法检测到用户的连接状态吗？比如当用户直接关闭浏览器则默认登出
  * [ ] 准备preview和production模式
* [ ] Tool tip 组件不显示问题排查
* [ ] 开发/生产服务器路由代码统一方案

**Last Updated:** 2026-02-20 10:10

---
# 预约看办公室 [created: 2026-02-25 20:54]
> 预约看办公室

## Subtasks
- [x] 新梅联合广场（重点商圈中心位置，人流量大）
  - [x] 95㎡
  - [x] 80㎡，12000/月（含物业费）
- [x] 永华大厦（大业主直租，家具装修可灵活选配）
  - [x] 88㎡（14楼，未装修，整层未装修，空间合适，一周可装修完成，短期内不影响）
  - [x] 94㎡（狭长布局，隔断已封，布局紧凑）
- [x] 船舶大厦 @浦东大道1号楼7楼
  - [x] 62㎡（国企进驻，规范，方正，浦东大道地铁口旁，停车地铁方便）
- [x] 世贸大厦 @2026-02-27 周五
  - [x] 105㎡，15000/月（含物业费）
  - [x] 60㎡（4月可入住）
- [x] 老程免费提供的办公室 170 平米 @金桥数研基地（距离远，科研办公区域）

---
**Last Updated:** 2026-03-13 16:49
