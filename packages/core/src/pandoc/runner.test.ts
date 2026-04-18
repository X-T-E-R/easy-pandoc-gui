import { describe, expect, test } from 'vitest'

import { buildPandocArgs } from './runner'

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
  })
})

