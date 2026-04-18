import { formatRegistry } from '../../../packages/core/src/format-registry'
import latestHarnessReport from '../../../fixtures/real-world/harness-report.json'

export const ruleSections = [
  {
    key: 'standard',
    label: '标准格式',
    rules: formatRegistry.standard
  },
  {
    key: 'standardExtension',
    label: '标准扩展',
    rules: formatRegistry.standardExtension
  },
  {
    key: 'legacyCompatible',
    label: '兼容魔改',
    rules: formatRegistry.legacyCompatible
  },
  {
    key: 'forbidden',
    label: '禁止项',
    rules: formatRegistry.forbidden
  }
] as const

export const deliveryPhases = [
  {
    id: 'Track A',
    title: 'Real Desktop Productization',
    status: 'in-progress',
    description:
      '当前正在把桌面端升级成真正的 Tauri 2 产品壳，并接入真实文件/导出链。'
  },
  {
    id: 'Track B',
    title: 'Backend Command Layer And Persistence',
    status: 'in-progress',
    description:
      'Rust 命令层负责读文件、跑 Pandoc、做 doctor；最近配置会持久化保存。'
  },
  {
    id: 'Track C',
    title: 'Product Workflow, Diagnostics, And Observability',
    status: 'in-progress',
    description:
      'UI 正在直接展示 inspect、canonical warning、export diagnostics 和环境阻塞。'
  },
  {
    id: 'Track D',
    title: 'Release Readiness And Delivery Boundary',
    status: 'pending',
    description: '最后收 README、打包说明、交付边界和已知风险。'
  }
] as const

export const harnessSnapshot = latestHarnessReport.summary

export const recentHarnessCases = latestHarnessReport.cases.map((entry) => ({
  id: entry.id,
  status: entry.status,
  outputPath: entry.outputPath,
  diagnostics: entry.diagnostics.length,
  warnings: entry.warnings.length
}))

export const currentBlockers = [
  '缺少 rsvg-convert，SVG 图片转 DOCX 仍有环境依赖',
  '总稿_V2.1.md 仍有 1 条独立 <center> 表题注需要结构化收口',
  '总稿_V2.1.md 中多条原始绝对图片路径对应源文件缺失，当前只能保留 warning'
] as const
