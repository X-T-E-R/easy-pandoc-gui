import { describe, expect, test } from 'vitest'

import { transformLegacyMarkdown } from './transform'

describe('legacy compatibility transform', () => {
  test('rewrites image plus center caption into canonical figure markdown', () => {
    const input = '![img](a.png)\n<center>图 1 示例</center>'
    const output = transformLegacyMarkdown(input)

    expect(output).toContain('![图 1 示例](a.png)')
  })
})

