import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

export interface BuildPandocArgsInput {
  inputPath: string
  outputPath: string
  pandocPath?: string
  bibliographyPath?: string
  referenceDocPath?: string
  resourcePaths?: string[]
  referenceSectionTitle?: string
  mode: 'docx' | 'html'
}

export function buildPandocArgs(input: BuildPandocArgsInput): string[] {
  const args = [input.inputPath, '-o', input.outputPath]

  if (input.mode === 'docx') {
    args.push('--standalone')
  } else {
    args.push('-t', 'html5', '--standalone')
  }

  if (input.bibliographyPath) {
    args.push('--citeproc')
    args.push('--bibliography', input.bibliographyPath)
  }

  if (input.referenceDocPath) {
    args.push('--reference-doc', input.referenceDocPath)
  }

  if (input.referenceSectionTitle) {
    args.push('--metadata', `reference-section-title=${input.referenceSectionTitle}`)
  }

  if (input.resourcePaths && input.resourcePaths.length > 0) {
    args.push('--resource-path', input.resourcePaths.join(path.delimiter))
  }

  return args
}

export interface PandocProcessRunner {
  execFile: (command: string, args: string[]) => Promise<{ stdout: string; stderr: string }>
}

const execFileAsync = promisify(execFile)

const defaultProcessRunner: PandocProcessRunner = {
  execFile: async (command, args) => {
    const result = await execFileAsync(command, args, {
      maxBuffer: 50 * 1024 * 1024
    })

    return {
      stdout: result.stdout,
      stderr: result.stderr
    }
  }
}

export async function runPandocJob(
  input: BuildPandocArgsInput,
  processRunner: PandocProcessRunner = defaultProcessRunner
): Promise<{ stdout: string; stderr: string }> {
  const pandocPath = input.pandocPath || 'pandoc'
  const args = buildPandocArgs(input)
  return processRunner.execFile(pandocPath, args)
}
