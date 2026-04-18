# ADR 0001: Architecture And Stack

## Status

Accepted

## Context

旧版 `testPandoc` 已经具备业务价值，但缺少统一架构边界、Git 基线、标准/魔改规范和可靠回归体系。新项目需要同时解决功能重建、规则收敛、可观测性和工程纪律。

## Decision

采用以下组合：

- 桌面壳：Tauri 2
- 前端：React + TypeScript + Vite
- Monorepo：pnpm workspace
- 核心共享层：`packages/core`
- 回归与验证：`packages/harness`
- 可观测性：结构化事件 + 阶段耗时 + harness 报告

## Rationale

- Tauri 2 更适合本地桌面工具，资源开销和边界控制都优于继续堆 Electron 壳。
- React + TypeScript 能承接旧版 UI 的思路，同时更容易做规则矩阵、日志面板和 harness 入口。
- `core` 与 `desktop` 分离后，规则、Pandoc 编排和兼容逻辑不再散落在 UI 层。
- 单独的 `harness` 包可以把“可验证性”从口头承诺变成项目资产。

## Consequences

正面影响：

- 有利于测试、回归和后续扩展 CLI。
- 规则可沉淀为 registry，不再散落在正则里。
- observability 和 harness 可以从第一阶段开始落地。

代价：

- 初期项目骨架和文档量比只做 MVP 更大。
- 需要同时维护 TypeScript 和少量 Rust 壳层代码。

## Follow-Up

- 后续补充 Pandoc sidecar / 安装策略 ADR
- 后续补充 fixture 与输出比较策略 ADR

