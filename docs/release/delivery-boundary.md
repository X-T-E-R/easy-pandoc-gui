# Delivery Boundary

## Current Product State

`testpandoc-modern` 当前已经达到“可交付工程”的状态，而不是只剩概念验证：

- CLI 链路可直接跑真实 Markdown 样本
- harness 可批量输出 JSON / Markdown 报告
- 桌面端已升级为真实 Tauri 2 应用，可读取文件、做 inspect、生成 canonical preview、执行 doctor、导出 HTML / DOCX
- 仓库内已有 standards、compatibility matrix、execution log、delivery plan、真实样本报告

## Verified Delivery Surface

- `apps/cli`
  - `inspect`
  - `transform`
  - `export`
  - `harness`
  - `doctor`
- `apps/desktop`
  - 真实 Tauri 命令层
  - Vite 前端
  - Tauri debug build / no-bundle build
- `packages/core`
  - format registry
  - analyze / transform / canonicalize
  - doctor / pandoc runner
- `packages/harness`
  - docx XML helper
  - regression runner
  - diagnostics/report renderer

## Environment Requirements

- Node.js + pnpm
- Rust toolchain
- `pandoc`
- 可选：`rsvg-convert`

## Known Gaps

- 缺失原图的旧绝对路径无法被“自动修复”为真实存在的文件，当前行为是保留 warning。
- `总稿_V2.1.md` 中仍有 1 条独立 `<center>` 表题注只会被识别和提示，还没有自动结构化。
- 完整安装包还依赖平台打包工具链；当前轮次已经验证到 `tauri build --debug --no-bundle`，没有继续追 Windows 安装器。

## Recommended Next Iteration

- 把独立 `<center>` 表题注收成明确表格题注规则
- 对缺失资源提供交互式 remap
- 增加桌面端回归测试，覆盖真实 invoke 流
- 再补 installer / updater 线
