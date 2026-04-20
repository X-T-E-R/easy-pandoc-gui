# Releasing Easy Pandoc GUI

## Scope

This guide describes both packaging paths for `easy-pandoc-gui`: continuous Windows packaging on `main`, and tag-driven GitHub Releases.

## Packaging Modes

- `main` branch packaging: every push to `main` runs `ci.yml`, builds the Windows desktop bundles, and uploads them as workflow artifacts.
- Versioned release packaging: every pushed `vX.Y.Z` tag runs `release.yml`, builds the configured platform assets, updater metadata, and publishes them to GitHub Release.

## Release Preconditions

- All repository checks pass locally.
- `package.json`, `apps/desktop/package.json`, and `apps/desktop/src-tauri/tauri.conf.json` share the same version.
- The release tag matches that version as `vX.Y.Z`.
- `TAURI_SIGNING_PRIVATE_KEY` (and optional `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) must exist in GitHub Actions secrets for updater-ready bundles.

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
5. The workflow also uploads updater metadata such as `latest.json` and signed installer bundles so in-app updates can work.

## Get The Latest Windows Package From `main`

1. Push your changes into `main`.
2. Open the latest `ci` workflow run for `main`.
3. Download the uploaded `easy-pandoc-gui-windows-*` artifact.
4. The artifact contains the unpacked desktop executable, the generated `.msi` / NSIS installer, their signatures, and updater metadata when available.

## Workflow Notes

- `ci.yml` is the regular quality gate and also uploads Windows packaging artifacts on `main`.
- `release.yml` is triggered by `v*.*.*` tags.
- Release notes are generated from `.github/release.yml`.
- The updater public key lives in `apps/desktop/src-tauri/tauri.conf.json`; the private key must stay in GitHub secrets and secure local storage only.

## Platform Dependencies In GitHub Actions

The release workflow follows Tauri’s official GitHub pipeline guidance:

- Linux runners install WebKitGTK / GTK / appindicator / librsvg / patchelf dependencies.
- macOS runners build both Apple Silicon and Intel targets.
- Windows runners build installer assets directly.

If you later add code signing, extend the workflow with your Windows/macOS signing secrets.
