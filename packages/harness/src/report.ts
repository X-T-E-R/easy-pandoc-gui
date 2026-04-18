export interface HarnessRunInput {
  passed: number
  failed: number
  warnings: number
}

export interface HarnessRunSummary {
  passRate: number
  status: 'success' | 'warning' | 'error'
}

export function createHarnessRunSummary(input: HarnessRunInput): HarnessRunSummary {
  const total = input.passed + input.failed
  const passRate = total === 0 ? 0 : Math.round((input.passed / total) * 100)

  if (input.failed > 0) {
    return {
      passRate,
      status: input.warnings > 0 ? 'warning' : 'error'
    }
  }

  return {
    passRate,
    status: input.warnings > 0 ? 'warning' : 'success'
  }
}

