#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import { analyzeMarkdownUsage, transformLegacyMarkdown } from '@testpandoc/core'

export interface CliIo {
  stdout: (line: string) => void
  stderr: (line: string) => void
}

const defaultIo: CliIo = {
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line)
}

export async function runCli(argv: string[], io: CliIo = defaultIo): Promise<number> {
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
      json: { type: 'boolean', default: false }
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

  io.stderr(`未知命令: ${command}`)
  printHelp(io)
  return 1
}

function printHelp(io: CliIo): void {
  io.stdout('testpandoc cli')
  io.stdout('commands:')
  io.stdout('  inspect --input <file> [--json]')
  io.stdout('  transform --input <file> [--output <file>]')
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
