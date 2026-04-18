import { ruleSections } from '../../product-state'

export function RuleMatrixPanel() {
  return (
    <article>
      <h2>规则矩阵</h2>
      <p>标准格式、标准扩展、兼容魔改和禁止项直接来自共享 registry。</p>

      {ruleSections.map((section) => (
        <section key={section.key} aria-label={section.label}>
          <h3>
            {section.label} ({section.rules.length})
          </h3>
          <ul>
            {section.rules.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.id}</strong> · {rule.label} · {rule.handling}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}
