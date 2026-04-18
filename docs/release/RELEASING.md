# Releasing Easy Pandoc GUI

## Scope

This guide describes the tag-driven release flow for `easy-pandoc-gui`.

## Release Preconditions

- All repository checks pass locally.
- `package.json`, `apps/desktop/package.json`, and `apps/desktop/src-tauri/tauri.conf.json` share the same version.
- The release tag matches that version as `vX.Y.Z`.

## Local Checklist

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

## How To Publish A Version

1. Update the version in:
   - `package.json`
   - `apps/desktop/package.json`
   - `apps/desktop/src-tauri/tauri.conf.json`
2. Run:

```bash
pnpm version:check
git add .
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

3. GitHub Actions automatically runs `.github/workflows/release.yml`.
4. The workflow builds release artifacts for the configured platforms and publishes them to the GitHub Release matching the tag.

## Workflow Notes

- `ci.yml` is the regular quality gate.
- `release.yml` is triggered by `v*.*.*` tags.
- Release notes are generated from `.github/release.yml`.
- Release builds are currently unsigned by default.

## Platform Dependencies In GitHub Actions

The release workflow follows Tauri’s official GitHub pipeline guidance:

- Linux runners install WebKitGTK / GTK / appindicator / librsvg / patchelf dependencies.
- macOS runners build both Apple Silicon and Intel targets.
- Windows runners build installer assets directly.

If you later add code signing, extend the workflow with your Windows/macOS signing secrets.
