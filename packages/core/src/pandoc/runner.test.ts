import { describe, expect, test } from 'vitest'

import { buildPandocArgs, runPandocJob } from './runner'

describe('pandoc runner contracts', () => {
  test('adds citeproc and reference doc when configured', () => {
    const args = buildPandocArgs({
      inputPath: 'input.md',
      outputPath: 'output.docx',
      bibliographyPath: 'refs.bib',
      referenceDocPath: 'ref.docx',
      resourcePaths: ['fixtures', 'assets'],
      referenceSectionTitle: '参考文献',
      mode: 'docx'
    })

    expect(args).toContain('--citeproc')
    expect(args).toContain('--reference-doc')
    expect(args).toContain('--bibliography')
    expect(args).toContain('--resource-path')
    expect(args).toContain('output.docx')
  })

  test('executes pandoc through injected process runner', async () => {
    const calls: Array<{ command: string; args: string[] }> = []

    const result = await runPandocJob(
      {
        inputPath: 'input.md',
        outputPath: 'output.html',
        mode: 'html',
        resourcePaths: ['fixtures']
      },
      {
        execFile: (command, args) => {
          calls.push({ command, args })
          return Promise.resolve({ stdout: 'ok', stderr: '' })
        }
      }
    )

    expect(result.stdout).toBe('ok')
    expect(calls).toHaveLength(1)
    expect(calls[0]?.command).toBe('pandoc')
    expect(calls[0]?.args).toContain('output.html')
  })
})
