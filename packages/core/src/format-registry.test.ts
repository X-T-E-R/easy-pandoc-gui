import { describe, expect, test } from 'vitest'

import { formatRegistry } from './format-registry'

describe('format registry', () => {
  test('contains standard and legacy categories', () => {
    expect(formatRegistry.standard.length).toBeGreaterThan(0)
    expect(formatRegistry.legacyCompatible.length).toBeGreaterThan(0)
    expect(formatRegistry.forbidden.length).toBeGreaterThan(0)
  })
})

