import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { openPath } from '@tauri-apps/plugin-opener'

export interface DesktopWarning {
  rawPath: string
  reason: 'unresolved'
  attempted: string[]
}

export interface DesktopAssetSummary {
  inspected: number
  resolved: number
  unresolved: number
}

export interface DesktopLoadDocumentResult {
  path: string
  source: string
  canonicalMarkdown: string
  warnings: DesktopWarning[]
  assetSummary: DesktopAssetSummary
}

export interface DesktopDiagnostic {
  code:
    | 'missing-resource'
    | 'math-render'
    | 'svg-converter-missing'
    | 'generic-warning'
    | 'generic-error'
  severity: 'warning' | 'error'
  message: string
}

export interface DesktopExportResult {
  outputPath: string
  canonicalMarkdown: string
  warnings: DesktopWarning[]
  assetSummary: DesktopAssetSummary
  diagnostics: DesktopDiagnostic[]
  stderr: string
}

export interface DesktopDoctorCheck {
  id: string
  status: 'ok' | 'missing' | 'error'
  detail: string
}

export interface DesktopDoctorResult {
  status: 'success' | 'warning' | 'error'
  checks: DesktopDoctorCheck[]
}

export interface LoadDocumentInput {
  path: string
  resourceRoots?: string[]
}

export interface ExportDocumentInput {
  inputPath: string
  source: string
  outputPath: string
  bibliographyPath?: string
  referenceDocPath?: string
  resourcePaths?: string[]
  pandocPath?: string
  referenceSectionTitle?: string
  mode: 'html' | 'docx'
}

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    typeof (window as typeof window & { __TAURI_INTERNALS__?: unknown })
      .__TAURI_INTERNALS__ !== 'undefined'
  )
}

export async function pickMarkdownFile(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null
  }

  const result = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  })

  return typeof result === 'string' ? result : null
}

export async function pickBibliographyFile(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null
  }

  const result = await open({
    multiple: false,
    directory: false,
    filters: [
      { name: 'Bibliography', extensions: ['bib', 'json', 'yaml', 'yml'] }
    ]
  })

  return typeof result === 'string' ? result : null
}

export async function pickReferenceDoc(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null
  }

  const result = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Word Template', extensions: ['docx'] }]
  })

  return typeof result === 'string' ? result : null
}

export async function requestOutputPath(
  inputPath: string,
  mode: 'html' | 'docx'
): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null
  }

  const filename =
    inputPath
      .split(/[\\/]/)
      .pop()
      ?.replace(/\.[^.]+$/, `.${mode}`) ?? `output.${mode}`

  return save({
    defaultPath: filename,
    filters: [{ name: mode.toUpperCase(), extensions: [mode] }]
  })
}

export async function revealOutput(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    return
  }

  await openPath(path)
}

export async function loadDocument(
  input: LoadDocumentInput
): Promise<DesktopLoadDocumentResult> {
  if (!isTauriRuntime()) {
    return {
      path: input.path,
      source: '',
      canonicalMarkdown: '',
      warnings: [],
      assetSummary: { inspected: 0, resolved: 0, unresolved: 0 }
    }
  }

  return invoke<DesktopLoadDocumentResult>('load_document', { input })
}

export async function exportDocument(
  input: ExportDocumentInput
): Promise<DesktopExportResult> {
  if (!isTauriRuntime()) {
    return {
      outputPath: input.outputPath,
      canonicalMarkdown: input.source,
      warnings: [],
      assetSummary: { inspected: 0, resolved: 0, unresolved: 0 },
      diagnostics: [],
      stderr: ''
    }
  }

  return invoke<DesktopExportResult>('export_document', { input })
}

export async function runDoctor(
  pandocPath?: string
): Promise<DesktopDoctorResult> {
  if (!isTauriRuntime()) {
    return {
      status: 'warning',
      checks: [
        {
          id: 'tauri-runtime',
          status: 'missing',
          detail: '当前不在 Tauri 运行时，doctor 结果为前端降级占位。'
        }
      ]
    }
  }

  return invoke<DesktopDoctorResult>('run_doctor', {
    input: {
      pandocPath
    }
  })
}
