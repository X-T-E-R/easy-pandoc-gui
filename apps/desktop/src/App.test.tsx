// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import App from './App'

describe('desktop app shell', () => {
  test('shows rule matrix and execution log entry points', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: '规则矩阵' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '执行日志' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Harness' })).toBeInTheDocument()
  })

  test('shows live product delivery data instead of placeholder copy', () => {
    render(<App />)

    expect(screen.getAllByText('absolute-personal-path').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Phase 1').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('缺少 rsvg-convert，SVG 图片转 DOCX 仍有环境依赖').length
    ).toBeGreaterThan(0)
  })
})
