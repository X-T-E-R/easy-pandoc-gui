import { z } from 'zod'

export const eventEnvelopeSchema = z.object({
  eventName: z.string().min(1),
  sessionId: z.string().min(1),
  documentId: z.string().min(1),
  phase: z.string().min(1),
  durationMs: z.number().nonnegative(),
  status: z.enum(['success', 'warning', 'error']),
  metadata: z.record(z.string(), z.unknown())
})

export type EventEnvelope = z.infer<typeof eventEnvelopeSchema>
