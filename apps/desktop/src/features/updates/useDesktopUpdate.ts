import { useEffect, useEffectEvent, useRef, useState } from 'react'

import {
  checkForUpdates,
  installUpdate,
  type DesktopUpdateCheckResult,
  type DesktopUpdateDownloadEvent
} from '../workbench/backend'

type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'preview'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'installed'
  | 'error'

interface UseDesktopUpdateOptions {
  autoCheckForUpdates: boolean
  autoInstallUpdates: boolean
}

export interface DesktopUpdateController {
  phase: UpdatePhase
  message: string
  currentVersion: string
  availableVersion: string | null
  releaseNotes: string | null
  releaseDate: string | null
  lastCheckedAt: string | null
  downloadedBytes: number
  contentLength: number | null
  checkNow: () => Promise<void>
  installNow: () => Promise<void>
}

function getCheckMessage(result: DesktopUpdateCheckResult) {
  if (result.currentVersion === 'preview') {
    return '当前是浏览器预览环境，更新检查会降级成占位结果。'
  }

  if (result.available && result.version) {
    return `发现新版本 ${result.version}，可以直接下载安装。`
  }

  return `当前已经是最新版本 ${result.currentVersion}。`
}

export function useDesktopUpdate({
  autoCheckForUpdates,
  autoInstallUpdates
}: UseDesktopUpdateOptions): DesktopUpdateController {
  const [phase, setPhase] = useState<UpdatePhase>('idle')
  const [message, setMessage] = useState('启动后会在这里展示更新状态。')
  const [currentVersion, setCurrentVersion] = useState('loading')
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string | null>(null)
  const [releaseDate, setReleaseDate] = useState<string | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [contentLength, setContentLength] = useState<number | null>(null)
  const autoCheckLockRef = useRef(false)
  const installLockRef = useRef(false)

  const performInstall = useEffectEvent(async () => {
    if (installLockRef.current) {
      return
    }

    installLockRef.current = true
    setPhase('downloading')
    setDownloadedBytes(0)
    setMessage('正在下载安装更新。')

    try {
      await installUpdate((event: DesktopUpdateDownloadEvent) => {
        if (event.event === 'Started') {
          setContentLength(event.data.contentLength)
          setDownloadedBytes(0)
          setMessage('更新下载已开始。')
          return
        }

        if (event.event === 'Progress') {
          setContentLength(event.data.contentLength)
          setDownloadedBytes((current) => current + event.data.chunkLength)
          return
        }

        setMessage('更新包下载完成，正在交给安装器。')
      })

      setPhase('installed')
      setAvailableVersion(null)
      setMessage(
        '更新安装流程已经启动。Windows 会交给安装器完成替换，macOS / Linux 会在安装后自动重启。'
      )
    } catch (error) {
      setPhase('error')
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      installLockRef.current = false
    }
  })

  const performCheck = useEffectEvent(async () => {
    if (phase === 'checking' || installLockRef.current) {
      return
    }

    setPhase('checking')
    setMessage('正在检查最新版本。')

    try {
      const result = await checkForUpdates()
      const now = new Date().toLocaleString('zh-CN', {
        hour12: false
      })

      setCurrentVersion(result.currentVersion)
      setAvailableVersion(result.version)
      setReleaseNotes(result.body)
      setReleaseDate(result.date)
      setLastCheckedAt(now)
      setContentLength(null)
      setDownloadedBytes(0)
      setMessage(getCheckMessage(result))

      if (result.currentVersion === 'preview') {
        setPhase('preview')
        return
      }

      if (!result.available) {
        setPhase('up-to-date')
        return
      }

      setPhase('available')

      if (autoInstallUpdates) {
        await performInstall()
      }
    } catch (error) {
      setPhase('error')
      setMessage(error instanceof Error ? error.message : String(error))
    }
  })

  useEffect(() => {
    if (!autoCheckForUpdates) {
      autoCheckLockRef.current = false
      return
    }

    if (autoCheckLockRef.current) {
      return
    }

    autoCheckLockRef.current = true
    void performCheck()
  }, [autoCheckForUpdates, performCheck])

  return {
    phase,
    message,
    currentVersion,
    availableVersion,
    releaseNotes,
    releaseDate,
    lastCheckedAt,
    downloadedBytes,
    contentLength,
    checkNow: performCheck,
    installNow: performInstall
  }
}
