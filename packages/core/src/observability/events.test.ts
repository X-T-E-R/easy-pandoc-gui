import { describe, expect, test } from 'vitest'

import { eventEnvelopeSchema } from './events'

describe('event envelope schema', () => {
  test('accepts conversion events with duration', () => {
    const result = eventEnvelopeSchema.safeParse({
      eventName: 'pandoc.export.completed',
      sessionId: 'session-1',
      documentId: 'doc-1',
      phase: 'export',
      durationMs: 1200,
      status: 'success',
      metadata: {}
    })

    expect(result.success).toBe(true)
  })
})
