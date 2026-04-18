export function transformLegacyMarkdown(input: string): string {
  return input.replace(
    /!\[(.*?)\]\((.*?)\)\s*<center>(.*?)<\/center>/gs,
    (_match: string, _alt: string, path: string, caption: string) =>
      `![${caption.trim()}](${path.trim()})`
  )
}
