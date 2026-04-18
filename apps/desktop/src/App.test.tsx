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
})
