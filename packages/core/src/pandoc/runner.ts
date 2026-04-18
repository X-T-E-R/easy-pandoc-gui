import path from 'node:path'

export interface BuildPandocArgsInput {
  inputPath: string
  outputPath: string
  bibliographyPath?: string
  referenceDocPath?: string
  resourcePaths?: string[]
  referenceSectionTitle?: string
  mode: 'docx' | 'html'
}

export function buildPandocArgs(input: BuildPandocArgsInput): string[] {
  const args = [input.inputPath]

  if (input.mode === 'docx') {
    args.push('-o', input.outputPath)
  } else {
    args.push('-t', 'html5', '--standalone')
  }

  args.push('--citeproc')

  if (input.bibliographyPath) {
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

