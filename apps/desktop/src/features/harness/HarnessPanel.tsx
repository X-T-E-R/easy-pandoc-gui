import { currentBlockers, harnessSnapshot } from '../../product-state'

export function HarnessPanel() {
  return (
    <article>
      <h2>Harness</h2>
      <p>这里展示最近一轮回归摘要和当前阻塞，不再只是占位说明。</p>

      <dl>
        <div>
          <dt>Pass Rate</dt>
          <dd>{harnessSnapshot.summary.passRate}%</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{harnessSnapshot.summary.status}</dd>
        </div>
        <div>
          <dt>Passed</dt>
          <dd>{harnessSnapshot.counts.passed}</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{harnessSnapshot.counts.warnings}</dd>
        </div>
      </dl>

      <h3>当前阻塞</h3>
      <ul>
        {currentBlockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
    </article>
  )
}
