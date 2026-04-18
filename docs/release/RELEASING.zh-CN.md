# 发布 Easy Pandoc GUI

## 适用范围

这份文档说明 `easy-pandoc-gui` 现在的两条打包路径：`main` 持续打 Windows 包，以及版本 tag 驱动的 GitHub Release。

## 打包模式

- `main` 分支打包：每次 push 到 `main` 都会触发 `ci.yml`，构建 Windows 桌面安装包，并上传成 workflow artifact。
- 版本发布打包：每次 push `vX.Y.Z` tag 都会触发 `release.yml`，构建配置好的平台产物，并发布到 GitHub Release。

## 发布前提

- 本地所有门禁通过。
- `package.json`、`apps/desktop/package.json`、`apps/desktop/src-tauri/tauri.conf.json` 三处版本一致。
- release tag 与版本一致，格式为 `vX.Y.Z`。

## 本地检查清单

```bash
pnpm install
pnpm version:check
pnpm test
pnpm typecheck
pnpm lint
pnpm build
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml
pnpm --filter @testpandoc/desktop tauri build --debug --no-bundle
```

## 发布步骤

1. 修改以下三个文件中的版本号：
   - `package.json`
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/tauri.conf.json`
2. 运行：

```bash
pnpm version:check
git add .
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

3. GitHub Actions 会自动触发 `.github/workflows/release.yml`。
4. workflow 会为配置好的平台构建 release 产物，并自动上传到对应 tag 的 GitHub Release。

## 获取 `main` 上最新的 Windows 安装包

1. 把代码 push 到 `main`。
2. 打开该次 `main` 上最新的 `ci` workflow run。
3. 下载上传的 `easy-pandoc-gui-windows-*` artifact。
4. artifact 里会包含解包 exe、`.msi` 和 NSIS 安装包。

## Workflow 说明

- `ci.yml` 是日常质量门禁，也会在 `main` 上上传 Windows 打包 artifact。
- `release.yml` 由 `v*.*.*` tag 触发。
- release notes 使用 `.github/release.yml` 自动生成。
- 当前 release 构建默认不签名。

## GitHub Actions 里的平台依赖

release workflow 按 Tauri 官方 GitHub pipeline 指南配置：

- Linux runner 会安装 WebKitGTK / GTK / appindicator / librsvg / patchelf 等依赖。
- macOS runner 会同时构建 Apple Silicon 和 Intel 目标。
- Windows runner 直接生成安装包产物。

如果后面要加签名，再在 workflow 里补 Windows/macOS 的签名 secrets。
