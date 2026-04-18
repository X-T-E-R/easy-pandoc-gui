# Execution Log

## Session

- Date: 2026-04-18
- Branch: `codex/init-modern-rebuild`
- Goal: 建立新项目基线，落设计与计划文档，开始骨架实施

## Decisions

- 新项目目录放在当前工作区下的 `testpandoc-modern`
- 采用 Tauri 2 + React + TypeScript + pnpm workspace
- 从第一阶段开始引入 harness、observability、Git 和执行记录
- 标准/魔改边界先文档化，再进入 registry 和 lint

## Work Log

- 初始化独立项目目录与 Git 仓库
- 创建设计文档
- 创建实施计划
- 创建 ADR 与兼容矩阵文档
- 建立 pnpm workspace、TypeScript、Vitest、ESLint、Prettier 基线
- 以 TDD 完成 format registry、observability event schema、docx XML helper
- 以 TDD 完成首条兼容转换规则和桌面应用壳层入口
- 接入 Husky hooks、Commitlint、CI workflow、事件目录文档
- 以 TDD 完成 app config schema、Pandoc 参数编排和 harness 摘要模块
- 以 TDD 新增 CLI 模式、Markdown 扫描器和真实数据调试入口
- 基于真实数据补出 `center-caption-block` 扫描规则和 `math-tag` 自动改写
- 以 TDD 新增真实 `pandoc` 导出链路，CLI 现已支持 `inspect / transform / export`

## Verification

- `git init` 已执行
- 分支 `codex/init-modern-rebuild` 已创建
- 文档目录已创建
- `pnpm test` 通过
- `pnpm typecheck` 通过
- `pnpm lint` 通过
- `pnpm build` 通过
- 全量测试数量已扩展到 12 条，并再次通过 `test/typecheck/lint/build`
- CLI 真实数据验证：
  - `总稿_V2.1.md` 当前命中：`standard=70`、`legacy=11`、`forbidden=9`
  - `总稿_V2.1.md` transform 后命中：`legacy=1`、`forbidden=9`
  - `test_pandoc.md` 当前命中：`standardExtension=1`、`legacy=1`
  - `test_pandoc.md` transform 后命中：`legacy=0`
- CLI 导出验证：
  - `test_pandoc.md -> test_pandoc.html` 成功
  - `test_pandoc.md -> test_pandoc.docx` 成功，但 SVG 图片转换警告提示缺少 `rsvg-convert`
  - `总稿_V2.1.md -> 总稿_V2.1.html` 成功，但未提供 bibliography 时 citation 保持原样显示

## Next Actions

- 扩展 compatibility pipeline，继续覆盖旧版魔改规则
- 引入 Pandoc runner、配置 schema 和资源路径策略
- 为 harness 增加 fixtures、报告和 docx XML 断言能力
- 把桌面壳从静态入口扩展到规则矩阵、日志流和 harness 运行入口
- 开始引入真实 legacy fixtures，并把旧项目样例迁入 harness 回归
- 继续处理剩余 9 条绝对路径图片和 1 条独立中心题注块
- 引入 bibliography / reference-doc 配置落地和更完整的导出配置面板
