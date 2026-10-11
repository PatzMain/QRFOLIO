import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve, relative, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const hash = value => createHash('sha256').update(value).digest('hex')
const normalize = value => value.toString().replace(/\r\n/g, '\n').trim()
const check = (condition, message) => { if (!condition) errors.push(message) }
const read = name => {
  const path = resolve(root, name)
  const local = relative(root, path)
  if (local.startsWith('..') || isAbsolute(local)) throw new Error(`Path outside repository: ${name}`)
  return readFileSync(path)
}

try {
  const lockBytes = read('package-lock.json')
  const lock = JSON.parse(lockBytes)
  const inventory = JSON.parse(read('public/third-party/inventory.json'))
  check(inventory.schema === 1, 'Unsupported notice inventory schema')
  check(hash(lockBytes) === inventory.packageLockSha256, 'Lockfile changed: review dependencies and update the distribution inventory')

  const licenses = read('public/third-party/LICENSES.txt')
  const embedded = read('public/third-party/EMBEDDED-NOTICES.txt')
  for (const aggregate of inventory.aggregateFiles) {
    check(hash(read(`public/third-party/${aggregate.path}`)) === aggregate.sha256, `Retained notice hash mismatch: ${aggregate.path}`)
  }

  const recorded = new Map(inventory.packages.map(pkg => [pkg.name, pkg]))
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path || entry.dev || entry.devOptional || entry.link) continue
    const name = path.split('node_modules/').at(-1)
    check(recorded.get(name)?.version === entry.version, `Production dependency absent or stale in inventory: ${name}@${entry.version}`)
  }
  for (const pkg of inventory.packages) {
    const locked = lock.packages[`node_modules/${pkg.name}`]
    const installed = JSON.parse(read(`node_modules/${pkg.name}/package.json`))
    check(locked?.version === pkg.version && locked?.integrity === pkg.integrity, `Locked package mismatch: ${pkg.name}`)
    check(installed.version === pkg.version, `Installed package mismatch: ${pkg.name}`)
    check(installed.license === pkg.declaredLicense, `Declared license changed: ${pkg.name}`)
    for (const text of pkg.texts) {
      const bytes = read(text.path)
      check(hash(bytes) === text.sha256 && bytes.length === text.bytes, `Publisher notice mismatch: ${text.path}`)
      check(normalize(licenses).includes(normalize(bytes)), `Publisher notice missing from LICENSES.txt: ${text.path}`)
    }
  }

  for (const notice of inventory.embeddedNotices) {
    const source = read(notice.source).toString()
    const comments = [
      ...(source.match(/\/\*[\s\S]*?\*\//g) ?? []),
      ...(source.match(/^\/\/[^\r\n]*(?:\r?\n\/\/[^\r\n]*)*/gm) ?? []),
    ].flatMap(block => [block, `${block}\n`, `${block}\r\n`, `${block}\n\n`])
    const comment = comments.find(block => hash(block) === notice.sha256)
    check(Boolean(comment), `Embedded notice changed: ${notice.source} (${notice.sha256.slice(0, 12)})`)
    if (comment) check(normalize(embedded).includes(normalize(comment)), `Embedded notice missing from retained text: ${notice.source}`)
  }

  const sections = licenses.toString().split(/^===== .* =====\r?\n/gm).slice(1)
  const retainedHash = digest => sections.some(section => {
    const content = section.replace(/^(?:Publisher:|Publisher blob:|Source:|Immutable publisher Git blob:).*\r?\n/gm, '').trimEnd()
    return ['', '\n', '\r\n', '\n\n'].some(ending => hash(content + ending) === digest)
  })
  for (const text of inventory.supplementalPublisherTexts) {
    check(retainedHash(text.sha256), `Supplemental publisher text changed: ${text.package}`)
  }
  for (const asset of inventory.templateAssets) {
    const bytes = read(asset.path)
    check(hash(bytes) === asset.sha256 && bytes.length === asset.bytes, `Template asset changed: ${asset.path}`)
    check(retainedHash(asset.license.sha256), `Template publisher license changed: ${asset.path}`)
  }
  for (const weight of [400, 500, 600, 700]) {
    check(hash(read(`public/fonts/inter-${weight}.woff2`)) === hash(read(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff2`)), `Inter font mismatch: ${weight}`)
  }
  check(hash(read('public/fonts/OFL-Inter.txt')) === hash(read('node_modules/@fontsource/inter/LICENSE')), 'Inter font license changed')

  if (process.argv.includes('--dist')) {
    const paths = [...inventory.aggregateFiles.map(file => `third-party/${file.path}`), 'third-party/inventory.json', 'fonts/OFL-Inter.txt']
    const worker = read('dist/sw.js').toString()
    for (const path of paths) {
      check(existsSync(resolve(root, 'dist', path)) && hash(read(`dist/${path}`)) === hash(read(`public/${path}`)), `Built notice missing or changed: ${path}`)
      check(worker.includes(path), `Notice absent from service-worker precache: ${path}`)
    }
  }
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`Notices verified: ${inventory.packages.length} packages, ${inventory.embeddedNotices.length} embedded notices, 4 fonts, 2 template assets${process.argv.includes('--dist') ? ', and built precache' : ''}.`)
} catch (error) {
  console.error(`Notice verification failed:\n${error.message}`)
  process.exitCode = 1
}
