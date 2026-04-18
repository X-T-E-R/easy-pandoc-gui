import { HarnessPanel } from './features/harness/HarnessPanel'
import { LogPanel } from './features/logs/LogPanel'
import { RuleMatrixPanel } from './features/compat/RuleMatrixPanel'

export default function App() {
  return (
    <main>
      <header>
        <h1>testPandoc Modern</h1>
        <p>面向大而全重建路线的 Markdown 文档转换工作台。</p>
      </header>

      <section aria-label="main-nav">
        <button type="button">规则矩阵</button>
        <button type="button">执行日志</button>
        <button type="button">Harness</button>
      </section>

      <section>
        <RuleMatrixPanel />
        <LogPanel />
        <HarnessPanel />
      </section>
    </main>
  )
}

