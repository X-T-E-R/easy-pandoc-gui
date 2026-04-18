import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import {
  createHarnessRunSummary,
  parsePandocDiagnostics,
  writeHarnessArtifacts
} from './report'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('harness report', () => {
  test('computes pass rate and summary status', () => {
    const result = createHarnessRunSummary({
      passed: 8,
      failed: 2,
      warnings: 1
    })

    expect(result.passRate).toBe(80)
    expect(result.status).toBe('warning')
  })

  test('classifies pandoc warnings into structured diagnostics', () => {
    const diagnostics = parsePandocDiagnostics(
      '[WARNING] Could not fetch resource attachments/a.png: replacing image with description\n' +
        '[WARNING] Could not convert TeX math x^2, rendering as TeX\n'
    )

    expect(diagnostics).toHaveLength(2)
    expect(diagnostics[0]?.code).toBe('missing-resource')
    expect(diagnostics[1]?.code).toBe('math-render')
  })

  test('writes json and markdown harness artifacts', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-artifacts-'))
    tempDirs.push(dir)

    const artifacts = await writeHarnessArtifacts(
      {
        summary: {
          totalCases: 1,
          passedCases: 0,
          warningCases: 1,
          failedCases: 0,
          passRate: 0,
          status: 'warning'
        },
        cases: [
          {
            id: 'master-draft-docx',
            status: 'warning',
            outputPath: path.join(dir, 'master.docx'),
            before: { legacyCompatibleHits: 11, forbiddenHits: 9 },
            after: { legacyCompatibleHits: 1, forbiddenHits: 9 },
            warnings: [{ rawPath: 'attachments/missing.jpg' }],
            diagnostics: [
              {
                code: 'missing-resource',
                severity: 'warning',
                message: 'Could not fetch resource attachments/missing.jpg'
              }
            ]
          }
        ]
      },
      {
        outputDir: dir,
        baseName: 'latest-report'
      }
    )

    expect(readFileSync(artifacts.jsonPath, 'utf8')).toContain('"master-draft-docx"')
    expect(readFileSync(artifacts.markdownPath, 'utf8')).toContain('# Harness Report')
  })
})
