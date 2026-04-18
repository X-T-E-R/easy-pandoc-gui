import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { canonicalizeMarkdown } from './canonicalize'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('markdown canonicalization', () => {
  test('rewrites resolvable absolute personal asset paths to project-relative paths', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-canonicalize-'))
    tempDirs.push(dir)
    const projectRoot = dir
    const documentPath = path.join(projectRoot, 'draft.md')
    const rewriteBaseDir = projectRoot
    const assetDir = path.join(projectRoot, 'assets')
    mkdirSync(assetDir, { recursive: true })
    writeFileSync(path.join(assetDir, 'figure.png'), 'binary-placeholder', 'utf8')

    const result = canonicalizeMarkdown({
      source: '![图](C:\\Users\\someone\\Obsidian\\vault\\assets\\figure.png)',
      documentPath,
      rewriteBaseDir,
      projectRoot
    })

    expect(result.markdown).toContain('![图](assets/figure.png)')
    expect(result.assetSummary.resolved).toBe(1)
    expect(result.assetSummary.unresolved).toBe(0)
  })

  test('keeps unresolved asset paths and reports warnings', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-canonicalize-'))
    tempDirs.push(dir)
    const documentPath = path.join(dir, 'draft.md')

    const result = canonicalizeMarkdown({
      source: '![图](C:\\Users\\someone\\Obsidian\\vault\\assets\\missing.png)',
      documentPath,
      rewriteBaseDir: dir,
      projectRoot: dir
    })

    expect(result.markdown).toContain('missing.png')
    expect(result.assetSummary.unresolved).toBe(1)
    expect(result.warnings[0]?.rawPath).toContain('missing.png')
  })
})
