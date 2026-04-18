# testPandoc Modern Design

## 背景

旧版 `testPandoc` 已经证明需求成立，但项目形态存在几个结构性问题：

- Python 脚本链和 Electron GUI 链并行演化，功能语义不一致。
- Markdown 兼容规则散落在正则、IPC 和 UI 提示里，没有单一事实来源。
- 当前目录不是 Git 仓库，缺少从 Day 0 开始的工程纪律。
- 产物、依赖、输入样稿和运行时代码混放，难以演进和回归验证。
- 旧稿件里有大量“可兼容但不宜继续扩散”的写法，没有正式边界。

本次重建的目标不是“再写一个更漂亮的 GUI”，而是把文档转换工程重组成一套有边界、有证据、有回归能力的产品级工程。

## 产品目标

重建一个现代化桌面应用，支持从 Markdown 到 DOCX/HTML 的可配置转换，同时满足以下目标：

- 保留并系统化兼容旧版稿件。
- 将“标准格式”和“魔改兼容”明确区分。
- 从第一天开始纳入 Git、CI、测试、执行记录和可观测性。
- 支持 harness 驱动的转换回归、规则回归和 XML 级输出断言。
- 为后续扩展 CLI、批处理和更多导出格式预留稳定核心层。

## 非目标

当前阶段不做以下内容：

- 云端同步或多人协作服务
- 在线编辑器
- 任意复杂的富文本编辑能力
- 与 Zotero/Obsidian 的深度双向集成

## 技术栈决策

### 桌面壳

采用 `Tauri 2`，原因：

- 更适合本地桌面工具的资源占用和分发模型。
- 前端可直接采用 Vite SPA，和现有 React/TypeScript 能力兼容。
- 系统能力边界更清晰，便于后续把“命令调用、文件访问、日志落地”控制在受限接口里。

### 前端

采用 `React + TypeScript + Vite`，原因：

- 旧版已有 React 代码可迁移概念和交互结构。
- 组件化适合承载规则说明、lint 结果、预览与日志面板。
- 与 Tauri 2 官方推荐的静态前端方式匹配。

### Monorepo

采用 `pnpm workspace`，拆分为：

- `apps/cli`
- `apps/desktop`
- `packages/core`
- `packages/harness`

拆分原则：

- `core` 只承载规则、schema、转换编排、日志事件协议。
- `desktop` 只承载 UI、桌面壳和受限系统接入。
- `cli` 提供真实数据调试、规则迭代和批处理入口。
- `harness` 只承载夹具、回归验证、docx/xml 断言和报告工具。

### 代码质量与工程门禁

- 包管理：`pnpm`
- 语言：`TypeScript 5.x`、`Rust`（仅壳层）
- Lint：`ESLint flat config`
- Format：`Prettier`
- 单测：`Vitest`
- 端到端：`Playwright`
- Git Hooks：`husky + lint-staged + commitlint`
- CI：`GitHub Actions`

## 架构概览

### 1. Format Registry

项目维护一份机器可读规则表，作为 Markdown 规则的单一事实来源。它定义：

- 标准语法
- Pandoc 标准扩展
- 兼容魔改
- 禁止写法
- 每条规则的 lint 行为、自动修复能力和兼容转换策略

### 2. Compatibility Pipeline

兼容层分三段：

1. 输入扫描：识别标准 / 魔改 / 禁止格式
2. 兼容改写：将旧格式转成 canonical Markdown
3. 输出编排：用 Pandoc + filters 生成 HTML/DOCX

兼容层的职责不是掩盖一切问题，而是：

- 对可兼容写法给出显式告警
- 对危险写法给出错误和修复建议
- 对不可接受写法中止转换

### 3. Pandoc Orchestration

Pandoc 调用统一由 `packages/core` 管理，输入是明确 schema，输出是结构化结果。核心职责：

- 命令拼装
- 临时文件管理
- 资源路径管理
- CSL 与参考模板管理
- HTML 预览和 DOCX 导出
- 标准输出 / 错误输出归档

### 4. Harness

`packages/harness` 负责建立真实的工程回归基线，而不是只做字符串单测。主要包括：

- legacy fixtures：旧稿件样本
- standard fixtures：标准写法样本
- golden assertions：HTML 片段、canonical Markdown、docx XML 断言
- conversion report：每次回归输出摘要、警告、失败点

### 5. Observability

项目从第一阶段就接入可观测性，不等到上线后补。范围包括：

- 结构化日志事件
- 转换阶段耗时
- 规则命中统计
- Pandoc 命令输入/输出摘要
- 错误分类与根因上下文
- harness 回归报告

## 标准格式与魔改边界

完整矩阵见 `docs/standards/markdown-compatibility-matrix.md`。这里先给边界原则：

- `标准`：直接使用 Pandoc 官方支持语法。
- `标准扩展`：Pandoc 明确支持的扩展语法，可以直接写。
- `兼容魔改`：为了兼容旧稿件而支持，但新文档不鼓励继续使用。
- `禁止`：破坏可移植性、依赖个人路径或项目外隐含环境的写法。

## 可观测性设计

每次关键操作都要发事件，至少包含：

- `eventName`
- `sessionId`
- `documentId`
- `phase`
- `durationMs`
- `status`
- `metadata`

初期事件集：

- `lint.started`
- `lint.completed`
- `compat.transform.started`
- `compat.transform.completed`
- `pandoc.preview.started`
- `pandoc.preview.completed`
- `pandoc.export.started`
- `pandoc.export.completed`
- `harness.run.started`
- `harness.run.completed`

## Harness 设计原则

- 不只验证“命令退出 0”
- 不直接把 `.docx` 当黑盒二进制比较
- 优先比较 canonical Markdown、Pandoc AST、HTML 片段和解压后的 `word/document.xml`
- 每新增一条兼容规则，都必须伴随 fixture 和 regression test

## Git 与执行记录

这个项目把执行记录视为工程资产，不视为附属材料。最低要求：

- 每个阶段有日志入口
- 每次关键决策写 ADR
- 每次较大实现批次在 `docs/logs` 留下摘要
- 每次 Git 提交只做一类变更，提交信息遵循 Conventional Commits

## 分阶段路线

### Phase 0

工程基线、Git、文档、质量门禁、记录体系。

### Phase 1

Workspace、core schema、format registry、compatibility pipeline、harness 基座。

### Phase 2

Pandoc runner、资源管理、HTML 预览、DOCX 导出。

### Phase 3

桌面 UI、任务日志、规则解释面板、设置页。

### Phase 4

回归体系完善、CI、打包、安装文档、迁移指南。

## 风险与应对

### 风险 1：旧稿件规则分散且相互冲突

应对：先用 fixtures 固化现状，再逐条收敛到 format registry。

### 风险 2：Pandoc 输出很难稳定比较

应对：在 harness 中主比 XML 关键节点和中间产物，不直接比二进制。

### 风险 3：大而全路线容易失控

应对：保留阶段拆分，但每阶段都带可验证结果、执行日志和 Git 节点。

## 验收标准

- 仓库从第一天起具备 Git、CI、lint、test、build 基线。
- 有清晰的标准/魔改兼容文档和机器规则源。
- 有 harness 驱动的回归验证链。
- 有结构化日志和转换阶段可观测性。
- 新桌面应用可完成 lint、compat transform、preview、export 主流程。
