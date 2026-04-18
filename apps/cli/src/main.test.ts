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
})
