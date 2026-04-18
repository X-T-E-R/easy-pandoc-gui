# Easy Pandoc GUI

[中文说明](./README.zh-CN.md) | [Release Guide](./docs/release/RELEASING.md) | [交付边界](./docs/release/delivery-boundary.zh-CN.md)

![CI](https://github.com/X-T-E-R/easy-pandoc-gui/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/X-T-E-R/easy-pandoc-gui/actions/workflows/release.yml/badge.svg)

Easy Pandoc GUI is a desktop-first Pandoc workbench for real Markdown manuscripts. It is designed for people who need more than a thin GUI wrapper: compatibility analysis, canonicalization, export diagnostics, regression harnesses, and a releaseable desktop app are all part of the same repository.

This project grew out of a larger `testPandoc` rebuild effort. The public-facing product name is now `Easy Pandoc GUI`.

## What It Does

- Inspect Markdown files and classify standard syntax, supported extensions, legacy conventions, and forbidden patterns.
- Canonicalize real-world manuscripts before export so legacy content is easier to reason about.
- Export HTML and DOCX through Pandoc from both CLI and desktop workflows.
- Surface unresolved assets, Pandoc warnings, and environment checks in one place.
- Run manifest-driven regression checks against real samples.
- Build installers from tagged releases through GitHub Actions.

## Repository Layout

- `apps/cli`: command-line entry for inspect, transform, export, harness, and doctor.
- `apps/desktop`: Tauri 2 desktop app.
- `packages/core`: shared rules, canonicalization, diagnostics, config, and Pandoc orchestration.
- `packages/harness`: regression runner, report renderer, and docx/xml helpers.
- `docs/standards`: compatibility matrix and syntax boundary docs.
- `docs/release`: release guide and delivery boundary.
- `docs/logs`: execution logs and verification records.

## Requirements

- Node.js 24
- pnpm 10
- Rust toolchain
- Pandoc
- Optional: `rsvg-convert` for better SVG to DOCX image conversion

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the CLI:

```bash
pnpm cli -- inspect --input ../test_pandoc.md --json
pnpm cli -- export --input ../test_pandoc.md --output tmp/exports/test_pandoc.docx --to docx
```

Run the desktop frontend only:

```bash
pnpm desktop:dev
```

Run the desktop app through Tauri:

```bash
pnpm desktop:tauri:dev
```

## Verification

Repository-level verification:

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

Real-sample regression:

```bash
pnpm cli -- harness --manifest fixtures/real-world/manifest.json --report-dir fixtures/real-world
pnpm cli -- doctor --json
```

## CI/CD

The repository now ships with two GitHub Actions workflows:

- `ci.yml`: lint, typecheck, test, build, Rust checks, and Windows Tauri smoke build.
- `release.yml`: on every pushed `v*.*.*` tag, build platform artifacts and publish release assets automatically.

Release notes are generated from `.github/release.yml`.

## Versioned Installer Flow

The installer workflow is tag-driven:

1. Make sure the versions in `package.json`, `apps/desktop/package.json`, and `apps/desktop/src-tauri/tauri.conf.json` match.
2. Run `pnpm version:check`.
3. Create and push a tag such as `v0.1.0`.
4. GitHub Actions builds release artifacts and publishes them to the matching GitHub Release.

Detailed instructions are in [RELEASING.md](./docs/release/RELEASING.md).

## Known Limits

- Missing source assets from legacy absolute paths can only be reported, not magically restored.
- One standalone `<center>` table-caption pattern is still classified and warned about instead of being auto-rewritten.
- Release builds are currently unsigned by default. If you need signed Windows or macOS installers, add your platform signing secrets first.
