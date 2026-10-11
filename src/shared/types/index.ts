export type QRCodeType =
  | 'url'
  | 'text'
  | 'email'
  | 'phone'
  | 'sms'
  | 'wifi'
  | 'contact'
  | 'location'
  | 'calendar'
  | 'crypto'

export interface QRStyle {
  foregroundColor: string
  backgroundColor: string
  dotsStyle: 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded'
  cornersSquareStyle: 'square' | 'dot' | 'extra-rounded'
  cornersDotStyle: 'square' | 'dot'
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  size: number
  margin: number
  logoUrl?: string
}

export interface QRCode {
  id: string                 // UUID
  title: string
  type: QRCodeType
  content: string            // Raw encoded QR content
  metadata: Record<string, string> // Type-specific structured fields
  categoryId: string | null
  style: QRStyle
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  icon?: string              // Lucide icon name
  color?: string             // Color hex code
  order: number
  createdAt: Date
}

export interface AppSettings {
  id: string                 // Singleton 'app-settings'
  defaultStyle: QRStyle
  defaultCategoryId: string | null
  exportFormat: 'json' | 'csv'
  hapticFeedback: boolean
  reducedMotion: boolean
}
