import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export interface EnvironmentDoctorCheck {
  id: string
  status: 'ok' | 'missing' | 'error'
  detail: string
}

export interface EnvironmentDoctorResult {
  status: 'success' | 'warning' | 'error'
  checks: EnvironmentDoctorCheck[]
}

export interface EnvironmentDoctorInput {
  pandocPath?: string
}

export interface DoctorProcessRunner {
  execFile: (command: string, args: string[]) => Promise<{ stdout: string; stderr: string }>
}

const execFileAsync = promisify(execFile)

const defaultProcessRunner: DoctorProcessRunner = {
  execFile: async (command, args) => {
    const result = await execFileAsync(command, args)

    return {
      stdout: result.stdout,
      stderr: result.stderr
    }
  }
}

export async function runEnvironmentDoctor(
  input: EnvironmentDoctorInput = {},
  processRunner: DoctorProcessRunner = defaultProcessRunner
): Promise<EnvironmentDoctorResult> {
  const checks = await Promise.all([
    checkExecutable('pandoc', input.pandocPath ?? 'pandoc', processRunner),
    checkExecutable('rsvg-convert', 'rsvg-convert', processRunner)
  ])

  return {
    status: checks.every((entry) => entry.status === 'ok') ? 'success' : 'warning',
    checks
  }
}

async function checkExecutable(
  id: string,
  command: string,
  processRunner: DoctorProcessRunner
): Promise<EnvironmentDoctorCheck> {
  try {
    const result = await processRunner.execFile(command, ['--version'])
    const detail = firstNonEmptyLine(result.stdout) ?? firstNonEmptyLine(result.stderr) ?? 'available'

    return {
      id,
      status: 'ok',
      detail
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const status = /ENOENT/i.test(detail) ? 'missing' : 'error'

    return {
      id,
      status,
      detail
    }
  }
}

function firstNonEmptyLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0)
}
