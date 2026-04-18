import { formatRegistry } from '../../../packages/core/src/format-registry'
import { createHarnessRunSummary } from '../../../packages/harness/src/report'

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
    id: 'Phase 1',
    title: 'Canonicalization And Resource Resolution',
    status: 'in-progress',
    description: '统一 legacy rewrite、资源定位和 unresolved asset warning。'
  },
  {
    id: 'Phase 2',
    title: 'Harness Manifest And Regression Reports',
    status: 'in-progress',
    description: 'CLI 已接入 manifest 驱动 harness，下一步扩到真实样本报告。'
  },
  {
    id: 'Phase 3',
    title: 'Desktop Workbench',
    status: 'in-progress',
    description: '桌面端开始直接承载规则矩阵、交付阶段和 harness 摘要。'
  },
  {
    id: 'Phase 4',
    title: 'Packaging, Observability, Release Readiness',
    status: 'pending',
    description: '后续收口发布清单、环境依赖和打包交付说明。'
  }
] as const

export const harnessSnapshot = {
  counts: {
    passed: 2,
    failed: 0,
    warnings: 1
  },
  summary: createHarnessRunSummary({
    passed: 2,
    failed: 0,
    warnings: 1
  })
}

export const currentBlockers = [
  '缺少 rsvg-convert，SVG 图片转 DOCX 仍有环境依赖',
  '总稿_V2.1.md 仍有 1 条独立 <center> 表题注需要结构化收口',
  '总稿_V2.1.md 中多条原始绝对图片路径对应源文件缺失，当前只能保留 warning'
] as const
