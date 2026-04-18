import { describe, expect, test } from 'vitest'

import { analyzeMarkdownUsage } from './analyze'

describe('markdown usage analysis', () => {
  test('detects legacy-compatible image caption pattern', () => {
    const report = analyzeMarkdownUsage('![img](a.png)\n<center>图 1 示例</center>')

    expect(report.legacyCompatibleHits).toBe(1)
    expect(report.ruleHits).toContainEqual(
      expect.objectContaining({ ruleId: 'image-center-caption', count: 1 })
    )
  })

  test('detects forbidden absolute personal path', () => {
    const report = analyzeMarkdownUsage(
      '![img](C:\\Users\\xxoy1\\OneDrive\\Program\\testPandoc\\assets\\a.png)'
    )

    expect(report.forbiddenHits).toBe(1)
    expect(report.ruleHits).toContainEqual(
      expect.objectContaining({ ruleId: 'absolute-personal-path', count: 1 })
    )
  })

  test('detects standalone center caption blocks', () => {
    const report = analyzeMarkdownUsage('<center>表 2.1 三类结构对比</center>')

    expect(report.legacyCompatibleHits).toBe(1)
    expect(report.ruleHits).toContainEqual(
      expect.objectContaining({ ruleId: 'center-caption-block', count: 1 })
    )
  })
})
