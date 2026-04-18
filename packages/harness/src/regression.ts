import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  analyzeMarkdownUsage,
  canonicalizeMarkdown,
  runPandocJob,
  type BuildPandocArgsInput,
  type CanonicalizeWarning,
  type MarkdownUsageReport
} from '@testpandoc/core'

import {
  createHarnessRunSummary,
  parsePandocDiagnostics,
  type HarnessDiagnostic
} from './report'

export interface HarnessManifestCase {
  id: string
  input: string
  output: string
  mode: 'html' | 'docx'
  bibliography?: string
  referenceDoc?: string
  sectionTitle?: string
  resourcePaths?: string[]
  pandoc?: string
}

export interface HarnessManifest {
  cases: HarnessManifestCase[]
}

export interface HarnessCaseResult {
  id: string
  inputPath: string
  outputPath: string
  mode: 'html' | 'docx'
  before: MarkdownUsageReport
  after: MarkdownUsageReport
  warnings: CanonicalizeWarning[]
  diagnostics: HarnessDiagnostic[]
  status: 'passed' | 'warning' | 'failed'
}

export interface HarnessManifestSummary {
  totalCases: number
  passedCases: number
  warningCases: number
  failedCases: number
  passRate: number
  status: 'success' | 'warning' | 'error'
}

export interface HarnessManifestResult {
  cases: HarnessCaseResult[]
  summary: HarnessManifestSummary
}

export interface HarnessRuntimeOptions {
  cwd?: string
  runPandoc?: (
    job: BuildPandocArgsInput
  ) => Promise<{ stdout: string; stderr: string }>
}

export function parseHarnessManifest(value: unknown): HarnessManifest {
  if (!isRecord(value) || !Array.isArray(value.cases)) {
    throw new Error('Invalid harness manifest: missing cases array')
  }

  const cases = value.cases.map((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.input !== 'string' ||
      typeof entry.output !== 'string' ||
      (entry.mode !== 'html' && entry.mode !== 'docx')
    ) {
      throw new Error('Invalid harness manifest case')
    }

    const mode: HarnessManifestCase['mode'] = entry.mode

    return {
      id: entry.id,
      input: entry.input,
      output: entry.output,
      mode,
      bibliography:
        typeof entry.bibliography === 'string' ? entry.bibliography : undefined,
      referenceDoc:
        typeof entry.referenceDoc === 'string' ? entry.referenceDoc : undefined,
      sectionTitle:
        typeof entry.sectionTitle === 'string' ? entry.sectionTitle : undefined,
      resourcePaths: Array.isArray(entry.resourcePaths)
        ? entry.resourcePaths.filter(
            (item): item is string => typeof item === 'string'
          )
        : undefined,
      pandoc: typeof entry.pandoc === 'string' ? entry.pandoc : undefined
    }
  })

  return { cases }
}

export async function runHarnessManifest(
  manifest: HarnessManifest,
  options: HarnessRuntimeOptions = {}
): Promise<HarnessManifestResult> {
  const cwd = options.cwd ?? process.cwd()
  const runPandoc = options.runPandoc ?? runPandocJob
  const cases: HarnessCaseResult[] = []

  for (const entry of manifest.cases) {
    const inputPath = path.resolve(cwd, entry.input)
    const outputPath = path.resolve(cwd, entry.output)
    const source = await readFile(inputPath, 'utf8')
    const before = analyzeMarkdownUsage(source)
    const canonical = canonicalizeMarkdown({
      source,
      documentPath: inputPath,
      rewriteBaseDir: path.dirname(inputPath),
      projectRoot: cwd,
      extraSearchRoots: entry.resourcePaths?.map((item) =>
        path.resolve(cwd, item)
      )
    })
    const after = analyzeMarkdownUsage(canonical.markdown)
    const tempInputPath = path.join(
      os.tmpdir(),
      `testpandoc-harness-${entry.id}-${Date.now()}.md`
    )

    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(tempInputPath, canonical.markdown, 'utf8')

    try {
      const exportResult = await runPandoc({
        inputPath: tempInputPath,
        outputPath,
        mode: entry.mode,
        pandocPath: entry.pandoc,
        bibliographyPath: entry.bibliography
          ? path.resolve(cwd, entry.bibliography)
          : undefined,
        referenceDocPath: entry.referenceDoc
          ? path.resolve(cwd, entry.referenceDoc)
          : undefined,
        referenceSectionTitle: entry.sectionTitle,
        resourcePaths: [
          path.dirname(inputPath),
          cwd,
          ...(entry.resourcePaths?.map((item) => path.resolve(cwd, item)) ?? [])
        ]
      })
      const diagnostics = parsePandocDiagnostics(exportResult.stderr)

      cases.push({
        id: entry.id,
        inputPath,
        outputPath,
        mode: entry.mode,
        before,
        after,
        warnings: canonical.warnings,
        diagnostics,
        status:
          canonical.warnings.length > 0 || diagnostics.length > 0
            ? 'warning'
            : 'passed'
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      cases.push({
        id: entry.id,
        inputPath,
        outputPath,
        mode: entry.mode,
        before,
        after,
        warnings: canonical.warnings,
        diagnostics: [
          {
            code: 'generic-error',
            severity: 'error',
            message
          }
        ],
        status: 'failed'
      })
    } finally {
      await rm(tempInputPath, { force: true })
    }
  }

  const passedCases = cases.filter((entry) => entry.status === 'passed').length
  const warningCases = cases.filter(
    (entry) => entry.status === 'warning'
  ).length
  const failedCases = cases.filter((entry) => entry.status === 'failed').length
  const summaryStatus = createHarnessRunSummary({
    passed: passedCases,
    failed: failedCases,
    warnings: warningCases
  })

  return {
    cases,
    summary: {
      totalCases: cases.length,
      passedCases,
      warningCases,
      failedCases,
      passRate: summaryStatus.passRate,
      status: summaryStatus.status
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
