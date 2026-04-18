import { describe, expect, test } from 'vitest'

import { runEnvironmentDoctor } from './doctor'

describe('environment doctor', () => {
  test('reports available and missing tools with structured status', async () => {
    const result = await runEnvironmentDoctor(
      {
        pandocPath: 'pandoc'
      },
      {
        execFile: (command, args) => {
          if (command === 'pandoc' && args[0] === '--version') {
            return Promise.resolve({
              stdout: 'pandoc 3.8.3',
              stderr: ''
            })
          }

          return Promise.reject(new Error(`spawn ${command} ENOENT`))
        }
      }
    )

    expect(result.status).toBe('warning')
    expect(result.checks.find((entry) => entry.id === 'pandoc')?.status).toBe(
      'ok'
    )
    expect(
      result.checks.find((entry) => entry.id === 'rsvg-convert')?.status
    ).toBe('missing')
  })
})
