## 1. 创建共享工具函数
- [ ] 1.1 创建 `src/utils/timestamp.ts` 统一时间戳生成
- [ ] 1.2 创建 `src/utils/idGenerator.ts` 统一 ID 生成
- [ ] 1.3 创建 `src/utils/sessionUtils.ts` 统一会话排序逻辑
- [ ] 1.4 创建 `src/utils/eventProcessor.ts` 统一事件处理
- [ ] 1.5 创建 `src/utils/storage.ts` 统一 localStorage 操作

## 2. 修复 dateUtils 和 markdownUtils 冗余
- [ ] 2.1 从 `src/utils/markdownUtils.ts` 删除重复的 `getCurrentISOString()`
- [ ] 2.2 从 `src/utils/markdownUtils.ts` 提取子任务生成逻辑为共享函数
- [ ] 2.3 更新 `markdownUtils.ts` 导入新工具函数

## 3. 修复 sessionStore 冗余
- [ ] 3.1 使用 `idGenerator.ts` 替代内置的 ID 生成函数
- [ ] 3.2 使用 `timestamp.ts` 替代直接的时间戳创建
- [ ] 3.3 使用 `sessionUtils.ts` 替代内置的排序逻辑
- [ ] 3.4 使用 `storage.ts` 替代 localStorage 包装函数
- [ ] 3.5 删除重复的类型定义，导入自 `@/store/types`

## 4. 修复 taskStore 冗余
- [ ] 4.1 使用 `eventProcessor.ts` 替代内置的事件处理逻辑
- [ ] 4.2 使用 `timestamp.ts` 替代直接的时间戳创建

## 5. 修复 opencodeAPI 冗余
- [ ] 5.1 移除未使用的 `_taskId` 参数
- [ ] 5.2 导入重复定义的 `ServerSession` 和 `ServerSessionTime` 类型
- [ ] 5.3 使用 `eventProcessor.ts` 替代内置的事件处理逻辑

## 6. 修复组件冗余
- [ ] 6.1 修复 `App.tsx` 中的 theme store 访问方式
- [ ] 6.2 移除 `SessionList.tsx` 中的 console.log
- [ ] 6.3 标准化组件中的导入路径

## 7. 验证和清理
- [ ] 7.1 运行 TypeScript 类型检查
- [ ] 7.2 运行项目确保功能正常
- [ ] 7.3 检查是否有遗漏的冗余代码
