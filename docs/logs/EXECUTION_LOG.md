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
- 新增 `doctor` 环境检查入口，CLI 现已支持 `doctor --json`
- 把 `apps/desktop` 升级成真实 `Vite + Tauri 2` 应用，新增 `src-tauri`、能力配置和桌面端构建脚本
- 新增桌面端工作台：可选择 Markdown、读取真实文件、展示 inspect/canonical 统计、跑 doctor、导出 HTML / DOCX
- 新增 Rust 命令层，负责 `load_document / export_document / run_doctor`
- 新增桌面端本地配置持久化、导出状态展示和导出文件打开入口
- 新增 Rust 单测，覆盖 legacy rewrite、diagnostics 解析和资源解析
- 对外名称统一改成 `Easy Pandoc GUI`，桌面端产品名、窗口标题、包名和版本校验入口已对齐
- 新增 `scripts/check-version-consistency.mjs`，检查 root package、desktop package 和 tauri config 三处版本一致性
- 重写 GitHub Actions：
  - `ci.yml` 增加 Ubuntu 质量门禁和 Windows Tauri smoke build
  - `release.yml` 增加按 `v*.*.*` tag 自动构建并发布安装包产物
- 新增 `.github/release.yml`，用 GitHub 自动 release notes 配置 release 分类
- 新增中英文 README、发布说明和交付边界文档
- 桌面端新增更新中心，支持手动检查更新、启动自动检查和自动下载安装切换
- 桌面端 UI 重构成侧边导航 + 主工作台 + 右侧更新中心，不再是单页卡片堆叠
- 接入 Tauri updater：Rust 命令层新增 `check_for_update / install_update`，前端新增下载进度展示
- 打包配置新增 updater public key、`latest.json` endpoint 和 Windows `passive` 安装模式
- GitHub Actions 新增 updater 签名变量透传，Windows artifact 现包含 `.sig` 和 updater JSON
- GitHub 仓库已配置 `TAURI_SIGNING_PRIVATE_KEY` 与空密码 secret，供 release / main 打包使用

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
  - `pnpm cli -- doctor --json` 成功
  - harness summary: `totalCases=3`、`warningCases=3`、`failedCases=0`
  - `test_pandoc.md` 经 canonicalization 后 `legacyCompatibleHits: 1 -> 0`
  - `总稿_V2.1.md` 经 canonicalization 后 `legacyCompatibleHits: 11 -> 1`，剩余 `forbiddenHits: 9`
  - 当前 unresolved asset 共 10 条，其中 9 条来自旧 Obsidian 绝对路径，1 条来自缺失的 `attachments/...jpg`
  - doctor summary: `pandoc=ok (3.8.3)`、`rsvg-convert=missing`
  - 已生成并更新：
    - `fixtures/real-world/harness-report.json`
    - `fixtures/real-world/harness-report.md`
- 桌面端真实化验证：
  - `pnpm vitest run apps/desktop/src/App.test.tsx` 通过
  - `pnpm --filter @testpandoc/desktop typecheck` 通过
  - `pnpm --filter @testpandoc/desktop build` 通过
  - `cargo check` 通过
  - `cargo test` 通过，当前 Rust 测试 `3/3` 通过
  - `pnpm --filter @testpandoc/desktop tauri build --debug --no-bundle` 通过
  - 产物：`apps/desktop/src-tauri/target/debug/testpandoc_desktop.exe`
  - `pnpm cli -- harness --manifest fixtures/real-world/manifest.json --report-dir fixtures/real-world` 再次通过，当前 `warningCases=3`、`failedCases=0`
  - `pnpm cli -- doctor --json` 再次通过，当前 `pandoc=ok (3.8.3)`、`rsvg-convert=missing`
  - `pnpm version:check` 通过
  - `pnpm check:format` 通过
  - 改名后 `cargo check` 通过
  - 改名后 `cargo test` 通过
  - 改名后 `pnpm --filter @testpandoc/desktop tauri build --debug --no-bundle` 通过
  - 改名后产物：`apps/desktop/src-tauri/target/debug/easy_pandoc_gui.exe`
  - 远端仓库已推送到 `https://github.com/X-T-E-R/easy-pandoc-gui`
  - Git Windows 默认 `schannel` 推送失败，已切换该仓库本地 `http.sslBackend=openssl`
  - 已补充 `ci.yml`：每次 push `main` 后自动构建 Windows 打包产物并上传 workflow artifact
  - 已保留 `release.yml`：每次 push `v*.*.*` tag 自动发布 GitHub Release 资产
  - 已修复 GitHub Actions 的 pnpm 版本冲突：去掉 workflow 里重复的 `version: 10`，统一只读 `package.json -> packageManager`
  - 已加固 Windows GitHub Actions 打包：显式安装 WiX Toolset，并为 `tauri-action` 增加一次重试
  - 已修正 `ci.yml` 中 WiX 安装步骤的 job 归属：从 Linux `quality` 挪回 Windows `windows-package`
  - `pnpm --filter @testpandoc/desktop tauri build` 通过
  - release 产物：`apps/desktop/src-tauri/target/release/bundle/msi/Easy Pandoc GUI_0.1.0_x64_en-US.msi`
  - release 产物：`apps/desktop/src-tauri/target/release/bundle/nsis/Easy Pandoc GUI_0.1.0_x64-setup.exe`
  - `pnpm --filter @testpandoc/desktop typecheck` 通过
  - `pnpm --filter @testpandoc/desktop test` 通过，当前桌面端 UI 测试 `4/4` 通过
  - `pnpm build` 通过
  - `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` 通过
  - `cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml` 通过，Rust 测试 `3/3` 通过

## Next Actions

- 继续处理剩余 9 条缺失原图和 1 条独立中心表题注
- 把 Pandoc stderr 分类成结构化 warning，而不是只保留原始文本
- 为 harness 增加 Markdown / JSON 报告落盘和历史对比能力
- 继续处理剩余 9 条缺失原图和 1 条独立中心表题注
- 用新签名配置再跑一次 Windows Tauri bundling，确认 `.sig` 和 `latest.json` 实际产出
- 把这轮 UI / updater 改动提交并推到远端，触发新的 `main` workflow 验证
