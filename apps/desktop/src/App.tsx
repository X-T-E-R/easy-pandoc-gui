import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import { RuleMatrixPanel } from './features/compat/RuleMatrixPanel'
import { HarnessPanel } from './features/harness/HarnessPanel'
import { LogPanel } from './features/logs/LogPanel'
import { UpdatePanel } from './features/updates/UpdatePanel'
import { useDesktopUpdate } from './features/updates/useDesktopUpdate'
import { WorkbenchPanel } from './features/workbench/WorkbenchPanel'
import {
  type DesktopSettings,
  loadDesktopSettings,
  saveDesktopSettings
} from './features/workbench/settings'
import { currentBlockers, harnessSnapshot } from './product-state'

type DesktopView = 'workflow' | 'harness' | 'rules' | 'delivery'

const navItems: Array<{
  id: DesktopView
  label: string
  description: string
}> = [
  {
    id: 'workflow',
    label: '工作台',
    description: '选文件、分析、导出、看诊断。'
  },
  {
    id: 'harness',
    label: '回归',
    description: '看真实样本、warning 和阻塞。'
  },
  {
    id: 'rules',
    label: '规则矩阵',
    description: '区分标准格式、兼容魔改和禁止项。'
  },
  {
    id: 'delivery',
    label: '交付状态',
    description: '跟踪版本、日志和当前收口情况。'
  }
]

function renderView(
  activeView: DesktopView,
  settings: DesktopSettings,
  setSettings: Dispatch<SetStateAction<DesktopSettings>>
) {
  if (activeView === 'harness') {
    return (
      <div className="dashboard-grid">
        <HarnessPanel />
        <LogPanel />
      </div>
    )
  }

  if (activeView === 'rules') {
    return <RuleMatrixPanel />
  }

  if (activeView === 'delivery') {
    return (
      <div className="dashboard-grid dashboard-grid-wide">
        <LogPanel />
        <HarnessPanel />
        <RuleMatrixPanel />
      </div>
    )
  }

  return <WorkbenchPanel settings={settings} setSettings={setSettings} />
}

export default function App() {
  const [activeView, setActiveView] = useState<DesktopView>('workflow')
  const [settings, setSettings] = useState(() => loadDesktopSettings())

  useEffect(() => {
    saveDesktopSettings(settings)
  }, [settings])

  const updateState = useDesktopUpdate({
    autoCheckForUpdates: settings.autoCheckForUpdates,
    autoInstallUpdates: settings.autoInstallUpdates
  })

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <section className="brand-card">
          <p className="brand-caption">Desktop Conversion App</p>
          <h1 className="brand-title">Easy Pandoc GUI</h1>
          <p className="brand-copy">
            不是网页展示页。这里直接围绕文档转换、回归、规则和交付做桌面工作流。
          </p>
          <div className="brand-pills">
            <span className="hero-badge">Tauri 2</span>
            <span className="hero-badge">Updater</span>
            <span className="hero-badge">Harness</span>
          </div>
        </section>

        <nav aria-label="主导航" className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={
                item.id === activeView
                  ? 'nav-button nav-button-active'
                  : 'nav-button'
              }
              type="button"
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>

        <section className="sidebar-card">
          <div className="sidebar-head">
            <h2>最近配置</h2>
            <span className="inline-pill">persistent</span>
          </div>
          <dl className="sidebar-list">
            <div>
              <dt>Markdown</dt>
              <dd>{settings.inputPath || '未选择'}</dd>
            </div>
            <div>
              <dt>最近导出</dt>
              <dd>{settings.lastOutputPath || '暂无'}</dd>
            </div>
            <div>
              <dt>资源目录</dt>
              <dd>{settings.resourceRoots ? '已配置' : '未配置'}</dd>
            </div>
          </dl>
        </section>

        <section className="sidebar-card">
          <div className="sidebar-head">
            <h2>当前阻塞</h2>
            <span className="inline-pill inline-pill-warning">
              {currentBlockers.length}
            </span>
          </div>
          <ul className="compact-list">
            {currentBlockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </section>
      </aside>

      <section className="app-main">
        <header className="app-header">
          <div className="header-copy">
            <p className="section-kicker">Operational Workspace</p>
            <div className="header-title-row">
              <h2>{navItems.find((item) => item.id === activeView)?.label}</h2>
              <span className="inline-pill">
                pass rate {harnessSnapshot.passRate}%
              </span>
            </div>
            <p className="muted">
              当前布局把高频操作放前面，诊断和交付信息放右侧，不再靠一堆平铺卡片硬堆。
            </p>
          </div>

          <div className="header-pills">
            <span className="hero-badge">CLI + Desktop + Release</span>
            <span className="hero-badge">
              update{' '}
              {updateState.availableVersion ?? updateState.currentVersion}
            </span>
            <span className="hero-badge">
              {updateState.phase === 'available' ? '有新版本' : '版本已同步'}
            </span>
          </div>
        </header>

        <div className="stage-scroll">
          <div className="stage-wrap">
            {renderView(activeView, settings, setSettings)}
          </div>
        </div>
      </section>

      <aside className="app-rail">
        <UpdatePanel
          settings={settings}
          setSettings={setSettings}
          updateState={updateState}
        />

        <section className="panel rail-card">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Release Snapshot</p>
              <h2>交付概况</h2>
            </div>
          </div>

          <div className="snapshot-grid">
            <div className="status-card">
              <span className="status-label">回归通过率</span>
              <strong className="status-value">
                {harnessSnapshot.passRate}%
              </strong>
            </div>
            <div className="status-card">
              <span className="status-label">Warnings</span>
              <strong className="status-value">
                {harnessSnapshot.warningCases}
              </strong>
            </div>
            <div className="status-card">
              <span className="status-label">通过样本</span>
              <strong className="status-value">
                {harnessSnapshot.passedCases}
              </strong>
            </div>
            <div className="status-card">
              <span className="status-label">状态</span>
              <strong className="status-value">{harnessSnapshot.status}</strong>
            </div>
          </div>
        </section>
      </aside>
    </main>
  )
}
