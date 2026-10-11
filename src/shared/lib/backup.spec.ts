import 'fake-indexeddb/auto'
import { afterEach, describe, expect, it } from 'vitest'
import { QRFolioDatabase } from './db'
import { BackupLimitError, exportBackup, MAX_BACKUP_BYTES, MAX_CATEGORIES, parseBackup, parseBackupText, restoreBackup, serializeBackup } from './backup'
import { DEFAULT_QR_STYLE } from '../constants'
import demoBackup from '../../../public/synthetic-demo-backup.json'
import { addLibraryCategory, addLibraryQRCode, clearLibrary, deleteLibraryCategory, updateLibraryCategory, updateLibraryQRCode } from './library'

const now = new Date('2026-10-04T00:00:00.000Z')
const fixture = () => ({
  version: 2,
  categories: [{ id: 'synthetic', name: 'Synthetic Demo', order: 0, createdAt: now }],
  qrcodes: [{ id: 'synthetic-qr', title: 'Synthetic Example', type: 'text', content: 'Demo only', metadata: { text: 'Demo only' }, categoryId: 'synthetic', style: { ...DEFAULT_QR_STYLE }, isFavorite: true, createdAt: now, updatedAt: now }],
  settings: { id: 'app-settings', defaultStyle: { ...DEFAULT_QR_STYLE }, defaultCategoryId: 'synthetic', exportFormat: 'json', hapticFeedback: false, reducedMotion: true },
})
const databases: QRFolioDatabase[] = []
const database = () => {
  const instance = new QRFolioDatabase(`QRFolio-Audit-Test-${crypto.randomUUID()}`)
  databases.push(instance)
  return instance
}
afterEach(async () => { await Promise.all(databases.splice(0).map(instance => instance.delete())) })

describe('synthetic backup recovery', () => {
  it('downloads exact recoverable UTF-8 bytes and rejects an oversized library without truncation', () => {
    const valid = parseBackup(fixture())
    const serialized = serializeBackup(valid)
    expect(parseBackupText(serialized)).toEqual(valid)
    const oversized = parseBackup({ ...fixture(), qrcodes: Array.from({ length: 110 }, (_, index) => ({ ...fixture().qrcodes[0], id: `large-${index}`, content: '界'.repeat(32768) })) })
    expect(JSON.stringify(oversized).length).toBeLessThan(MAX_BACKUP_BYTES)
    expect(() => serializeBackup(oversized)).toThrow(BackupLimitError)
    expect(oversized.qrcodes).toHaveLength(110)
  })
  it('rejects locally saved fields that would prevent backup recovery and preserves the library', async () => {
    const target = database()
    const valid = parseBackup(fixture())
    await restoreBackup(valid, target)
    const before = await exportBackup(target)
    await expect(addLibraryQRCode({ ...valid.qrcodes[0], id: 'too-long-title', title: 'x'.repeat(513) }, target)).rejects.toThrow('512 characters')
    await expect(addLibraryQRCode({ ...valid.qrcodes[0], id: 'too-long-content', content: 'x'.repeat(32769) }, target)).rejects.toThrow('32,768 characters')
    await expect(updateLibraryQRCode('synthetic-qr', { title: 'x'.repeat(513) }, target)).rejects.toThrow('512 characters')
    await expect(addLibraryCategory({ ...valid.categories[0], id: 'too-long-name', name: 'x'.repeat(257) }, target)).rejects.toThrow('256 characters')
    await expect(updateLibraryCategory('synthetic', { name: 'x'.repeat(257) }, target)).rejects.toThrow('256 characters')
    expect(await exportBackup(target)).toEqual(before)
    await updateLibraryQRCode('synthetic-qr', { title: 'x'.repeat(512), content: 'x'.repeat(32768) }, target)
    await updateLibraryCategory('synthetic', { name: 'x'.repeat(256) }, target)
    const accepted = await exportBackup(target)
    expect(parseBackupText(serializeBackup(accepted))).toEqual(accepted)
  })
  it('rejects an import that would merge past library limits before any store changes', async () => {
    const target = database()
    await restoreBackup(parseBackup(fixture()), target)
    await target.categories.bulkAdd(Array.from({ length: MAX_CATEGORIES - 1 }, (_, index) => ({ id: `existing-${index}`, name: `Existing ${index}`, order: index + 1, createdAt: now })))
    const before = await exportBackup(target)
    const incoming = fixture()
    incoming.categories.push({ id: 'new-category', name: 'New Synthetic', order: 1, createdAt: now })
    incoming.qrcodes[0].content = 'Must remain unchanged'
    await expect(restoreBackup(parseBackup(incoming), target)).rejects.toThrow('library limit')
    expect(await exportBackup(target)).toEqual(before)
    await expect(addLibraryCategory({ id: 'new-local', name: 'New Local', order: 1, createdAt: now }, target)).rejects.toThrow('1,000 categories')
  })
  it('restores the distributed synthetic demonstration without personal data', async () => {
    const target = database()
    await restoreBackup(parseBackup(demoBackup), target)
    expect(await target.qrcodes.count()).toBe(3)
    expect((await target.qrcodes.get('synthetic-wifi'))?.metadata.ssid).toBe('Demo;Network')
    expect((await target.settings.get('app-settings'))?.reducedMotion).toBe(true)
  })
  it('round trips QR codes, categories, dates, settings, and persistence after reopening', async () => {
    const source = database()
    await restoreBackup(parseBackup(fixture()), source)
    const exported = JSON.stringify(await exportBackup(source))
    const target = database()
    await restoreBackup(parseBackupText(exported), target)
    target.close()
    await target.open()
    expect(await exportBackup(target)).toEqual(parseBackup(fixture()))
    expect((await target.categories.get('synthetic'))?.createdAt).toBeInstanceOf(Date)
    expect((await target.qrcodes.get('synthetic-qr'))?.createdAt).toBeInstanceOf(Date)
  })
  it('accepts version 1 libraries and keeps existing settings', async () => {
    const target = database()
    await restoreBackup(parseBackup(fixture()), target)
    const old = { ...fixture(), version: 1, settings: undefined }
    old.qrcodes[0].content = 'Changed synthetic content'
    await restoreBackup(parseBackupText(JSON.stringify(old)), target)
    expect((await target.qrcodes.get('synthetic-qr'))?.content).toBe('Changed synthetic content')
    expect((await target.settings.get('app-settings'))?.reducedMotion).toBe(true)
  })
  it('keeps exports recoverable after deleting the default category or clearing the library', async () => {
    const source = database()
    await restoreBackup(parseBackup(fixture()), source)
    await deleteLibraryCategory('synthetic', null, source)
    const backup = await exportBackup(source)
    expect(backup.settings?.defaultCategoryId).toBeNull()
    expect(backup.qrcodes[0].categoryId).toBeNull()
    const restored = database()
    await restoreBackup(parseBackupText(JSON.stringify(backup)), restored)
    expect(await exportBackup(restored)).toEqual(backup)
    await restoreBackup(parseBackup(fixture()), source)
    await clearLibrary(source)
    expect((await exportBackup(source)).settings?.defaultCategoryId).toBeNull()
    expect(await source.qrcodes.count()).toBe(0)
  })
  it('rejects an invalid replacement category without changing data', async () => {
    const target = database()
    await restoreBackup(parseBackup(fixture()), target)
    const before = await exportBackup(target)
    await expect(deleteLibraryCategory('synthetic', 'missing', target)).rejects.toThrow('replacement category')
    expect(await exportBackup(target)).toEqual(before)
  })
  it.each([
    ['unknown version', (input: ReturnType<typeof fixture>) => { input.version = 99 }],
    ['invalid date', (input: ReturnType<typeof fixture>) => { input.qrcodes[0].createdAt = new Date('invalid') }],
    ['invalid style', (input: ReturnType<typeof fixture>) => { input.qrcodes[0].style.size = -1 }],
    ['missing category', (input: ReturnType<typeof fixture>) => { input.qrcodes[0].categoryId = 'missing' }],
    ['duplicate ID', (input: ReturnType<typeof fixture>) => { input.qrcodes.push(input.qrcodes[0]) }],
  ])('rejects %s without changing the existing library', async (_label, mutate) => {
    const target = database()
    await restoreBackup(parseBackup(fixture()), target)
    const before = await exportBackup(target)
    const malformed = fixture()
    mutate(malformed)
    expect(() => parseBackupText(JSON.stringify(malformed))).toThrow()
    expect(await exportBackup(target)).toEqual(before)
  })
  it('rejects null records, invalid metadata, normalized invalid dates, and oversized input', () => {
    expect(() => parseBackup({ ...fixture(), qrcodes: [null] })).toThrow()
    expect(() => parseBackup({ ...fixture(), qrcodes: [{ ...fixture().qrcodes[0], metadata: [] }] })).toThrow()
    expect(() => parseBackup({ ...fixture(), categories: [{ ...fixture().categories[0], createdAt: '2026-02-30T00:00:00.000Z' }] })).toThrow()
    expect(() => parseBackupText(' '.repeat(10 * 1024 * 1024 + 1))).toThrow(/10 MiB/)
  })
  it('rolls back all imported stores when a storage write fails', async () => {
    const target = database()
    await restoreBackup(parseBackup(fixture()), target)
    const before = await exportBackup(target)
    const changed = fixture()
    changed.categories.push({ id: 'new', name: 'New Synthetic Category', order: 1, createdAt: now })
    changed.qrcodes[0].content = 'Must roll back'
    const fail = () => { throw new Error('Synthetic storage failure') }
    target.settings.hook('updating', fail)
    await expect(restoreBackup(parseBackup(changed), target)).rejects.toThrow('Synthetic storage failure')
    target.settings.hook('updating').unsubscribe(fail)
    expect(await exportBackup(target)).toEqual(before)
  })
})
