import { deliveryPhases } from '../../product-state'

export function LogPanel() {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Delivery Flow</p>
          <h2>执行日志</h2>
        </div>
      </div>
      <p className="panel-description">
        这里先展示当前产品化阶段，不再只有一句占位说明。
      </p>

      <ol className="phase-list">
        {deliveryPhases.map((phase) => (
          <li className="phase-item" key={phase.id}>
            <div className="phase-row">
              <strong>{phase.id}</strong>
              <span className="inline-pill inline-pill-subtle">
                {phase.status}
              </span>
            </div>
            <div className="phase-title">{phase.title}</div>
            <div className="phase-description">{phase.description}</div>
          </li>
        ))}
      </ol>
    </article>
  )
}
