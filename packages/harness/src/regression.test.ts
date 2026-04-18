import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { renderHarnessReportMarkdown } from './report'
import { runHarnessManifest } from './regression'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('harness regression runner', () => {
  test('runs manifest cases and renders a markdown summary', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-harness-'))
    tempDirs.push(dir)
    const sourceDir = path.join(dir, 'workspace')
    const outputDir = path.join(dir, 'reports')
    mkdirSync(sourceDir, { recursive: true })
    mkdirSync(outputDir, { recursive: true })

    const inputPath = path.join(sourceDir, 'legacy.md')
    writeFileSync(path.join(sourceDir, 'a.png'), 'binary-placeholder', 'utf8')
    writeFileSync(
      inputPath,
      '![img](a.png)\n<center>图 1 示例</center>',
      'utf8'
    )

    const result = await runHarnessManifest(
      {
        cases: [
          {
            id: 'legacy-html',
            input: inputPath,
            output: path.join(outputDir, 'legacy.html'),
            mode: 'html'
          }
        ]
      },
      {
        cwd: sourceDir,
        runPandoc: (job) => {
          writeFileSync(
            job.outputPath,
            readFileSync(job.inputPath, 'utf8'),
            'utf8'
          )
          return Promise.resolve({ stdout: '', stderr: '' })
        }
      }
    )

    expect(result.summary.totalCases).toBe(1)
    expect(result.summary.passedCases).toBe(1)
    expect(result.cases[0]?.before.legacyCompatibleHits).toBe(1)
    expect(result.cases[0]?.after.legacyCompatibleHits).toBe(0)
    expect(result.cases[0]?.diagnostics).toHaveLength(0)

    const markdown = renderHarnessReportMarkdown(result)
    expect(markdown).toContain('legacy-html')
    expect(markdown).toContain('Pass Rate')
  })
})
