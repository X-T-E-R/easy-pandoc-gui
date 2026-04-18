import { describe, expect, test } from 'vitest'

import { extractWordBody } from './docx-xml'

describe('docx xml helpers', () => {
  test('extracts document body from xml payload', () => {
    const body = extractWordBody(
      '<w:document><w:body><w:p/></w:body></w:document>'
    )

    expect(body).toContain('<w:p/>')
  })
})
