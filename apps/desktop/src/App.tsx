import { WorkbenchPanel } from './features/workbench/WorkbenchPanel'
import { HarnessPanel } from './features/harness/HarnessPanel'
import { LogPanel } from './features/logs/LogPanel'
import { RuleMatrixPanel } from './features/compat/RuleMatrixPanel'

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <h1>testPandoc Modern</h1>
        <p>面向大而全重建路线的 Markdown 文档转换工作台。</p>
        <div className="hero-meta">
          <span className="hero-badge">CLI + Harness + Desktop</span>
          <span className="hero-badge">Tauri 2 / React / TypeScript</span>
          <span className="hero-badge">可观测 / 可回归 / 可兼容旧稿件</span>
        </div>

        <section
          aria-label="main-nav"
          className="nav-row"
        >
          <button
            className="ghost-button"
            type="button"
          >
            规则矩阵
          </button>
          <button
            className="ghost-button"
            type="button"
          >
            执行日志
          </button>
          <button
            className="ghost-button"
            type="button"
          >
            Harness
          </button>
        </section>
      </header>

      <section className="content-grid">
        <WorkbenchPanel />
        <div className="stack-column">
          <LogPanel />
          <HarnessPanel />
        </div>
      </section>

      <section
        className="stack-column"
        style={{ marginTop: '20px' }}
      >
        <RuleMatrixPanel />
      </section>
    </main>
  )
}
