import type { Dispatch, SetStateAction } from 'react'

import type { DesktopSettings } from '../workbench/settings'
import type { DesktopUpdateController } from './useDesktopUpdate'

interface UpdatePanelProps {
  settings: DesktopSettings
  setSettings: Dispatch<SetStateAction<DesktopSettings>>
  updateState: DesktopUpdateController
}

function formatBytes(value: number) {
  if (value <= 0) {
    return '0 B'
  }

  if (value < 1024) {
    return `${value} B`
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getPhaseLabel(phase: DesktopUpdateController['phase']) {
  switch (phase) {
    case 'checking':
      return '检查中'
    case 'available':
      return '可更新'
    case 'downloading':
      return '下载中'
    case 'installed':
      return '已启动安装'
    case 'up-to-date':
      return '已最新'
    case 'preview':
      return '预览环境'
    case 'error':
      return '失败'
    default:
      return '待命'
  }
}

export function UpdatePanel({
  settings,
  setSettings,
  updateState
}: UpdatePanelProps) {
  const progressRatio = updateState.contentLength
    ? Math.min(updateState.downloadedBytes / updateState.contentLength, 1)
    : 0

  return (
    <section className="panel update-panel">
      <div className="panel-head">
        <div>
          <p className="section-kicker">Update Center</p>
          <h2>更新中心</h2>
        </div>
        <span
          className={
            updateState.phase === 'available'
              ? 'inline-pill'
              : 'inline-pill inline-pill-subtle'
          }
        >
          {getPhaseLabel(updateState.phase)}
        </span>
      </div>

      <div className="snapshot-grid">
        <div className="status-card">
          <span className="status-label">当前版本</span>
          <strong className="status-value">{updateState.currentVersion}</strong>
        </div>
        <div className="status-card">
          <span className="status-label">可用版本</span>
          <strong className="status-value">
            {updateState.availableVersion ?? '暂无'}
          </strong>
        </div>
      </div>

      <div aria-live="polite" className="status-banner status-banner-compact">
        {updateState.message}
      </div>

      <div className="toolbar toolbar-stacked">
        <button
          className="primary-button"
          type="button"
          onClick={() => void updateState.checkNow()}
          disabled={updateState.phase === 'checking'}
        >
          手动检查更新
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => void updateState.installNow()}
          disabled={updateState.phase !== 'available'}
        >
          立即下载安装
        </button>
      </div>

      <div className="toggle-stack">
        <label className="setting-toggle">
          <input
            checked={settings.autoCheckForUpdates}
            type="checkbox"
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                autoCheckForUpdates: event.target.checked
              }))
            }
          />
          <span className="toggle-copy">
            <strong>启动时自动检查更新</strong>
            <small>默认开启。每次打开应用时先拉一次最新版本信息。</small>
          </span>
        </label>

        <label className="setting-toggle">
          <input
            checked={settings.autoInstallUpdates}
            type="checkbox"
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                autoInstallUpdates: event.target.checked
              }))
            }
          />
          <span className="toggle-copy">
            <strong>发现新版本后自动下载安装</strong>
            <small>开启后会在检查到新版本时直接启动下载和安装流程。</small>
          </span>
        </label>
      </div>

      {updateState.phase === 'downloading' ? (
        <div className="progress-panel">
          <div className="progress-copy">
            <span>下载进度</span>
            <strong>
              {formatBytes(updateState.downloadedBytes)}
              {updateState.contentLength
                ? ` / ${formatBytes(updateState.contentLength)}`
                : ''}
            </strong>
          </div>
          <div aria-hidden="true" className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      <dl className="meta-list">
        <div>
          <dt>最近检查</dt>
          <dd>{updateState.lastCheckedAt ?? '尚未检查'}</dd>
        </div>
        <div>
          <dt>发布日期</dt>
          <dd>{updateState.releaseDate ?? '未知'}</dd>
        </div>
      </dl>

      <div className="notes-block">
        <div className="panel-head panel-head-compact">
          <h3>更新说明</h3>
        </div>
        <pre className="notes-preview">
          {updateState.releaseNotes || '当前还没有拿到 release notes。'}
        </pre>
      </div>
    </section>
  )
}
