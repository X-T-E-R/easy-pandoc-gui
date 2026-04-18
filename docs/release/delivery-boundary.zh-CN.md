# 交付边界

## 当前产品状态

Easy Pandoc GUI 现在已经不是概念验证，而是一个能交付的工程仓库。

- CLI 可以做 inspect、canonicalize、export 和 regression harness。
- 桌面端可以读取真实 Markdown、显示 canonical preview、跑环境检查、导出 HTML / DOCX。
- 发布流程已经接到 GitHub tag，可以按版本自动发布安装包产物。
- 仓库里已经有标准文档、执行日志和发布说明。

## 已验证范围

- `apps/cli`
  - `inspect`
  - `transform`
  - `export`
  - `harness`
  - `doctor`
- `apps/desktop`
  - 真实 Tauri 命令层
  - React / Vite 前端
  - 可发布的 Tauri 构建链
- `packages/core`
  - format registry
  - analyze / transform / canonicalize
  - doctor / pandoc orchestration
- `packages/harness`
  - regression runner
  - diagnostics / report renderer
  - docx/xml helper

## 环境要求

- Node.js + pnpm
- Rust toolchain
- Pandoc
- 可选：`rsvg-convert`

## 当前缺口

- 缺失的旧图片源文件只能告警，不能自动补回。
- 还有一种独立 `<center>` 表题注只会告警，暂时不会完全改写。
- Release 产物默认不签名，后续如果需要正式分发，再补平台签名。

## 推荐下一轮

- 给 unresolved asset 增加交互式 remap
- 把独立 `<center>` 表题注规则彻底收口
- 增加更多桌面端真实 `invoke` 集成测试
- 按分发要求再补 code signing
