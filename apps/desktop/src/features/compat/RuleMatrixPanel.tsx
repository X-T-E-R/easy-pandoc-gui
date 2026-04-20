import { ruleSections } from '../../product-state'

export function RuleMatrixPanel() {
  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Format Registry</p>
          <h2>规则矩阵</h2>
        </div>
      </div>
      <p className="panel-description">
        标准格式、标准扩展、兼容魔改和禁止项都直接来自共享 registry。
      </p>

      <div className="rule-matrix">
        {ruleSections.map((section) => (
          <section
            key={section.key}
            aria-label={section.label}
            className="rule-section"
          >
            <h3>
              {section.label} ({section.rules.length})
            </h3>
            <ul className="rule-list">
              {section.rules.map((rule) => (
                <li className="rule-item" key={rule.id}>
                  <div className="phase-row">
                    <strong>{rule.id}</strong>
                    <span className="inline-pill inline-pill-subtle">
                      {rule.handling}
                    </span>
                  </div>
                  <div>{rule.label}</div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  )
}
