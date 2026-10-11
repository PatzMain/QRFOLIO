import { resolveExternalDestination } from './qr-utils'
import { getCryptoCurrency } from './crypto-currencies'

export const validateURL = (url: string): string | null => {
  if (!url) return 'URL is required'
  return resolveExternalDestination(url, 'url') ? null : 'Invalid URL format'
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required'
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return isEmail ? null : 'Invalid email format'
}

export const validatePhone = (phone: string): string | null => {
  if (!phone) return 'Phone number is required'
  // Require min 7 characters, allow only digits, spaces, hyphens, and parenthesis
  const isPhone = /^\+?[\d\s\-()]{7,20}$/.test(phone)
  return isPhone ? null : 'Invalid phone number format'
}

export const validateWiFi = (ssid: string): string | null => {
  if (!ssid) return 'Wi-Fi Network Name (SSID) is required'
  return null
}

export const validateContact = (firstName = '', lastName = ''): string | null => {
  if (!firstName.trim() && !lastName.trim()) return 'First name or last name is required'
  return null
}

export const validateLocation = (latitude: string, longitude: string): { latitude: string | null; longitude: string | null } => {
  const errors = { latitude: null as string | null, longitude: null as string | null }
  
  if (!latitude.trim()) {
    errors.latitude = 'Latitude is required'
  } else {
    const latNum = Number(latitude)
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.latitude = 'Latitude must be between -90 and 90'
    }
  }

  if (!longitude.trim()) {
    errors.longitude = 'Longitude is required'
  } else {
    const lngNum = Number(longitude)
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.longitude = 'Longitude must be between -180 and 180'
    }
  }

  return errors
}

export const validateCalendar = (title: string, start: string, end: string): { title: string | null; dateRange: string | null } => {
  const errors = { title: null as string | null, dateRange: null as string | null }
  if (!title) {
    errors.title = 'Event title is required'
  }
  if ((start && !Number.isFinite(new Date(start).getTime())) || (end && !Number.isFinite(new Date(end).getTime()))) {
    errors.dateRange = 'Enter valid event dates'
    return errors
  }
  if (start && end) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (endDate < startDate) {
      errors.dateRange = 'End date must be after start date'
    }
  }
  return errors
}

export const validateCrypto = (coin: string, address: string): string | null => {
  if (!address) return 'Wallet address is required'
  const cleanCoin = getCryptoCurrency(coin)?.scheme ?? (coin || 'bitcoin').toLowerCase()
  if (cleanCoin === 'bitcoin') {
    const isBtc = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)
    return isBtc ? null : 'Invalid Bitcoin address format'
  }
  if (cleanCoin === 'ethereum') {
    const isEth = /^0x[a-fA-F0-9]{40}$/.test(address)
    return isEth ? null : 'Invalid Ethereum address format'
  }
  return null
}
