import type { FormatRuleCategory } from '../types'

export interface MarkdownRuleHit {
  ruleId: string
  category: FormatRuleCategory
  count: number
}

export interface MarkdownUsageReport {
  standardHits: number
  standardExtensionHits: number
  legacyCompatibleHits: number
  forbiddenHits: number
  ruleHits: MarkdownRuleHit[]
}

interface Detector {
  ruleId: string
  category: FormatRuleCategory
  pattern?: RegExp
  count?: (input: string, state: Map<string, number>) => number
}

const DETECTORS: Detector[] = [
  {
    ruleId: 'pandoc-citation',
    category: 'standard',
    pattern: /\[@[^\]]+\]/g
  },
  {
    ruleId: 'image-attributes',
    category: 'standardExtension',
    pattern: /!\[[^\]]*]\([^)]+\)\{[^}]+\}/g
  },
  {
    ruleId: 'image-center-caption',
    category: 'legacyCompatible',
    pattern: /!\[(.*?)\]\((.*?)\)\s*<center>(.*?)<\/center>/gs
  },
  {
    ruleId: 'center-caption-block',
    category: 'legacyCompatible',
    count: (input, state) => {
      const totalCenterBlocks = countMatches(
        input,
        /<center>(?!\s*$)(.*?)<\/center>/gs
      )
      const imageCaptionBlocks = state.get('image-center-caption') ?? 0
      return Math.max(0, totalCenterBlocks - imageCaptionBlocks)
    }
  },
  {
    ruleId: 'math-tag',
    category: 'legacyCompatible',
    pattern: /\\tag\{.*?\}/g
  },
  {
    ruleId: 'absolute-personal-path',
    category: 'forbidden',
    pattern: /[A-Za-z]:\\Users\\[^)\r\n]+/g
  }
]

function countMatches(input: string, pattern: RegExp): number {
  return Array.from(input.matchAll(pattern)).length
}

export function analyzeMarkdownUsage(input: string): MarkdownUsageReport {
  const counts = new Map<string, number>()

  const ruleHits = DETECTORS.map((detector) => {
    const count = detector.count
      ? detector.count(input, counts)
      : countMatches(input, detector.pattern as RegExp)

    counts.set(detector.ruleId, count)

    return {
      ruleId: detector.ruleId,
      category: detector.category,
      count
    }
  }).filter((hit) => hit.count > 0)

  return {
    standardHits: sumByCategory(ruleHits, 'standard'),
    standardExtensionHits: sumByCategory(ruleHits, 'standardExtension'),
    legacyCompatibleHits: sumByCategory(ruleHits, 'legacyCompatible'),
    forbiddenHits: sumByCategory(ruleHits, 'forbidden'),
    ruleHits
  }
}

function sumByCategory(
  ruleHits: MarkdownRuleHit[],
  category: FormatRuleCategory
): number {
  return ruleHits
    .filter((hit) => hit.category === category)
    .reduce((total, hit) => total + hit.count, 0)
}
