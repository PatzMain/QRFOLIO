import { db, type QRFolioDatabase } from './db'
import { DEFAULT_CATEGORIES } from '../constants'
import type { Category, QRCode } from '../types'
import { BackupLimitError, MAX_CATEGORIES, MAX_QR_CODES, parseCategoryRecord, parseQRCodeRecord } from './backup'

export class LibraryWriteError extends Error {}

export function storageErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof BackupLimitError || error instanceof LibraryWriteError) return error.message
  let current = error
  for (let depth = 0; current && typeof current === 'object' && depth < 4; depth += 1) {
    const failure = current as { name?: string; inner?: unknown; cause?: unknown }
    if (failure.name === 'QuotaExceededError') return 'Browser storage is full. Export a backup, free browser or device space, then retry.'
    if (failure.name === 'SecurityError') return 'Browser storage is blocked. Check storage permissions, then retry.'
    current = failure.inner ?? failure.cause
  }
  return fallback
}

const compatibleQRCode = (record: QRCode): QRCode => {
  try { return parseQRCodeRecord(record) } catch {
    throw new LibraryWriteError('QR code could not be saved. Use a title of at most 512 characters and content fields of at most 32,768 characters with supported styling.')
  }
}
const compatibleCategory = (record: Category): Category => {
  try { return parseCategoryRecord(record) } catch {
    throw new LibraryWriteError('Category could not be saved. Use a name of at most 256 characters and a supported color.')
  }
}

export async function addLibraryQRCode(record: QRCode, database: QRFolioDatabase = db): Promise<void> {
  const validated = compatibleQRCode(record)
  await database.transaction('rw', [database.qrcodes, database.categories], async () => {
    if (await database.qrcodes.count() >= MAX_QR_CODES) throw new LibraryWriteError('The library limit is 10,000 QR codes. Export a backup before removing unused records.')
    if (validated.categoryId !== null && !(await database.categories.get(validated.categoryId))) throw new LibraryWriteError('Select an existing category before saving.')
    await database.qrcodes.add(validated)
  })
}

export async function updateLibraryQRCode(id: string, changes: Partial<QRCode>, database: QRFolioDatabase = db): Promise<void> {
  await database.transaction('rw', [database.qrcodes, database.categories], async () => {
    const current = await database.qrcodes.get(id)
    if (!current) throw new LibraryWriteError('This QR code is no longer in the library.')
    const validated = compatibleQRCode({ ...current, ...changes, id })
    if (validated.categoryId !== null && !(await database.categories.get(validated.categoryId))) throw new LibraryWriteError('Select an existing category before saving.')
    await database.qrcodes.put(validated)
  })
}

export async function addLibraryCategory(record: Category, database: QRFolioDatabase = db): Promise<void> {
  const validated = compatibleCategory(record)
  await database.transaction('rw', database.categories, async () => {
    if (await database.categories.count() >= MAX_CATEGORIES) throw new LibraryWriteError('The library limit is 1,000 categories. Export a backup before removing unused categories.')
    await database.categories.add(validated)
  })
}

export async function updateLibraryCategory(id: string, changes: Partial<Category>, database: QRFolioDatabase = db): Promise<void> {
  await database.transaction('rw', database.categories, async () => {
    const current = await database.categories.get(id)
    if (!current) throw new LibraryWriteError('This category is no longer in the library.')
    await database.categories.put(compatibleCategory({ ...current, ...changes, id }))
  })
}

export async function deleteLibraryCategory(id: string, reassignToId: string | null = null, database: QRFolioDatabase = db): Promise<void> {
  await database.transaction('rw', [database.categories, database.qrcodes, database.settings], async () => {
    if (reassignToId !== null && (reassignToId === id || !(await database.categories.get(reassignToId)))) {
      throw new Error('Select an existing replacement category.')
    }
    await database.qrcodes.where('categoryId').equals(id).modify({ categoryId: reassignToId })
    const settings = await database.settings.get('app-settings')
    if (settings?.defaultCategoryId === id) await database.settings.update('app-settings', { defaultCategoryId: reassignToId })
    await database.categories.delete(id)
  })
}

export async function clearLibrary(database: QRFolioDatabase = db): Promise<void> {
  await database.transaction('rw', [database.qrcodes, database.categories, database.settings], async () => {
    await database.qrcodes.clear()
    await database.categories.clear()
    await database.categories.bulkAdd(DEFAULT_CATEGORIES.map(category => ({ ...category, createdAt: new Date() })))
    await database.settings.update('app-settings', { defaultCategoryId: null })
  })
}
