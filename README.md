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
pnpm cli -- export --input ../test_pandoc.md --output tmp/exports/test_pandoc.html --to html
pnpm cli -- harness --manifest fixtures/real-world/manifest.json --json
pnpm cli -- harness --manifest fixtures/real-world/manifest.json --report-dir fixtures/real-world
pnpm cli -- doctor --json
```

## Delivery Track

- `transform` 和 `export` 现在共用 canonicalization pipeline，会先处理 legacy caption / `\tag{}`，再尝试收口本地资源路径。
- `harness` 命令支持基于 manifest 批量跑真实样本，产出 summary、warning 和导出产物。
- `harness` 现在支持 `--report-dir`，会把 JSON/Markdown 报告落到指定目录。
- Pandoc stderr 现在会被收口成结构化 diagnostics，而不是只保留整段原始文本。
- `doctor` 命令会直接检查当前机器上的 `pandoc` 和 `rsvg-convert` 可用性。
- 桌面端当前已经改成交付工作台，展示共享规则矩阵、收口阶段和 harness 摘要；真正的 Tauri 命令层和文件交互还在后续阶段。

## Real Samples

- 默认 manifest: `fixtures/real-world/manifest.json`
- 默认输出目录: `tmp/harness/`
- 当前真实报告快照:
  - `fixtures/real-world/harness-report.json`
  - `fixtures/real-world/harness-report.md`
- 当前已知阻塞：
  - `总稿_V2.1.md` 仍有多条原始绝对图片路径对应源文件缺失
  - 仍缺 `rsvg-convert`，SVG 到 DOCX 的图像转换存在环境依赖
  - 仍有 1 条独立 `<center>` 表题注未结构化收口
