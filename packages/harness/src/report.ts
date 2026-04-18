import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface HarnessRunInput {
  passed: number
  failed: number
  warnings: number
}

export interface HarnessRunSummary {
  passRate: number
  status: 'success' | 'warning' | 'error'
}

export interface HarnessDiagnostic {
  code:
    | 'missing-resource'
    | 'math-render'
    | 'svg-converter-missing'
    | 'generic-warning'
    | 'generic-error'
  severity: 'warning' | 'error'
  message: string
}

export interface HarnessReportCaseLike {
  id: string
  status: 'passed' | 'warning' | 'failed'
  outputPath: string
  before: {
    legacyCompatibleHits: number
    forbiddenHits: number
  }
  after: {
    legacyCompatibleHits: number
    forbiddenHits: number
  }
  warnings: Array<{
    rawPath: string
  }>
  diagnostics: HarnessDiagnostic[]
}

export interface HarnessReportLike {
  summary: {
    totalCases: number
    passedCases: number
    warningCases: number
    failedCases: number
    passRate: number
    status: 'success' | 'warning' | 'error'
  }
  cases: HarnessReportCaseLike[]
}

export interface HarnessArtifactWriteInput {
  outputDir: string
  baseName?: string
}

export interface HarnessArtifactWriteResult {
  jsonPath: string
  markdownPath: string
}

export function createHarnessRunSummary(input: HarnessRunInput): HarnessRunSummary {
  const total = input.passed + input.failed
  const passRate = total === 0 ? 0 : Math.round((input.passed / total) * 100)

  if (input.failed > 0) {
    return {
      passRate,
      status: input.warnings > 0 ? 'warning' : 'error'
    }
  }

  return {
    passRate,
    status: input.warnings > 0 ? 'warning' : 'success'
  }
}

export function parsePandocDiagnostics(stderr: string): HarnessDiagnostic[] {
  const entries = Array.from(stderr.matchAll(/\[(WARNING|ERROR)\]\s*([\s\S]*?)(?=\r?\n\[(?:WARNING|ERROR)\]|$)/g))

  return entries.map((entry) => {
    const severity = entry[1] === 'ERROR' ? 'error' : 'warning'
    const message = entry[2]?.replace(/\r?\n\s+/g, ' ').trim() ?? ''

    if (/Could not fetch resource/i.test(message) || /replacing image with description/i.test(message)) {
      return {
        code: 'missing-resource',
        severity,
        message
      }
    }

    if (/Could not convert TeX math/i.test(message) || /rendering as TeX/i.test(message)) {
      return {
        code: 'math-render',
        severity,
        message
      }
    }

    if (/rsvg-convert/i.test(message)) {
      return {
        code: 'svg-converter-missing',
        severity,
        message
      }
    }

    return {
      code: severity === 'error' ? 'generic-error' : 'generic-warning',
      severity,
      message
    }
  })
}

export function renderHarnessReportMarkdown(result: HarnessReportLike): string {
  const lines = [
    '# Harness Report',
    '',
    `- Total Cases: ${result.summary.totalCases}`,
    `- Passed Cases: ${result.summary.passedCases}`,
    `- Warning Cases: ${result.summary.warningCases}`,
    `- Failed Cases: ${result.summary.failedCases}`,
    `- Pass Rate: ${result.summary.passRate}%`,
    `- Status: ${result.summary.status}`,
    ''
  ]

  for (const entry of result.cases) {
    lines.push(`## ${entry.id}`)
    lines.push(`- Status: ${entry.status}`)
    lines.push(`- Output: ${entry.outputPath}`)
    lines.push(
      `- Legacy Hits: ${entry.before.legacyCompatibleHits} -> ${entry.after.legacyCompatibleHits}`
    )
    lines.push(`- Forbidden Hits: ${entry.before.forbiddenHits} -> ${entry.after.forbiddenHits}`)

    if (entry.warnings.length > 0) {
      lines.push('- Canonicalization Warnings:')
      for (const warning of entry.warnings) {
        lines.push(`  - unresolved asset: ${warning.rawPath}`)
      }
    }

    if (entry.diagnostics.length > 0) {
      lines.push('- Diagnostics:')
      for (const diagnostic of entry.diagnostics) {
        lines.push(`  - ${diagnostic.code}: ${diagnostic.message}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}

export async function writeHarnessArtifacts(
  result: HarnessReportLike,
  input: HarnessArtifactWriteInput
): Promise<HarnessArtifactWriteResult> {
  const baseName = input.baseName ?? 'harness-report'
  const jsonPath = path.join(input.outputDir, `${baseName}.json`)
  const markdownPath = path.join(input.outputDir, `${baseName}.md`)

  await mkdir(input.outputDir, { recursive: true })
  await writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8')
  await writeFile(markdownPath, renderHarnessReportMarkdown(result), 'utf8')

  return {
    jsonPath,
    markdownPath
  }
}
