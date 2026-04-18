const BODY_OPEN = '<w:body>'
const BODY_CLOSE = '</w:body>'

export function extractWordBody(xml: string): string {
  const start = xml.indexOf(BODY_OPEN)
  const end = xml.indexOf(BODY_CLOSE)

  if (start === -1 || end === -1) {
    throw new Error('Missing w:body node')
  }

  return xml.slice(start, end + BODY_CLOSE.length)
}

