import { z } from 'zod'

export const appConfigSchema = z.object({
  pandocPath: z.string().min(1),
  bibliographyPath: z.string().min(1),
  referenceDocPath: z.string().min(1),
  referenceSectionTitle: z.string().min(1),
  imageRootDir: z.string().min(1),
  enableLegacyCompat: z.boolean()
})

export type AppConfig = z.infer<typeof appConfigSchema>
