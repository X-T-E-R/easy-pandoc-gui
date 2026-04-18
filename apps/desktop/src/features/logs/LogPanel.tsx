import { deliveryPhases } from '../../product-state'

export function LogPanel() {
  return (
    <article>
      <h2>执行日志</h2>
      <p>当前展示的是交付收口阶段，后续会接真实 execution log 流。</p>

      <ol>
        {deliveryPhases.map((phase) => (
          <li key={phase.id}>
            <strong>{phase.id}</strong> · {phase.title} · {phase.status}
            <div>{phase.description}</div>
          </li>
        ))}
      </ol>
    </article>
  )
}
