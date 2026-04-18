#!/usr/bin/env node

import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import {
  analyzeMarkdownUsage,
  runPandocJob,
  type BuildPandocArgsInput,
  transformLegacyMarkdown
} from '@testpandoc/core'

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
    const output = transformLegacyMarkdown(source)

    if (values.output) {
      const outputPath = path.resolve(baseDir, values.output)
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, output, 'utf8')
      io.stdout(`wrote: ${outputPath}`)
      return 0
    }

    io.stdout(output)
    return 0
  }

  if (command === 'export') {
    if (!values.output) {
      io.stderr('export 命令缺少 --output 参数')
      return 1
    }

    const mode = values.to === 'docx' ? 'docx' : 'html'
    const transformed = transformLegacyMarkdown(source)
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'testpandoc-export-'))
    const tempInputPath = path.join(tempDir, `${path.parse(inputPath).name}.canonical.md`)

    await writeFile(tempInputPath, transformed, 'utf8')

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
          ...(values['resource-path']?.map((item) => path.resolve(baseDir, item)) ?? [])
        ],
        referenceSectionTitle: values['section-title'],
        mode
      })

      if (result.stderr) {
        io.stderr(result.stderr)
      }
      io.stdout(`exported: ${path.resolve(baseDir, values.output)}`)
      return 0
    } finally {
      await rm(tempDir, { recursive: true, force: true })
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
