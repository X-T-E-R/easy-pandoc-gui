# Easy Pandoc GUI

[English README](./README.md) | [发布说明](./docs/release/RELEASING.zh-CN.md) | [交付边界](./docs/release/delivery-boundary.zh-CN.md)

![CI](https://github.com/X-T-E-R/easy-pandoc-gui/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/X-T-E-R/easy-pandoc-gui/actions/workflows/release.yml/badge.svg)

Easy Pandoc GUI 是一个面向真实 Markdown 稿件的 Pandoc 桌面工作台。它不是一个只包一层按钮的 GUI，而是把兼容性分析、canonicalization、导出诊断、回归 harness 和桌面交付放进了同一个仓库。

这个项目来源于 `testPandoc` 的现代化重建。现在对外发布名称统一为 `Easy Pandoc GUI`。

## 能做什么

- 扫描 Markdown，区分标准语法、支持的扩展、兼容魔改和禁止项。
- 在导出前先做 canonicalization，减少旧稿件里的历史包袱。
- 通过 CLI 和桌面端导出 HTML / DOCX。
- 把 unresolved asset、Pandoc warning 和环境检查统一展示出来。
- 基于 manifest 跑真实样本回归。
- 在 GitHub 上按版本自动生成安装包和 release 资产。

## 仓库结构

- `apps/cli`: inspect / transform / export / harness / doctor 的命令行入口
- `apps/desktop`: Tauri 2 桌面应用
- `packages/core`: 共享规则、canonicalization、诊断、配置和 Pandoc 编排
- `packages/harness`: 回归 runner、报告渲染和 docx/xml helper
- `docs/standards`: 标准与兼容矩阵
- `docs/release`: 发布流程和交付边界
- `docs/logs`: 执行日志和验证记录

## 环境要求

- Node.js 24
- pnpm 10
- Rust toolchain
- Pandoc
- 可选：`rsvg-convert`，用于更完整的 SVG -> DOCX 图片转换

## 本地开发

安装依赖：

```bash
pnpm install
```

运行 CLI：

```bash
pnpm cli -- inspect --input ../test_pandoc.md --json
pnpm cli -- export --input ../test_pandoc.md --output tmp/exports/test_pandoc.docx --to docx
```

只跑桌面前端：

```bash
pnpm desktop:dev
```

通过 Tauri 跑桌面应用：

```bash
pnpm desktop:tauri:dev
```

## 验证

仓库级门禁：

```bash
pnpm version:check
pnpm test
pnpm typecheck
pnpm lint
pnpm build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter @testpandoc/desktop tauri build --debug --no-bundle
```

真实样本回归：

```bash
pnpm cli -- harness --manifest fixtures/real-world/manifest.json --report-dir fixtures/real-world
pnpm cli -- doctor --json
```

## CI/CD

仓库现在有两条 GitHub Actions 流程：

- `ci.yml`：lint、typecheck、test、build、Rust 检查，以及 Windows 上的 Tauri smoke build
- `release.yml`：每次 push `v*.*.*` tag 时，自动构建对应平台产物并发布到 GitHub Release

自动生成的 release notes 配置在 `.github/release.yml`。

## 按版本自动出安装包

安装包流程是 tag 驱动的：

1. 保证 `package.json`、`apps/desktop/package.json`、`apps/desktop/src-tauri/tauri.conf.json` 里的版本一致。
2. 运行 `pnpm version:check`。
3. 创建并 push 例如 `v0.1.0` 这样的 tag。
4. GitHub Actions 会自动构建 release 资产并发布到对应的 GitHub Release。

更详细的流程见 [RELEASING.zh-CN.md](./docs/release/RELEASING.zh-CN.md)。

## 当前边界

- 旧稿里缺失的原始绝对路径图片只能告警，不能凭空补回。
- 还有一种独立 `<center>` 表题注只会识别和提示，暂时不会自动改写。
- Release 产物默认还是 unsigned；如果你需要签名的 Windows/macOS 安装包，需要先补平台签名配置。
