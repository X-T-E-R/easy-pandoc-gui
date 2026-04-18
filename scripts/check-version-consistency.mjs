import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const expectedTag = parseExpectedTag(process.argv.slice(2))

const files = [
  {
    label: 'root package',
    path: 'package.json',
    readVersion: (content) => JSON.parse(content).version
  },
  {
    label: 'desktop package',
    path: 'apps/desktop/package.json',
    readVersion: (content) => JSON.parse(content).version
  },
  {
    label: 'tauri config',
    path: 'apps/desktop/src-tauri/tauri.conf.json',
    readVersion: (content) => JSON.parse(content).version
  }
]

const versions = files.map((entry) => {
  const absolutePath = path.join(repoRoot, entry.path)
  const content = fs.readFileSync(absolutePath, 'utf8')
  return {
    ...entry,
    version: entry.readVersion(content)
  }
})

const uniqueVersions = Array.from(
  new Set(versions.map((entry) => entry.version))
)

if (uniqueVersions.length !== 1) {
  console.error('Version mismatch detected:')
  for (const entry of versions) {
    console.error(`- ${entry.label}: ${entry.version} (${entry.path})`)
  }
  process.exit(1)
}

const version = uniqueVersions[0]
const tag = `v${version}`

if (expectedTag && expectedTag !== tag) {
  console.error(
    `Tag mismatch: expected ${tag} from version ${version}, got ${expectedTag}`
  )
  process.exit(1)
}

console.log(`Version check passed: ${version}`)
if (expectedTag) {
  console.log(`Tag check passed: ${expectedTag}`)
}

function parseExpectedTag(argv) {
  const flagIndex = argv.findIndex((entry) => entry === '--tag')
  if (flagIndex === -1) {
    return undefined
  }

  return argv[flagIndex + 1]
}
