import {
  currentBlockers,
  harnessSnapshot,
  recentHarnessCases
} from '../../product-state'

export function HarnessPanel() {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Regression Harness</p>
          <h2>Harness</h2>
        </div>
      </div>
      <p className="panel-description">
        这里直接看最近一轮真实回归，不是静态说明页。
      </p>

      <dl className="snapshot-grid">
        <div className="status-card">
          <dt>Pass Rate</dt>
          <dd>{harnessSnapshot.passRate}%</dd>
        </div>
        <div className="status-card">
          <dt>Status</dt>
          <dd>{harnessSnapshot.status}</dd>
        </div>
        <div className="status-card">
          <dt>Passed</dt>
          <dd>{harnessSnapshot.passedCases}</dd>
        </div>
        <div className="status-card">
          <dt>Warnings</dt>
          <dd>{harnessSnapshot.warningCases}</dd>
        </div>
      </dl>

      <h3>最近样本</h3>
      <ul className="case-list">
        {recentHarnessCases.map((entry) => (
          <li className="case-item" key={entry.id}>
            <div className="phase-row">
              <strong>{entry.id}</strong>
              <span className="inline-pill inline-pill-subtle">
                {entry.status}
              </span>
            </div>
            <div>warnings {entry.warnings}</div>
            <div>diagnostics {entry.diagnostics}</div>
            <div className="muted">{entry.outputPath}</div>
          </li>
        ))}
      </ul>

      <h3>当前阻塞</h3>
      <ul className="compact-list blocker-list">
        {currentBlockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
    </article>
  )
}
