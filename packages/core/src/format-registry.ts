import type { FormatRule } from './types'

const standard: FormatRule[] = [
  {
    id: 'pandoc-citation',
    label: 'Pandoc citation syntax',
    category: 'standard',
    example: '[@key]',
    handling: 'accept'
  },
  {
    id: 'markdown-image-caption',
    label: 'Markdown image caption',
    category: 'standard',
    example: '![图 1 示例](img.png)',
    handling: 'accept'
  }
]

const standardExtension: FormatRule[] = [
  {
    id: 'image-attributes',
    label: 'Pandoc image attributes',
    category: 'standardExtension',
    example: '![图](img.png){width=50%}',
    handling: 'accept'
  }
]

const legacyCompatible: FormatRule[] = [
  {
    id: 'image-center-caption',
    label: 'Image plus center caption',
    category: 'legacyCompatible',
    example: '![img](a.png)\\n<center>图 1</center>',
    handling: 'rewrite-and-warn'
  },
  {
    id: 'center-caption-block',
    label: 'Standalone center caption block',
    category: 'legacyCompatible',
    example: '<center>表 2.1 ...</center>',
    handling: 'warn'
  },
  {
    id: 'math-tag',
    label: 'Math with explicit tag',
    category: 'legacyCompatible',
    example: '$$ a = b \\\\tag{2} $$',
    handling: 'rewrite-and-warn'
  }
]

const forbidden: FormatRule[] = [
  {
    id: 'absolute-personal-path',
    label: 'Absolute personal path',
    category: 'forbidden',
    example: 'C:\\\\Users\\\\xxoy1\\\\...',
    handling: 'error'
  }
]

export const formatRegistry = {
  standard,
  standardExtension,
  legacyCompatible,
  forbidden
} as const
