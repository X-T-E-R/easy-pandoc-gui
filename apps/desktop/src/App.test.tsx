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

    expect(
      screen.getAllByText('absolute-personal-path').length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('Track A').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText('缺少 rsvg-convert，SVG 图片转 DOCX 仍有环境依赖')
        .length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText('master-draft-docx').length).toBeGreaterThan(0)
  })

  test('shows real workbench actions for document processing', () => {
    render(<App />)

    expect(
      screen.getByRole('button', { name: '选择 Markdown' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '分析当前文档' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '导出 HTML' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '导出 DOCX' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '环境检查' })
    ).toBeInTheDocument()
    expect(screen.getByText('最近配置')).toBeInTheDocument()
  })
})
