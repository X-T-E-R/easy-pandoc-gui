#!/usr/bin/env node

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import {
  analyzeMarkdownUsage,
  canonicalizeMarkdown,
  runPandocJob,
  type BuildPandocArgsInput
} from '@testpandoc/core'
import {
  parseHarnessManifest,
  renderHarnessReportMarkdown,
  runHarnessManifest,
  writeHarnessArtifacts
} from '@testpandoc/harness'

export interface CliIo {
  stdout: (line: string) => void
  stderr: (line: string) => void
}

export interface CliDeps {
  runPandoc: (job: BuildPandocArgsInput) => Promise<{ stdout: string; stderr: string }>
}

const defaultIo: CliIo = {
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line)
}

const defaultDeps: CliDeps = {
  runPandoc: runPandocJob
}

export async function runCli(
  argv: string[],
  io: CliIo = defaultIo,
  deps: CliDeps = defaultDeps
): Promise<number> {
  const [command, ...rest] = argv
  const baseDir = process.env.INIT_CWD || process.cwd()

  if (!command || command === 'help' || command === '--help') {
    printHelp(io)
    return 0
  }

  const { values } = parseArgs({
    args: rest,
    options: {
      input: { type: 'string' },
      output: { type: 'string' },
      manifest: { type: 'string' },
      'report-dir': { type: 'string' },
      json: { type: 'boolean', default: false },
      to: { type: 'string' },
      bibliography: { type: 'string' },
      'reference-doc': { type: 'string' },
      'resource-path': { type: 'string', multiple: true },
      'section-title': { type: 'string' },
      pandoc: { type: 'string' }
    },
    strict: true,
    allowPositionals: false
  })

  const inputPath = values.input ? path.resolve(baseDir, values.input) : ''

  if (command === 'harness') {
    if (!values.manifest) {
      io.stderr('harness 命令缺少 --manifest 参数')
      return 1
    }

    const manifestPath = path.resolve(baseDir, values.manifest)
    const manifest = parseHarnessManifest(JSON.parse(await readFile(manifestPath, 'utf8')))
    const result = await runHarnessManifest(manifest, {
      cwd: baseDir,
      runPandoc: deps.runPandoc
    })
    const artifacts = values['report-dir']
      ? await writeHarnessArtifacts(result, {
          outputDir: path.resolve(baseDir, values['report-dir'])
        })
      : undefined

    if (values.json) {
      io.stdout(JSON.stringify(artifacts ? { ...result, artifacts } : result, null, 2))
      return 0
    }

    if (artifacts) {
      io.stdout(`report.json: ${artifacts.jsonPath}`)
      io.stdout(`report.md: ${artifacts.markdownPath}`)
    }
    io.stdout(renderHarnessReportMarkdown(result))
    return 0
  }

  if (!inputPath) {
    io.stderr('缺少 --input 参数')
    return 1
  }

  const source = await readFile(inputPath, 'utf8')

  if (command === 'inspect') {
    const report = analyzeMarkdownUsage(source)

    if (values.json) {
      io.stdout(
        JSON.stringify(
          {
            inputPath,
            ...report
          },
          null,
          2
        )
      )
      return 0
    }

    io.stdout(`input: ${inputPath}`)
    io.stdout(`standardHits: ${report.standardHits}`)
    io.stdout(`standardExtensionHits: ${report.standardExtensionHits}`)
    io.stdout(`legacyCompatibleHits: ${report.legacyCompatibleHits}`)
    io.stdout(`forbiddenHits: ${report.forbiddenHits}`)
    for (const hit of report.ruleHits) {
      io.stdout(`- ${hit.category}/${hit.ruleId}: ${hit.count}`)
    }
    return 0
  }

  if (command === 'transform') {
    const outputPath = values.output ? path.resolve(baseDir, values.output) : undefined
    const canonical = canonicalizeMarkdown({
      source,
      documentPath: inputPath,
      rewriteBaseDir: outputPath ? path.dirname(outputPath) : path.dirname(inputPath),
      projectRoot: baseDir
    })

    if (outputPath) {
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, canonical.markdown, 'utf8')
      for (const warning of canonical.warnings) {
        io.stderr(`unresolved asset: ${warning.rawPath}`)
      }
      io.stdout(`wrote: ${outputPath}`)
      return 0
    }

    io.stdout(canonical.markdown)
    return 0
  }

  if (command === 'export') {
    if (!values.output) {
      io.stderr('export 命令缺少 --output 参数')
      return 1
    }

    const mode = values.to === 'docx' ? 'docx' : 'html'
    const canonical = canonicalizeMarkdown({
      source,
      documentPath: inputPath,
      rewriteBaseDir: path.dirname(inputPath),
      projectRoot: baseDir,
      extraSearchRoots: values['resource-path']?.map((item) => path.resolve(baseDir, item))
    })
    const tempInputPath = path.join(
      path.dirname(inputPath),
      `.testpandoc-export-${Date.now()}-${path.parse(inputPath).name}.canonical.md`
    )

    await writeFile(tempInputPath, canonical.markdown, 'utf8')

    try {
      const result = await deps.runPandoc({
        inputPath: tempInputPath,
        outputPath: path.resolve(baseDir, values.output),
        pandocPath: values.pandoc,
        bibliographyPath: values.bibliography
          ? path.resolve(baseDir, values.bibliography)
          : undefined,
        referenceDocPath: values['reference-doc']
          ? path.resolve(baseDir, values['reference-doc'])
          : undefined,
        resourcePaths: [
          path.dirname(inputPath),
          baseDir,
          ...(values['resource-path']?.map((item) => path.resolve(baseDir, item)) ?? [])
        ],
        referenceSectionTitle: values['section-title'],
        mode
      })

      for (const warning of canonical.warnings) {
        io.stderr(`unresolved asset: ${warning.rawPath}`)
      }
      if (result.stderr) {
        io.stderr(result.stderr)
      }
      io.stdout(`exported: ${path.resolve(baseDir, values.output)}`)
      return 0
    } finally {
      await rm(tempInputPath, { force: true })
    }
  }

  io.stderr(`未知命令: ${command}`)
  printHelp(io)
  return 1
}

function printHelp(io: CliIo): void {
  io.stdout('testpandoc cli')
  io.stdout('commands:')
  io.stdout('  inspect --input <file> [--json]')
  io.stdout('  transform --input <file> [--output <file>]')
  io.stdout('  export --input <file> --output <file> [--to html|docx]')
  io.stdout('  harness --manifest <file> [--json] [--report-dir <dir>]')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  void runCli(args)
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      defaultIo.stderr(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}
