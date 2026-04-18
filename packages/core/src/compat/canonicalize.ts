import { existsSync } from 'node:fs'
import path from 'node:path'

import { transformLegacyMarkdown } from './transform'

const IMAGE_PATTERN = /!\[([^\]]*)]\(([^)\r\n]+)\)/g
const REMOTE_ASSET_PATTERN = /^(https?:\/\/|data:|file:\/\/)/i

export interface CanonicalizeWarning {
  rawPath: string
  reason: 'unresolved'
  attempted: string[]
}

export interface CanonicalizeAssetSummary {
  inspected: number
  resolved: number
  unresolved: number
}

export interface CanonicalizeMarkdownInput {
  source: string
  documentPath: string
  rewriteBaseDir?: string
  projectRoot?: string
  extraSearchRoots?: string[]
}

export interface CanonicalizeMarkdownResult {
  markdown: string
  warnings: CanonicalizeWarning[]
  assetSummary: CanonicalizeAssetSummary
}

interface AssetResolution {
  resolvedPath?: string
  attempted: string[]
}

export function canonicalizeMarkdown(
  input: CanonicalizeMarkdownInput
): CanonicalizeMarkdownResult {
  const transformed = transformLegacyMarkdown(input.source)
  const documentDir = path.dirname(input.documentPath)
  const rewriteBaseDir = input.rewriteBaseDir ?? documentDir
  const searchRoots = uniquePaths([
    documentDir,
    input.projectRoot,
    ...(input.extraSearchRoots ?? [])
  ])
  const warnings: CanonicalizeWarning[] = []
  const assetSummary: CanonicalizeAssetSummary = {
    inspected: 0,
    resolved: 0,
    unresolved: 0
  }

  const markdown = transformed.replace(
    IMAGE_PATTERN,
    (match: string, altText: string, rawPath: string) => {
      const cleanPath = rawPath.trim()

      if (REMOTE_ASSET_PATTERN.test(cleanPath)) {
        return match
      }

      assetSummary.inspected += 1
      const resolution = resolveAssetPath(cleanPath, documentDir, searchRoots)

      if (!resolution.resolvedPath) {
        assetSummary.unresolved += 1
        warnings.push({
          rawPath: cleanPath,
          reason: 'unresolved',
          attempted: resolution.attempted
        })
        return match
      }

      assetSummary.resolved += 1
      const rewrittenPath = formatRelativeAssetPath(rewriteBaseDir, resolution.resolvedPath)
      return `![${altText}](${rewrittenPath})`
    }
  )

  return {
    markdown,
    warnings,
    assetSummary
  }
}

function resolveAssetPath(
  rawPath: string,
  documentDir: string,
  searchRoots: string[]
): AssetResolution {
  const attempted = new Set<string>()
  const normalizedRawPath = rawPath.replace(/\//g, path.sep)
  const basename = path.basename(normalizedRawPath)
  const directCandidates = new Set<string>()

  if (path.isAbsolute(normalizedRawPath)) {
    directCandidates.add(normalizedRawPath)
  } else {
    directCandidates.add(path.resolve(documentDir, normalizedRawPath))
  }

  const specialTail = extractSpecialTail(normalizedRawPath)

  for (const root of searchRoots) {
    directCandidates.add(path.resolve(root, normalizedRawPath))
    directCandidates.add(path.resolve(root, basename))
    directCandidates.add(path.resolve(root, 'assets', basename))
    directCandidates.add(path.resolve(root, 'attachments', basename))

    if (specialTail) {
      directCandidates.add(path.resolve(root, specialTail))
    }
  }

  for (const candidate of directCandidates) {
    attempted.add(candidate)
    if (existsSync(candidate)) {
      return {
        resolvedPath: candidate,
        attempted: Array.from(attempted)
      }
    }
  }

  return {
    attempted: Array.from(attempted)
  }
}

function extractSpecialTail(rawPath: string): string | undefined {
  const normalized = rawPath.replace(/\//g, path.sep)
  const match = normalized.match(
    new RegExp(`(?:^|\\\\)(assets|attachments)\\\\(.+)$`, 'i')
  )

  if (!match) {
    return undefined
  }

  return path.join(match[1] ?? '', match[2] ?? '')
}

function formatRelativeAssetPath(baseDir: string, resolvedPath: string): string {
  const relative = path.relative(baseDir, resolvedPath)
  const candidate = relative.length > 0 ? relative : path.basename(resolvedPath)

  if (candidate.includes(':')) {
    return resolvedPath.replace(/\\/g, '/')
  }

  return candidate.replace(/\\/g, '/')
}

function uniquePaths(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}
