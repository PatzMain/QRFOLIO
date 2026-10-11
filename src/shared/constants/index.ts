import { type QRStyle, type Category, type QRCodeType } from '../types'

export const DEFAULT_QR_STYLE: QRStyle = {
  foregroundColor: '#6C5CE7', // Brand primary purple
  backgroundColor: '#FFFFFF', // Clean scan-ready white background
  dotsStyle: 'square',
  cornersSquareStyle: 'square',
  cornersDotStyle: 'square',
  errorCorrectionLevel: 'M',
  size: 300,
  margin: 4,
}

export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'projects', name: 'Projects', icon: 'Folder', color: '#6C5CE7', order: 0 },
  { id: 'social', name: 'Social', icon: 'Share2', color: '#A29BFE', order: 1 },
  { id: 'wifi', name: 'Wi-Fi', icon: 'Wifi', color: '#22C55E', order: 2 },
  { id: 'work', name: 'Work', icon: 'Briefcase', color: '#3B82F6', order: 3 },
  { id: 'other', name: 'Other', icon: 'Grid', color: '#94A3B8', order: 4 },
]

export const QR_TYPE_LABELS: Record<QRCodeType, string> = {
  url: 'Website Link',
  text: 'Plain Text',
  email: 'Email Message',
  phone: 'Phone Number',
  sms: 'SMS Message',
  wifi: 'Wi-Fi Network',
  contact: 'Contact Info',
  location: 'Map Location',
  calendar: 'Calendar Event',
  crypto: 'Crypto Address',
}
