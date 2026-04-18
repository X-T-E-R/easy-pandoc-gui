# testPandoc Modern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-scope modern rebuild of testPandoc with a documented compatibility model, strong Git discipline, observability, and a harness-driven regression pipeline.

**Architecture:** Use a pnpm monorepo with `apps/desktop`, `packages/core`, and `packages/harness`. Keep all Markdown rules in one registry, run compatibility transforms and Pandoc orchestration in `core`, and verify behavior through fixture-based harness tests plus UI and integration checks.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, pnpm workspace, Vitest, Playwright, ESLint, Prettier, Husky, lint-staged, commitlint, GitHub Actions

---

### Task 1: Repository Bootstrap And Guardrails

**Files:**
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `README.md`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Write the failing repository smoke test**

```ts
import { describe, expect, test } from 'vitest'
import { existsSync } from 'node:fs'

describe('repository bootstrap', () => {
  test('has workspace metadata files', () => {
    expect(existsSync('pnpm-workspace.yaml')).toBe(true)
    expect(existsSync('tsconfig.base.json')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/repo/bootstrap.test.ts`
Expected: FAIL because workspace metadata does not exist yet

- [ ] **Step 3: Write minimal implementation**

```json
{
  "name": "testpandoc-modern",
  "private": true,
  "version": "0.1.0",
  "packageManager": "pnpm@10.17.1",
  "scripts": {
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "build": "pnpm -r build"
  }
}
```

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/repo/bootstrap.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .gitignore .editorconfig README.md package.json pnpm-workspace.yaml tsconfig.base.json tests/repo/bootstrap.test.ts
git commit -m "chore: bootstrap repository guardrails"
```

### Task 2: Documentation And Decision Records

**Files:**
- Create: `docs/superpowers/specs/2026-04-18-testpandoc-modern-design.md`
- Create: `docs/superpowers/plans/2026-04-18-testpandoc-modern.md`
- Create: `docs/adr/0001-architecture-and-stack.md`
- Create: `docs/logs/EXECUTION_LOG.md`

- [ ] **Step 1: Write the failing documentation inventory test**

```ts
import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

describe('documentation inventory', () => {
  test('documents architecture and execution discipline', () => {
    const adr = readFileSync('docs/adr/0001-architecture-and-stack.md', 'utf8')
    expect(adr).toContain('Tauri 2')
    expect(adr).toContain('harness')
    expect(adr).toContain('observability')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/docs/inventory.test.ts`
Expected: FAIL because the ADR file does not exist yet

- [ ] **Step 3: Write minimal implementation**

```md
# ADR 0001: Architecture And Stack

## Decision

Use Tauri 2, React, TypeScript, pnpm workspace, a shared core package, and a dedicated harness package.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/docs/inventory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/adr/0001-architecture-and-stack.md docs/logs/EXECUTION_LOG.md docs/superpowers/specs/2026-04-18-testpandoc-modern-design.md docs/superpowers/plans/2026-04-18-testpandoc-modern.md tests/docs/inventory.test.ts
git commit -m "docs: record architecture and execution discipline"
```

### Task 3: Standard And Compatibility Registry

**Files:**
- Create: `docs/standards/markdown-compatibility-matrix.md`
- Create: `packages/core/src/format-registry.ts`
- Create: `packages/core/src/format-registry.test.ts`
- Create: `packages/core/src/types.ts`

- [ ] **Step 1: Write the failing registry test**

```ts
import { describe, expect, test } from 'vitest'
import { formatRegistry } from './format-registry'

describe('format registry', () => {
  test('contains standard and legacy categories', () => {
    expect(formatRegistry.standard.length).toBeGreaterThan(0)
    expect(formatRegistry.legacyCompatible.length).toBeGreaterThan(0)
    expect(formatRegistry.forbidden.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/core vitest run src/format-registry.test.ts`
Expected: FAIL because `format-registry.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
export const formatRegistry = {
  standard: [{ id: 'pandoc-citation', label: 'Pandoc citation syntax' }],
  standardExtension: [{ id: 'image-attributes', label: 'Pandoc image attributes' }],
  legacyCompatible: [{ id: 'image-center-caption', label: 'Image plus center caption' }],
  forbidden: [{ id: 'absolute-personal-path', label: 'Personal absolute path' }]
} as const
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/core vitest run src/format-registry.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/standards/markdown-compatibility-matrix.md packages/core/src/format-registry.ts packages/core/src/format-registry.test.ts packages/core/src/types.ts
git commit -m "feat: add format registry baseline"
```

### Task 4: Harness Foundation

**Files:**
- Create: `packages/harness/package.json`
- Create: `packages/harness/src/index.ts`
- Create: `packages/harness/src/docx-xml.ts`
- Create: `packages/harness/src/docx-xml.test.ts`
- Create: `fixtures/legacy/.gitkeep`
- Create: `fixtures/standard/.gitkeep`

- [ ] **Step 1: Write the failing harness XML assertion test**

```ts
import { describe, expect, test } from 'vitest'
import { extractWordBody } from './docx-xml'

describe('docx xml helpers', () => {
  test('extracts document body from xml payload', () => {
    const body = extractWordBody('<w:document><w:body><w:p/></w:body></w:document>')
    expect(body).toContain('<w:p/>')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/harness vitest run src/docx-xml.test.ts`
Expected: FAIL because helper does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
export function extractWordBody(xml: string): string {
  const start = xml.indexOf('<w:body>')
  const end = xml.indexOf('</w:body>')
  if (start === -1 || end === -1) {
    throw new Error('Missing w:body node')
  }
  return xml.slice(start, end + '</w:body>'.length)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/harness vitest run src/docx-xml.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/harness fixtures/legacy fixtures/standard
git commit -m "feat: add harness foundation"
```

### Task 5: Observability Event Model

**Files:**
- Create: `packages/core/src/observability/events.ts`
- Create: `packages/core/src/observability/events.test.ts`
- Create: `docs/logs/observability-event-catalog.md`

- [ ] **Step 1: Write the failing event schema test**

```ts
import { describe, expect, test } from 'vitest'
import { eventEnvelopeSchema } from './events'

describe('event envelope schema', () => {
  test('accepts conversion events with duration', () => {
    const result = eventEnvelopeSchema.safeParse({
      eventName: 'pandoc.export.completed',
      sessionId: 'session-1',
      documentId: 'doc-1',
      phase: 'export',
      durationMs: 1200,
      status: 'success',
      metadata: {}
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/core vitest run src/observability/events.test.ts`
Expected: FAIL because schema does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
import { z } from 'zod'

export const eventEnvelopeSchema = z.object({
  eventName: z.string().min(1),
  sessionId: z.string().min(1),
  documentId: z.string().min(1),
  phase: z.string().min(1),
  durationMs: z.number().nonnegative(),
  status: z.enum(['success', 'warning', 'error']),
  metadata: z.record(z.string(), z.unknown())
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/core vitest run src/observability/events.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/observability docs/logs/observability-event-catalog.md
git commit -m "feat: add observability event model"
```

### Task 6: Compatibility Transform Pipeline

**Files:**
- Create: `packages/core/src/compat/transform.ts`
- Create: `packages/core/src/compat/transform.test.ts`
- Create: `packages/core/src/compat/rules/image-center-caption.ts`
- Create: `packages/core/src/compat/rules/math-tag.ts`
- Create: `packages/core/src/compat/rules/absolute-image-path.ts`

- [ ] **Step 1: Write the failing compatibility transform tests**

```ts
import { describe, expect, test } from 'vitest'
import { transformLegacyMarkdown } from './transform'

describe('legacy compatibility transform', () => {
  test('rewrites image plus center caption into canonical figure markdown', () => {
    const input = '![img](a.png)\n<center>图 1 示例</center>'
    const output = transformLegacyMarkdown(input)
    expect(output).toContain('![图 1 示例](a.png)')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/core vitest run src/compat/transform.test.ts`
Expected: FAIL because transform is missing

- [ ] **Step 3: Write minimal implementation**

```ts
export function transformLegacyMarkdown(input: string): string {
  return input.replace(
    /!\[(.*?)\]\((.*?)\)\s*<center>(.*?)<\/center>/gs,
    (_match, _alt, path, caption) => `![${caption.trim()}](${path.trim()})`
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/core vitest run src/compat/transform.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/compat
git commit -m "feat: add legacy compatibility transforms"
```

### Task 7: Pandoc Runner And Output Assertions

**Files:**
- Create: `packages/core/src/pandoc/runner.ts`
- Create: `packages/core/src/pandoc/runner.test.ts`
- Create: `packages/core/src/pandoc/contracts.ts`
- Create: `packages/harness/src/report.ts`

- [ ] **Step 1: Write the failing runner contract test**

```ts
import { describe, expect, test } from 'vitest'
import { buildPandocArgs } from './runner'

describe('pandoc runner contracts', () => {
  test('adds citeproc and reference doc when configured', () => {
    const args = buildPandocArgs({
      inputPath: 'input.md',
      outputPath: 'output.docx',
      referenceDocPath: 'ref.docx',
      bibliographyPath: 'refs.bib',
      mode: 'docx'
    })
    expect(args).toContain('--citeproc')
    expect(args).toContain('--reference-doc')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/core vitest run src/pandoc/runner.test.ts`
Expected: FAIL because runner does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildPandocArgs(input: {
  inputPath: string
  outputPath: string
  referenceDocPath?: string
  bibliographyPath?: string
  mode: 'docx' | 'html'
}): string[] {
  const args = [input.inputPath]
  if (input.mode === 'docx') args.push('-o', input.outputPath)
  if (input.mode === 'html') args.push('-t', 'html5', '--standalone')
  args.push('--citeproc')
  if (input.bibliographyPath) args.push('--bibliography', input.bibliographyPath)
  if (input.referenceDocPath) args.push('--reference-doc', input.referenceDocPath)
  return args
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/core vitest run src/pandoc/runner.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pandoc packages/harness/src/report.ts
git commit -m "feat: add pandoc runner contracts"
```

### Task 8: Desktop Shell And UI Foundation

**Files:**
- Create: `apps/desktop/package.json`
- Create: `apps/desktop/src/main.tsx`
- Create: `apps/desktop/src/App.tsx`
- Create: `apps/desktop/src/features/logs/LogPanel.tsx`
- Create: `apps/desktop/src/features/compat/RuleMatrixPanel.tsx`
- Create: `apps/desktop/src/features/harness/HarnessPanel.tsx`

- [ ] **Step 1: Write the failing app render test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import App from './App'

describe('desktop app shell', () => {
  test('shows rule matrix and execution log entry points', () => {
    render(<App />)
    expect(screen.getByText('规则矩阵')).toBeInTheDocument()
    expect(screen.getByText('执行日志')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @testpandoc/desktop vitest run src/App.test.tsx`
Expected: FAIL because the app shell does not exist yet

- [ ] **Step 3: Write minimal implementation**

```tsx
export default function App() {
  return (
    <main>
      <h1>testPandoc Modern</h1>
      <nav>
        <button>规则矩阵</button>
        <button>执行日志</button>
        <button>Harness</button>
      </nav>
    </main>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @testpandoc/desktop vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop
git commit -m "feat: add desktop shell foundation"
```

### Task 9: CI, Hooks, And Traceable Automation

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `commitlint.config.cjs`
- Create: `.lintstagedrc.json`

- [ ] **Step 1: Write the failing CI workflow test**

```ts
import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

describe('ci workflow', () => {
  test('runs lint typecheck test and build', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8')
    expect(workflow).toContain('pnpm lint')
    expect(workflow).toContain('pnpm typecheck')
    expect(workflow).toContain('pnpm test')
    expect(workflow).toContain('pnpm build')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/ci/workflow.test.ts`
Expected: FAIL because the workflow file does not exist yet

- [ ] **Step 3: Write minimal implementation**

```yaml
name: ci

on:
  push:
  pull_request:

jobs:
  verify:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/ci/workflow.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml .husky commitlint.config.cjs .lintstagedrc.json tests/ci/workflow.test.ts
git commit -m "chore: add ci and git hooks"
```

### Task 10: Execution Log Discipline

**Files:**
- Modify: `docs/logs/EXECUTION_LOG.md`
- Create: `docs/logs/2026-04-18-session.md`
- Create: `scripts/update-execution-log.mjs`
- Create: `tests/docs/execution-log.test.ts`

- [ ] **Step 1: Write the failing execution log test**

```ts
import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

describe('execution log discipline', () => {
  test('has sections for decisions, verification, and next actions', () => {
    const log = readFileSync('docs/logs/EXECUTION_LOG.md', 'utf8')
    expect(log).toContain('## Decisions')
    expect(log).toContain('## Verification')
    expect(log).toContain('## Next Actions')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/docs/execution-log.test.ts`
Expected: FAIL because the execution log structure is incomplete

- [ ] **Step 3: Write minimal implementation**

```md
# Execution Log

## Decisions

## Verification

## Next Actions
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/docs/execution-log.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/logs/EXECUTION_LOG.md docs/logs/2026-04-18-session.md scripts/update-execution-log.mjs tests/docs/execution-log.test.ts
git commit -m "docs: add execution log discipline"
```

## Self-Review

- Spec coverage: covers repo bootstrap, standards, registry, harness, observability, compatibility, Pandoc runner, desktop shell, CI, and execution logs.
- Placeholder scan: no `TODO`/`TBD` placeholders remain in task bodies.
- Type consistency: `formatRegistry`, `transformLegacyMarkdown`, `buildPandocArgs`, and `eventEnvelopeSchema` are used consistently across tasks.

