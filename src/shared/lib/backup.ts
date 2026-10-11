import { db, type QRFolioDatabase } from './db'
import type { AppSettings, Category, QRCode, QRCodeType, QRStyle } from '../types'

export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
export const MAX_QR_CODES = 10000
export const MAX_CATEGORIES = 1000
export const MAX_QR_TITLE_LENGTH = 512
export const MAX_CATEGORY_NAME_LENGTH = 256
export class BackupLimitError extends Error {}
const QR_TYPES: QRCodeType[] = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'contact', 'location', 'calendar', 'crypto']
export interface LibraryBackup {
  version: 1 | 2
  qrcodes: QRCode[]
  categories: Category[]
  settings?: AppSettings
}

const invalid = (): never => { throw new Error('Invalid or unsupported backup. Your library was not changed.') }
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
const string = (value: unknown, maximum = 32768, required = false): string => {
  if (typeof value !== 'string' || value.length > maximum || (required && !value.trim())) return invalid()
  return value
}
const boolean = (value: unknown): boolean => typeof value === 'boolean' ? value : invalid()
const integer = (value: unknown, minimum: number, maximum: number): number =>
  typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum ? value : invalid()
const choice = <T extends string>(value: unknown, choices: readonly T[]): T =>
  typeof value === 'string' && choices.includes(value as T) ? value as T : invalid()
const date = (value: unknown): Date => {
  if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value.getTime())
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return invalid()
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 19) === value.slice(0, 19) ? parsed : invalid()
}
const color = (value: unknown): string => {
  const result = string(value, 9)
  return /^#[\da-f]{6}$/i.test(result) ? result : invalid()
}
const categoryId = (value: unknown): string | null => value === null ? null : string(value, 128, true)
const style = (value: unknown): QRStyle => {
  const input = object(value)
  const output: QRStyle = {
    foregroundColor: color(input.foregroundColor), backgroundColor: color(input.backgroundColor),
    dotsStyle: choice(input.dotsStyle, ['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded']),
    cornersSquareStyle: choice(input.cornersSquareStyle, ['square', 'dot', 'extra-rounded']),
    cornersDotStyle: choice(input.cornersDotStyle, ['square', 'dot']),
    errorCorrectionLevel: choice(input.errorCorrectionLevel, ['L', 'M', 'Q', 'H']),
    size: integer(input.size, 64, 2048), margin: integer(input.margin, 0, 128),
  }
  if (input.logoUrl !== undefined) {
    const logo = string(input.logoUrl, 1024 * 1024)
    // Imported styles cannot introduce remote image requests or executable URLs.
    if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)) return invalid()
    output.logoUrl = logo
  }
  return output
}

export function parseCategoryRecord(value: unknown): Category {
  const item = object(value)
  const result: Category = { id: string(item.id, 128, true), name: string(item.name, MAX_CATEGORY_NAME_LENGTH, true), order: integer(item.order, 0, 1000000), createdAt: date(item.createdAt) }
  if (item.icon !== undefined) result.icon = string(item.icon, 64)
  if (item.color !== undefined) result.color = color(item.color)
  return result
}

export function parseQRCodeRecord(value: unknown): QRCode {
  const item = object(value)
  const entries = Object.entries(object(item.metadata))
  if (entries.length > 100) return invalid()
  const metadata = Object.fromEntries(entries.map(([key, value]) => [string(key, 128, true), string(value)]))
  return {
    id: string(item.id, 128, true), title: string(item.title, MAX_QR_TITLE_LENGTH, true), type: choice(item.type, QR_TYPES), content: string(item.content), metadata,
    categoryId: categoryId(item.categoryId), style: style(item.style), isFavorite: boolean(item.isFavorite), createdAt: date(item.createdAt), updatedAt: date(item.updatedAt),
  }
}

export function parseBackup(value: unknown): LibraryBackup {
  const input = object(value)
  if (input.version !== 1 && input.version !== 2) return invalid()
  if (!Array.isArray(input.qrcodes) || input.qrcodes.length > MAX_QR_CODES || !Array.isArray(input.categories) || input.categories.length > MAX_CATEGORIES) return invalid()
  const categories = input.categories.map(parseCategoryRecord)
  const ids = new Set(categories.map(item => item.id))
  if (ids.size !== categories.length) return invalid()
  const qrcodes = input.qrcodes.map(parseQRCodeRecord)
  if (qrcodes.some(item => item.categoryId !== null && !ids.has(item.categoryId))) return invalid()
  if (new Set(qrcodes.map(item => item.id)).size !== qrcodes.length) return invalid()
  const result: LibraryBackup = { version: input.version, qrcodes, categories }
  if (input.version === 2) {
    const settings = object(input.settings)
    if (settings.id !== 'app-settings') return invalid()
    result.settings = {
      id: 'app-settings', defaultStyle: style(settings.defaultStyle), defaultCategoryId: categoryId(settings.defaultCategoryId),
      exportFormat: choice(settings.exportFormat, ['json', 'csv']), hapticFeedback: boolean(settings.hapticFeedback), reducedMotion: boolean(settings.reducedMotion),
    }
    if (result.settings.defaultCategoryId !== null && !ids.has(result.settings.defaultCategoryId)) return invalid()
  }
  return result
}

export function parseBackupText(text: string): LibraryBackup {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) throw new BackupLimitError('Backup exceeds the 10 MiB limit.')
  return parseBackup(JSON.parse(text))
}

export function serializeBackup(backup: LibraryBackup): string {
  const text = JSON.stringify(parseBackup(backup))
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new BackupLimitError('Library exceeds the 10 MiB backup limit. No backup was downloaded. Reduce unused QR content or custom logos, then retry.')
  }
  return text
}

export async function exportBackup(database: QRFolioDatabase = db): Promise<LibraryBackup> {
  return database.transaction('r', [database.qrcodes, database.categories, database.settings], async () => {
    const settings = await database.settings.get('app-settings')
    return parseBackup({ version: settings ? 2 : 1, qrcodes: await database.qrcodes.toArray(), categories: await database.categories.toArray(), settings })
  })
}

export async function restoreBackup(backup: LibraryBackup, database: QRFolioDatabase = db): Promise<void> {
  // Validate the whole input before any write; one transaction rolls back storage failures.
  const validated = parseBackup(backup)
  await database.transaction('rw', [database.qrcodes, database.categories, database.settings], async () => {
    const existingCategories = new Set((await database.categories.toArray()).map(item => item.id))
    const newCategories = validated.categories.filter(item => !existingCategories.has(item.id))
    const existingQRCodeIds = new Set(await database.qrcodes.toCollection().primaryKeys())
    const newQRCodeCount = validated.qrcodes.filter(item => !existingQRCodeIds.has(item.id)).length
    if (existingCategories.size + newCategories.length > MAX_CATEGORIES || existingQRCodeIds.size + newQRCodeCount > MAX_QR_CODES) {
      throw new BackupLimitError('Import would exceed the library limit of 10,000 QR codes or 1,000 categories. Your library was not changed.')
    }
    await database.categories.bulkAdd(newCategories)
    await database.qrcodes.bulkPut(validated.qrcodes)
    if (validated.settings) await database.settings.put(validated.settings)
  })
}
