import {
  startTransition,
  type Dispatch,
  type SetStateAction,
  useState
} from 'react'

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
import { parseResourceRoots, type DesktopSettings } from './settings'

type BusyAction = 'idle' | 'loading' | 'export-html' | 'export-docx' | 'doctor'

function getStatusClass(
  status?: 'success' | 'warning' | 'error' | 'ok' | 'missing'
) {
  if (status === 'success' || status === 'ok') {
    return 'status-success'
  }

  if (status === 'error' || status === 'missing') {
    return 'status-error'
  }

  return 'status-warning'
}

function formatExportMode(mode: 'html' | 'docx') {
  return mode === 'docx' ? 'DOCX' : 'HTML'
}

interface WorkbenchPanelProps {
  settings: DesktopSettings
  setSettings: Dispatch<SetStateAction<DesktopSettings>>
}

export function WorkbenchPanel({ settings, setSettings }: WorkbenchPanelProps) {
  const [document, setDocument] = useState<DesktopLoadDocumentResult | null>(
    null
  )
  const [doctorResult, setDoctorResult] = useState<DesktopDoctorResult | null>(
    null
  )
  const [lastExport, setLastExport] = useState<DesktopExportResult | null>(null)
  const [busyAction, setBusyAction] = useState<BusyAction>('idle')
  const [feedback, setFeedback] = useState<string>(
    '先选一份 Markdown，再开始分析和导出。'
  )

  const sourceUsage = document ? analyzeMarkdownUsage(document.source) : null
  const canonicalUsage = document
    ? analyzeMarkdownUsage(document.canonicalMarkdown)
    : null

  const exportDiagnostics = lastExport?.diagnostics ?? []
  const activeWarnings = lastExport?.warnings ?? document?.warnings ?? []
  const previewMarkdown =
    lastExport?.canonicalMarkdown ?? document?.canonicalMarkdown ?? ''
  const activeAssetSummary = lastExport?.assetSummary ?? document?.assetSummary

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
        setFeedback(`已载入 ${path}`)
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

  return (
    <article className="workbench-shell">
      <section className="panel stage-card stage-card-hero">
        <div className="stage-header">
          <div>
            <p className="section-kicker">Document Workflow</p>
            <h2>文档工作台</h2>
            <p className="muted">
              把选择文件、分析、导出、资源警告和 Pandoc
              诊断放进一条顺手的桌面工作流。
            </p>
          </div>
          <div aria-live="polite" className="status-banner">
            {feedback}
          </div>
        </div>

        <div className="toolbar">
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
            重新分析
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => void handleExport('docx')}
            disabled={busyAction !== 'idle'}
          >
            导出 DOCX
          </button>
          <button
            className="ghost-button"
            type="button"
            onClick={() => void handleExport('html')}
            disabled={busyAction !== 'idle'}
          >
            导出 HTML
          </button>
          {lastExport?.outputPath ? (
            <button
              className="ghost-button"
              type="button"
              onClick={() => void revealOutput(lastExport.outputPath)}
            >
              打开导出文件
            </button>
          ) : null}
          <button
            className="ghost-button"
            type="button"
            onClick={() => void refreshDoctor(settings.pandocPath)}
            disabled={busyAction !== 'idle'}
          >
            刷新环境检查
          </button>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-label">当前文档</span>
            <strong className="metric-value">
              {document ? '已载入' : '未选择'}
            </strong>
            <span
              className="path-chip"
              title={settings.inputPath || '未选择文件'}
            >
              {settings.inputPath || '还没有选择 Markdown 文件'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">资源状态</span>
            <strong className="metric-value">
              {activeAssetSummary?.resolved ?? 0}/
              {activeAssetSummary?.inspected ?? 0}
            </strong>
            <span className="muted">
              unresolved {activeAssetSummary?.unresolved ?? 0}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">最近导出</span>
            <strong className="metric-value">
              {lastExport ? formatExportMode(settings.lastExportMode) : '暂无'}
            </strong>
            <span
              className="path-chip"
              title={settings.lastOutputPath || '还没有导出产物'}
            >
              {settings.lastOutputPath || '还没有导出产物'}
            </span>
          </div>

          <div className="metric-card">
            <span className="metric-label">环境检查</span>
            <strong
              className={`metric-value ${getStatusClass(doctorResult?.status)}`}
            >
              {doctorResult?.status ?? 'pending'}
            </strong>
            <span className="muted">
              {busyAction === 'doctor' ? '正在检查…' : 'Pandoc / SVG 转换器'}
            </span>
          </div>
        </div>
      </section>

      <div className="workbench-columns">
        <section className="panel stage-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Paths & Templates</p>
              <h3>输入和模板</h3>
            </div>
            <div className="toolbar toolbar-compact">
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
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="bibliographyPath">Bibliography</label>
              <input
                autoComplete="off"
                id="bibliographyPath"
                name="bibliographyPath"
                value={settings.bibliographyPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    bibliographyPath: event.target.value
                  }))
                }
                placeholder="可选，.bib / CSL JSON…"
              />
              <div className="field-hint">需要 citeproc 时填这里。</div>
            </div>

            <div className="field">
              <label htmlFor="referenceDocPath">Reference Doc</label>
              <input
                autoComplete="off"
                id="referenceDocPath"
                name="referenceDocPath"
                value={settings.referenceDocPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    referenceDocPath: event.target.value
                  }))
                }
                placeholder="可选，Word 模板 .docx…"
              />
              <div className="field-hint">
                DOCX 导出时会注入 `--reference-doc`。
              </div>
            </div>

            <div className="field">
              <label htmlFor="pandocPath">Pandoc Path</label>
              <input
                autoComplete="off"
                id="pandocPath"
                name="pandocPath"
                value={settings.pandocPath}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    pandocPath: event.target.value
                  }))
                }
                placeholder="默认走系统 PATH 里的 pandoc…"
              />
            </div>

            <div className="field">
              <label htmlFor="sectionTitle">Reference Section Title</label>
              <input
                autoComplete="off"
                id="sectionTitle"
                name="sectionTitle"
                value={settings.sectionTitle}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sectionTitle: event.target.value
                  }))
                }
                placeholder="参考文献…"
              />
            </div>

            <div className="field field-span">
              <label htmlFor="resourceRoots">Resource Roots</label>
              <textarea
                autoComplete="off"
                id="resourceRoots"
                name="resourceRoots"
                value={settings.resourceRoots}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    resourceRoots: event.target.value
                  }))
                }
                placeholder="一行一个资源目录；可填附件目录、图片目录、项目根目录…"
              />
              <div className="field-hint">
                多个目录用换行分隔，分析和导出都会参与资源解析。
              </div>
            </div>
          </div>
        </section>

        <section className="panel stage-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Doctor</p>
              <h3>环境检查</h3>
            </div>
          </div>

          <div className="two-column-list">
            {(doctorResult?.checks ?? []).map((check) => (
              <div className="status-card" key={check.id}>
                <span className="status-label">{check.id}</span>
                <strong
                  className={`status-value ${getStatusClass(check.status)}`}
                >
                  {check.status}
                </strong>
                <div>{check.detail}</div>
              </div>
            ))}
            {!doctorResult ? (
              <div className="empty-state">
                还没有执行环境检查。点“刷新环境检查”获取真实结果。
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="workbench-columns">
        <section className="panel stage-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Source Metrics</p>
              <h3>原稿 vs Canonical</h3>
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-box">
              <h4>原稿命中</h4>
              <dl className="summary-table">
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
              <h4>Canonical 命中</h4>
              <dl className="summary-table">
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
          </div>
        </section>

        <section className="panel stage-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Export Diagnostics</p>
              <h3>导出反馈</h3>
            </div>
          </div>

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
            <div className="empty-state">
              导出后会把 Pandoc warning 和 error 结构化显示在这里。
            </div>
          )}
        </section>
      </div>

      <div className="workbench-columns">
        <section className="panel stage-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Resource Warnings</p>
              <h3>资源警告</h3>
            </div>
          </div>

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
            <div className="empty-state">
              当前没有 unresolved asset warning。
            </div>
          )}
        </section>

        <section className="panel stage-card preview-card">
          <div className="stage-header">
            <div>
              <p className="section-kicker">Canonical Preview</p>
              <h3>预处理结果</h3>
            </div>
          </div>
          <pre className="preview">
            {previewMarkdown || '还没有生成 canonical 预览。'}
          </pre>
        </section>
      </div>
    </article>
  )
}
