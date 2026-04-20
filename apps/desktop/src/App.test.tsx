// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test } from 'vitest'

import App from './App'
import type { DesktopSettings } from './features/workbench/settings'

describe('desktop app shell', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('shows desktop navigation and update center instead of placeholder nav', () => {
    render(<App />)

    expect(
      screen.getByRole('button', {
        name: '工作台 选文件、分析、导出、看诊断。'
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '回归 看真实样本、warning 和阻塞。' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '更新中心' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '手动检查更新' })
    ).toBeInTheDocument()
  })

  test('switches views through the desktop navigation', () => {
    render(<App />)

    fireEvent.click(
      screen.getAllByRole('button', {
        name: '规则矩阵 区分标准格式、兼容魔改和禁止项。'
      })[0]
    )

    expect(
      screen.getByRole('heading', { name: /标准格式/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /兼容魔改/i })
    ).toBeInTheDocument()
  })

  test('persists update settings through localStorage', async () => {
    render(<App />)

    const autoInstallToggle = screen.getAllByRole('checkbox', {
      name: /发现新版本后自动下载安装/i
    })[0]
    fireEvent.click(autoInstallToggle)

    await waitFor(() => {
      const storedSettings = JSON.parse(
        window.localStorage.getItem('easy-pandoc-gui.desktop-settings') ?? '{}'
      ) as Partial<DesktopSettings>

      expect(storedSettings.autoInstallUpdates).toBe(true)
    })
  })

  test('shows preview update status in browser test runtime', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getAllByText(/浏览器预览环境/).length).toBeGreaterThan(0)
    })
  })
})
