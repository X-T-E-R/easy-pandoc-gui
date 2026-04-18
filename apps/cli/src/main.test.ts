import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import { runCli } from './main'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('cli mode', () => {
  test('resolves relative input paths from INIT_CWD when present', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const packageDir = path.join(dir, 'apps', 'cli')
    const inputPath = path.join(dir, 'input.md')
    const previousCwd = process.cwd()
    const previousInitCwd = process.env.INIT_CWD

    writeFileSync(inputPath, '![img](a.png)\n<center>图 1 示例</center>', 'utf8')
    await import('node:fs/promises').then(({ mkdir }) => mkdir(packageDir, { recursive: true }))

    process.env.INIT_CWD = dir
    process.chdir(packageDir)

    try {
      const stdout: string[] = []
      const exitCode = await runCli(['inspect', '--input', 'input.md'], {
        stdout: (line) => stdout.push(line),
        stderr: () => undefined
      })

      expect(exitCode).toBe(0)
      expect(stdout.join('\n')).toContain('legacyCompatibleHits: 1')
    } finally {
      process.chdir(previousCwd)
      if (previousInitCwd === undefined) {
        delete process.env.INIT_CWD
      } else {
        process.env.INIT_CWD = previousInitCwd
      }
    }
  })

  test('inspect command reports legacy-compatible hits', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const inputPath = path.join(dir, 'input.md')
    writeFileSync(inputPath, '![img](a.png)\n<center>图 1 示例</center>', 'utf8')

    const stdout: string[] = []
    const stderr: string[] = []
    const exitCode = await runCli(['inspect', '--input', inputPath], {
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line)
    })

    expect(exitCode).toBe(0)
    expect(stderr).toHaveLength(0)
    expect(stdout.join('\n')).toContain('legacyCompatibleHits: 1')
  })

  test('transform command writes canonical markdown output', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const inputPath = path.join(dir, 'input.md')
    const outputPath = path.join(dir, 'output.md')
    writeFileSync(inputPath, '![img](a.png)\n<center>图 1 示例</center>', 'utf8')

    const exitCode = await runCli(['transform', '--input', inputPath, '--output', outputPath], {
      stdout: () => undefined,
      stderr: () => undefined
    })

    expect(exitCode).toBe(0)
    expect(readFileSync(outputPath, 'utf8')).toContain('![图 1 示例](a.png)')
  })

  test('export command calls pandoc runner with transformed temporary input', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const inputPath = path.join(dir, 'input.md')
    const outputPath = path.join(dir, 'output.html')
    writeFileSync(inputPath, '$$ a = b \\\\tag{2} $$', 'utf8')

    const calls: string[] = []
    const exitCode = await runCli(
      ['export', '--input', inputPath, '--output', outputPath, '--to', 'html'],
      {
        stdout: () => undefined,
        stderr: () => undefined
      },
      {
        runPandoc: (job) => {
          calls.push(readFileSync(job.inputPath, 'utf8'))
          return Promise.resolve({ stdout: 'ok', stderr: '' })
        }
      }
    )

    expect(exitCode).toBe(0)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContain('$$a = b$$ {#eq:2}')
  })

  test('harness command runs a manifest and prints json summary', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const inputPath = path.join(dir, 'input.md')
    const manifestPath = path.join(dir, 'manifest.json')
    const outputPath = path.join(dir, 'output.html')
    writeFileSync(path.join(dir, 'a.png'), 'binary-placeholder', 'utf8')
    writeFileSync(inputPath, '![img](a.png)\n<center>图 1 示例</center>', 'utf8')
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          cases: [
            {
              id: 'legacy-html',
              input: inputPath,
              output: outputPath,
              mode: 'html'
            }
          ]
        },
        null,
        2
      ),
      'utf8'
    )

    const stdout: string[] = []
    const exitCode = await runCli(
      ['harness', '--manifest', manifestPath, '--json'],
      {
        stdout: (line) => stdout.push(line),
        stderr: () => undefined
      },
      {
        runPandoc: (job) => {
          writeFileSync(job.outputPath, readFileSync(job.inputPath, 'utf8'), 'utf8')
          return Promise.resolve({ stdout: '', stderr: '' })
        }
      }
    )

    expect(exitCode).toBe(0)
    expect(stdout.join('\n')).toContain('"totalCases": 1')
    expect(stdout.join('\n')).toContain('"passedCases": 1')
  })

  test('harness command writes report artifacts when report dir is provided', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'testpandoc-cli-'))
    tempDirs.push(dir)
    const inputPath = path.join(dir, 'input.md')
    const manifestPath = path.join(dir, 'manifest.json')
    const outputPath = path.join(dir, 'output.html')
    const reportDir = path.join(dir, 'reports')

    writeFileSync(path.join(dir, 'a.png'), 'binary-placeholder', 'utf8')
    writeFileSync(inputPath, '![img](a.png)\n<center>图 1 示例</center>', 'utf8')
    writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          cases: [
            {
              id: 'legacy-html',
              input: inputPath,
              output: outputPath,
              mode: 'html'
            }
          ]
        },
        null,
        2
      ),
      'utf8'
    )

    const exitCode = await runCli(
      ['harness', '--manifest', manifestPath, '--report-dir', reportDir],
      {
        stdout: () => undefined,
        stderr: () => undefined
      },
      {
        runPandoc: (job) => {
          writeFileSync(job.outputPath, readFileSync(job.inputPath, 'utf8'), 'utf8')
          return Promise.resolve({ stdout: '', stderr: '' })
        }
      }
    )

    expect(exitCode).toBe(0)
    expect(readFileSync(path.join(reportDir, 'harness-report.json'), 'utf8')).toContain(
      '"legacy-html"'
    )
    expect(readFileSync(path.join(reportDir, 'harness-report.md'), 'utf8')).toContain(
      '# Harness Report'
    )
  })
})
