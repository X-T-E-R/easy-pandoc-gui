export type FormatRuleCategory =
  | 'standard'
  | 'standardExtension'
  | 'legacyCompatible'
  | 'forbidden'

export interface FormatRule {
  id: string
  label: string
  category: FormatRuleCategory
  example: string
  handling: string
}

