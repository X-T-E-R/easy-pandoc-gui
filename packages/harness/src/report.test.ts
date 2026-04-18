import { describe, expect, test } from 'vitest'

import { createHarnessRunSummary } from './report'

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
})

