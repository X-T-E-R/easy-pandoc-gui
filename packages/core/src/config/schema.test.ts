import { describe, expect, test } from 'vitest'

import { appConfigSchema } from './schema'

describe('app config schema', () => {
  test('accepts a desktop conversion configuration', () => {
    const result = appConfigSchema.safeParse({
      pandocPath: 'pandoc',
      bibliographyPath: 'refs/library.bib',
      referenceDocPath: 'templates/ref.docx',
      referenceSectionTitle: '参考文献',
      imageRootDir: 'assets',
      enableLegacyCompat: true
    })

    expect(result.success).toBe(true)
  })
})
