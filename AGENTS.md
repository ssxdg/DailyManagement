# 日常管理项目开发约定

- 所有沟通和修改说明使用中文；非直观业务规则添加中文注释。
- 遵循最小改动原则，复用现有组件、数据访问和样式，不新增无关文件或依赖。
- 项目为 Expo SDK 58、React Native、TypeScript 与 Expo Router；移动端页面放在 `src/app/`，业务代码放在 `src/lib/`，共享界面放在 `src/components/`。
- 新增 Expo 原生模块时使用 `npx expo install` 安装与当前 SDK 兼容的版本；原生工程由 Expo prebuild 生成，不手改 `android/`、`ios/`。
- 支出金额以整数分保存；健康记录保留每次发生时间和时区，不限制同一天的记录次数。
- 修改后先运行 `npm test`、`npx tsc --noEmit` 和 `npm run lint`；默认不执行生产构建。
- GitHub Actions 的 Android 产物目前使用测试签名，仅供个人安装测试；正式发布前配置专用签名。iOS 真机分发需 Apple 签名。
