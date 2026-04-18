export function transformLegacyMarkdown(input: string): string {
  const withCanonicalCaptions = input.replace(
    /!\[(.*?)\]\((.*?)\)\s*<center>(.*?)<\/center>/gs,
    (_match: string, _alt: string, path: string, caption: string) =>
      `![${caption.trim()}](${path.trim()})`
  )

  return withCanonicalCaptions.replace(
    /\$\$(.*?)\\tag\{(.*?)\}\s*\$\$/gs,
    (_match: string, body: string, tag: string) =>
      `$$${body.replace(/\\\s*$/, '').trim()}$$ {#eq:${tag.trim()}}`
  )
}
