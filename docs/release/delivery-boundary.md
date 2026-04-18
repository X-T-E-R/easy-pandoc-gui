# Delivery Boundary

## Current Product State

Easy Pandoc GUI has moved beyond a proof of concept. The repository now contains a usable desktop app, a CLI, regression tooling, and release automation.

- The CLI can inspect, canonicalize, export, and run regression manifests.
- The desktop app can load real Markdown files, show canonical previews, run environment checks, and export HTML / DOCX.
- Release automation is wired to GitHub tags and can publish installer assets for supported platforms.
- The repository includes standards docs, execution logs, and release guidance.

## Verified Surface

- `apps/cli`
  - `inspect`
  - `transform`
  - `export`
  - `harness`
  - `doctor`
- `apps/desktop`
  - real Tauri command layer
  - React / Vite frontend
  - releaseable Tauri build pipeline
- `packages/core`
  - format registry
  - analyze / transform / canonicalize
  - doctor / pandoc orchestration
- `packages/harness`
  - regression runner
  - diagnostics and report rendering
  - docx/xml helpers

## Environment Requirements

- Node.js + pnpm
- Rust toolchain
- Pandoc
- Optional: `rsvg-convert`

## Known Gaps

- Missing legacy source assets can be reported, but not automatically recreated.
- One standalone `<center>` table-caption pattern is still warned about instead of being fully rewritten.
- Release assets are unsigned by default until platform signing is configured.

## Next Recommended Iteration

- Add interactive asset remapping for unresolved files.
- Normalize the standalone `<center>` table-caption pattern.
- Add more desktop-side integration coverage around real `invoke` flows.
- Add code signing when distribution requirements demand it.
