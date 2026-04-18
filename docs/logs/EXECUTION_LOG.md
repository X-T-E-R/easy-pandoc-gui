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

## Verification

- `git init` 已执行
- 分支 `codex/init-modern-rebuild` 已创建
- 文档目录已创建
- `pnpm test` 通过
- `pnpm typecheck` 通过
- `pnpm lint` 通过
- `pnpm build` 通过
- 全量测试数量已扩展到 8 条，并再次通过 `test/typecheck/lint/build`

## Next Actions

- 扩展 compatibility pipeline，继续覆盖旧版魔改规则
- 引入 Pandoc runner、配置 schema 和资源路径策略
- 为 harness 增加 fixtures、报告和 docx XML 断言能力
- 把桌面壳从静态入口扩展到规则矩阵、日志流和 harness 运行入口
- 开始引入真实 legacy fixtures，并把旧项目样例迁入 harness 回归
