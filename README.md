# testPandoc Modern

现代化重建版 `testPandoc`。目标不是只做一个能跑的 Markdown 转 DOCX 小工具，而是做一套可维护、可测试、可观测、可兼容旧稿件的桌面文档转换工程。

## Current Focus

- 独立 Git 仓库与工程基线
- 标准格式 / 魔改格式兼容矩阵
- 可执行计划与执行记录
- 大而全路线下的核心骨架：`core`、`desktop`、`harness`

## Repository Layout

- `apps/cli`: 真实数据调试和批处理入口
- `apps/desktop`: Tauri 2 + React 桌面应用
- `packages/core`: 配置、规则、兼容转换、Pandoc 编排
- `packages/harness`: 测试夹具、快照、docx/xml 断言、回归工具
- `docs/adr`: 决策记录
- `docs/standards`: 标准与兼容规范
- `docs/logs`: 执行日志、阶段记录、验收记录
- `docs/superpowers`: 设计与实施计划

## CLI

常用命令：

```bash
pnpm cli -- inspect --input ../总稿_V2.1.md --json
pnpm cli -- transform --input ../test_pandoc.md --output tmp/test_pandoc.transformed.md
```
