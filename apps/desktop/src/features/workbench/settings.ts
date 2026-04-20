export interface DesktopSettings {
  inputPath: string
  bibliographyPath: string
  referenceDocPath: string
  resourceRoots: string
  pandocPath: string
  sectionTitle: string
  lastOutputPath: string
  lastExportMode: 'html' | 'docx'
  autoCheckForUpdates: boolean
  autoInstallUpdates: boolean
}

const STORAGE_KEY = 'easy-pandoc-gui.desktop-settings'

export const defaultDesktopSettings: DesktopSettings = {
  inputPath: '',
  bibliographyPath: '',
  referenceDocPath: '',
  resourceRoots: '',
  pandocPath: '',
  sectionTitle: '参考文献',
  lastOutputPath: '',
  lastExportMode: 'docx',
  autoCheckForUpdates: true,
  autoInstallUpdates: false
}

export function loadDesktopSettings(): DesktopSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultDesktopSettings
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultDesktopSettings
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DesktopSettings>
    return {
      ...defaultDesktopSettings,
      ...parsed
    }
  } catch {
    return defaultDesktopSettings
  }
}

export function saveDesktopSettings(settings: DesktopSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function parseResourceRoots(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}
