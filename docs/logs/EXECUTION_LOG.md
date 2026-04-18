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
- 以 TDD 新增 canonicalization pipeline，`transform / export` 现共用 legacy rewrite 与资源路径规范化
- 新增 manifest 驱动的 harness runner，CLI 现已支持 `harness --manifest ...`
- 新增真实样本 manifest，并把桌面端从占位页升级为交付工作台
- 新增结构化 Pandoc diagnostics 解析，把 `missing-resource / math-render / generic-error` 等问题从 stderr 中收口出来
- 新增 harness 报告落盘能力，CLI 现已支持 `harness --report-dir ...`
- 桌面端现直接消费真实 `fixtures/real-world/harness-report.json`，不再只靠手写 snapshot

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
- 当前门禁验证：
  - `pnpm test` 通过，当前 12 个测试文件、22 条测试全部通过
  - `pnpm typecheck` 通过
  - `pnpm lint` 通过
  - `pnpm build` 通过
- 本轮真实样本验证：
  - `pnpm cli -- transform --input ../总稿_V2.1.md --output tmp/总稿_V2.1.canonical.md` 成功
  - `pnpm cli -- harness --manifest fixtures/real-world/manifest.json --json` 成功
  - `pnpm cli -- harness --manifest fixtures/real-world/manifest.json --report-dir fixtures/real-world` 成功
  - harness summary: `totalCases=3`、`warningCases=3`、`failedCases=0`
  - `test_pandoc.md` 经 canonicalization 后 `legacyCompatibleHits: 1 -> 0`
  - `总稿_V2.1.md` 经 canonicalization 后 `legacyCompatibleHits: 11 -> 1`，剩余 `forbiddenHits: 9`
  - 当前 unresolved asset 共 10 条，其中 9 条来自旧 Obsidian 绝对路径，1 条来自缺失的 `attachments/...jpg`
  - 已生成并更新：
    - `fixtures/real-world/harness-report.json`
    - `fixtures/real-world/harness-report.md`

## Next Actions

- 继续处理剩余 9 条缺失原图和 1 条独立中心表题注
- 把 Pandoc stderr 分类成结构化 warning，而不是只保留原始文本
- 为 harness 增加 Markdown / JSON 报告落盘和历史对比能力
- 把桌面工作台继续接到真实执行入口，而不是只展示当前状态
- 补 Tauri 命令层、环境依赖检查和打包说明
