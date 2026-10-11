import Dexie, { type Table } from 'dexie'
import { type QRCode, type Category, type AppSettings } from '../types'

export class QRFolioDatabase extends Dexie {
  qrcodes!: Table<QRCode>
  categories!: Table<Category>
  settings!: Table<AppSettings>

  constructor(name = 'QRFolioDatabase') {
    super(name)
    this.version(1).stores({
      qrcodes: 'id, title, type, categoryId, isFavorite, createdAt, updatedAt',
      categories: 'id, name, order, createdAt',
      settings: 'id',
    })
  }
}

export const db = new QRFolioDatabase()
