import { startTransition, useEffect, useState } from 'react'

import { analyzeMarkdownUsage } from '../../../../../packages/core/src/compat/analyze'
import {
  exportDocument,
  loadDocument,
  pickBibliographyFile,
  pickMarkdownFile,
  pickReferenceDoc,
  requestOutputPath,
  revealOutput,
  runDoctor,
  type DesktopDoctorResult,
  type DesktopExportResult,
  type DesktopLoadDocumentResult
} from './backend'
import {
  loadDesktopSettings,
  parseResourceRoots,
  saveDesktopSettings,
  type DesktopSettings
} from './settings'

type BusyAction = 'idle' | 'loading' | 'export-html' | 'export-docx' | 'doctor'

function getStatusClass(status?: 'success' | 'warning' | 'error' | 'ok' | 'missing') {
  if (status === 'success' || status === 'ok') {
    return 'status-success'
  }

  if (status === 'error' || status === 'missing') {
    return 'status-error'
  }

  return 'status-warning'
}

export function WorkbenchPanel() {
  const [settings, setSettings] = useState<DesktopSettings>(() => loadDesktopSettings())
  const [document, setDocument] = useState<DesktopLoadDocumentResult | null>(null)
  const [doctorResult, setDoctorResult] = useState<DesktopDoctorResult | null>(null)
  const [lastExport, setLastExport] = useState<DesktopExportResult | null>(null)
  const [busyAction, setBusyAction] = useState<BusyAction>('idle')
  const [feedback, setFeedback] = useState<string>('还没有加载文档。')

  useEffect(() => {
    saveDesktopSettings(settings)
  }, [settings])

  useEffect(() => {
    void refreshDoctor(settings.pandocPath)
  }, [])

  const sourceUsage = document ? analyzeMarkdownUsage(document.source) : null
  const canonicalUsage = document ? analyzeMarkdownUsage(document.canonicalMarkdown) : null

  async function refreshDoctor(pandocPath?: string) {
    try {
      setBusyAction('doctor')
      const result = await runDoctor(pandocPath)
      startTransition(() => {
        setDoctorResult(result)
        setBusyAction('idle')
      })
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : String(error))
        setBusyAction('idle')
      })
    }
  }

  async function hydrateDocument(path: string) {
    try {
      setBusyAction('loading')
      const result = await loadDocument({
        path,
        resourceRoots: parseResourceRoots(settings.resourceRoots)
      })
      startTransition(() => {
        setDocument(result)
        setFeedback(`已加载 ${path}`)
        setBusyAction('idle')
      })
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : String(error))
        setBusyAction('idle')
      })
    }
  }

  async function handlePickMarkdown() {
    const path = await pickMarkdownFile()
    if (!path) {
      return
    }

    setSettings((current) => ({
      ...current,
      inputPath: path
    }))
    await hydrateDocument(path)
  }

  async function handlePickBibliography() {
    const path = await pickBibliographyFile()
    if (!path) {
      return
    }

    setSettings((current) => ({
      ...current,
      bibliographyPath: path
    }))
  }

  async function handlePickReferenceDoc() {
    const path = await pickReferenceDoc()
    if (!path) {
      return
    }

    setSettings((current) => ({
      ...current,
      referenceDocPath: path
    }))
  }

  async function handleReload() {
    if (!settings.inputPath) {
      setFeedback('先选择一个 Markdown 文件。')
      return
    }

    await hydrateDocument(settings.inputPath)
  }

  async function handleExport(mode: 'html' | 'docx') {
    if (!document) {
      setFeedback('先读取并分析当前文档。')
      return
    }

    const outputPath = await requestOutputPath(document.path, mode)
    if (!outputPath) {
      return
    }

    setBusyAction(mode === 'html' ? 'export-html' : 'export-docx')

    try {
      const result = await exportDocument({
        inputPath: document.path,
        source: document.source,
        outputPath,
        bibliographyPath: settings.bibliographyPath || undefined,
        referenceDocPath: settings.referenceDocPath || undefined,
        resourcePaths: parseResourceRoots(settings.resourceRoots),
        pandocPath: settings.pandocPath || undefined,
        referenceSectionTitle: settings.sectionTitle || undefined,
        mode
      })

      startTransition(() => {
        setLastExport(result)
        setSettings((current) => ({
          ...current,
          lastOutputPath: result.outputPath,
          lastExportMode: mode
        }))
        setFeedback(`导出完成：${result.outputPath}`)
        setBusyAction('idle')
      })
    } catch (error) {
      startTransition(() => {
        setFeedback(error instanceof Error ? error.message : String(error))
        setBusyAction('idle')
      })
    }
  }

  const exportDiagnostics = lastExport?.diagnostics ?? []
  const activeWarnings = lastExport?.warnings ?? document?.warnings ?? []
  const previewMarkdown = lastExport?.canonicalMarkdown ?? document?.canonicalMarkdown ?? ''

  return (
    <article className="panel">
      <div className="split-header">
        <div>
          <h2>文档工作台</h2>
          <p className="muted">
            这里直接走真实文件读取、canonical 预览、Pandoc 导出和环境检查，不再是占位页。
          </p>
        </div>
        <span className="inline-pill">{feedback}</span>
      </div>

      <div className="workbench-grid">
        <section className="list-card">
          <div className="split-header">
            <div>
              <h3>最近配置</h3>
              <p className="muted">最近一次输入、导出模式和模板路径会自动保存在本地。</p>
            </div>
            {settings.inputPath ? <span className="path-chip">{settings.inputPath}</span> : null}
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="bibliographyPath">Bibliography</label>
              <input
                id="bibliographyPath"
                value={settings.bibliographyPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bibliographyPath: event.target.value
                  }))
                }
                placeholder="可选，.bib / CSL JSON"
              />
              <div className="field-hint">需要 citeproc 时填这里。</div>
            </div>

            <div className="field">
              <label htmlFor="referenceDocPath">Reference Doc</label>
              <input
                id="referenceDocPath"
                value={settings.referenceDocPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    referenceDocPath: event.target.value
                  }))
                }
                placeholder="可选，Word 模板 .docx"
              />
              <div className="field-hint">DOCX 导出时会注入 `--reference-doc`。</div>
            </div>

            <div className="field">
              <label htmlFor="pandocPath">Pandoc Path</label>
              <input
                id="pandocPath"
                value={settings.pandocPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    pandocPath: event.target.value
                  }))
                }
                placeholder="默认直接走系统 PATH 里的 pandoc"
              />
            </div>

            <div className="field">
              <label htmlFor="sectionTitle">Reference Section Title</label>
              <input
                id="sectionTitle"
                value={settings.sectionTitle}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sectionTitle: event.target.value
                  }))
                }
                placeholder="参考文献"
              />
            </div>

            <div
              className="field"
              style={{ gridColumn: '1 / -1' }}
            >
              <label htmlFor="resourceRoots">Resource Roots</label>
              <textarea
                id="resourceRoots"
                value={settings.resourceRoots}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    resourceRoots: event.target.value
                  }))
                }
                placeholder="一行一个资源目录；可填附件目录、图片目录、项目根目录"
              />
            </div>
          </div>

          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => void handlePickMarkdown()}
              disabled={busyAction !== 'idle'}
            >
              选择 Markdown
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleReload()}
              disabled={busyAction !== 'idle'}
            >
              分析当前文档
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void handlePickBibliography()}
              disabled={busyAction !== 'idle'}
            >
              选择 Bibliography
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void handlePickReferenceDoc()}
              disabled={busyAction !== 'idle'}
            >
              选择 Reference Doc
            </button>
          </div>
        </section>

        <section className="list-card">
          <div className="split-header">
            <div>
              <h3>环境检查</h3>
              <p className="muted">导出前先确认 Pandoc 和 SVG 转换器的真实状态。</p>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => void refreshDoctor(settings.pandocPath)}
              disabled={busyAction !== 'idle'}
            >
              刷新环境检查
            </button>
          </div>

          <div className="status-strip">
            <span className={`inline-pill ${getStatusClass(doctorResult?.status)}`}>
              doctor: {doctorResult?.status ?? 'pending'}
            </span>
            {busyAction === 'doctor' ? <span className="inline-pill">checking...</span> : null}
          </div>

          <div className="two-column-list">
            {(doctorResult?.checks ?? []).map((check) => (
              <div
                className="status-card"
                key={check.id}
              >
                <span className="status-label">{check.id}</span>
                <span className={`status-value ${getStatusClass(check.status)}`}>{check.status}</span>
                <div>{check.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card-grid">
          <div className="metric-card">
            <span className="metric-label">输入文档</span>
            <span className="metric-value">{document ? 'loaded' : 'pending'}</span>
            <div>{document?.path ?? '还未选择文件'}</div>
          </div>
          <div className="metric-card">
            <span className="metric-label">最近导出</span>
            <span className="metric-value">
              {lastExport ? settings.lastExportMode.toUpperCase() : 'none'}
            </span>
            <div>{settings.lastOutputPath || '还没有导出产物'}</div>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-box">
            <h3>原稿命中</h3>
            <dl>
              <dt>标准</dt>
              <dd>{sourceUsage?.standardHits ?? 0}</dd>
              <dt>标准扩展</dt>
              <dd>{sourceUsage?.standardExtensionHits ?? 0}</dd>
              <dt>兼容魔改</dt>
              <dd>{sourceUsage?.legacyCompatibleHits ?? 0}</dd>
              <dt>禁止项</dt>
              <dd>{sourceUsage?.forbiddenHits ?? 0}</dd>
            </dl>
          </div>

          <div className="summary-box">
            <h3>Canonical 命中</h3>
            <dl>
              <dt>标准</dt>
              <dd>{canonicalUsage?.standardHits ?? 0}</dd>
              <dt>标准扩展</dt>
              <dd>{canonicalUsage?.standardExtensionHits ?? 0}</dd>
              <dt>兼容魔改</dt>
              <dd>{canonicalUsage?.legacyCompatibleHits ?? 0}</dd>
              <dt>禁止项</dt>
              <dd>{canonicalUsage?.forbiddenHits ?? 0}</dd>
            </dl>
          </div>
        </section>

        <section className="list-card">
          <div className="split-header">
            <div>
              <h3>导出动作</h3>
              <p className="muted">真实走 Pandoc，导出前会自动做 canonicalization。</p>
            </div>
            {lastExport?.outputPath ? (
              <button
                className="ghost-button"
                type="button"
                onClick={() => void revealOutput(lastExport.outputPath)}
              >
                打开导出文件
              </button>
            ) : null}
          </div>

          <div className="button-row">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleExport('html')}
              disabled={busyAction !== 'idle'}
            >
              导出 HTML
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleExport('docx')}
              disabled={busyAction !== 'idle'}
            >
              导出 DOCX
            </button>
          </div>

          {lastExport ? (
            <div className="list-card">
              <strong>最新产物</strong>
              <div>{lastExport.outputPath}</div>
            </div>
          ) : null}
        </section>

        <section className="summary-grid">
          <div className="list-card">
            <h3>Canonical Warnings</h3>
            {activeWarnings.length > 0 ? (
              <ul className="warning-list">
                {activeWarnings.map((warning) => (
                  <li
                    className="warning-item"
                    key={`${warning.rawPath}:${warning.attempted.join('|')}`}
                  >
                    <strong>{warning.rawPath}</strong>
                    <div>{warning.reason}</div>
                    <div>尝试路径：{warning.attempted.length}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">当前没有 unresolved asset warning。</p>
            )}
          </div>

          <div className="list-card">
            <h3>Export Diagnostics</h3>
            {exportDiagnostics.length > 0 ? (
              <ul className="diagnostic-list">
                {exportDiagnostics.map((diagnostic, index) => (
                  <li
                    className="diagnostic-item"
                    key={`${diagnostic.code}:${index}`}
                  >
                    <strong className={getStatusClass(diagnostic.severity)}>
                      {diagnostic.code}
                    </strong>
                    <span>{diagnostic.message}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">导出后会在这里显示 Pandoc 和资源诊断。</p>
            )}
          </div>
        </section>

        <section className="list-card">
          <h3>Canonical Preview</h3>
          <pre className="preview">{previewMarkdown || '还没有生成 canonical 预览。'}</pre>
        </section>
      </div>
    </article>
  )
}
