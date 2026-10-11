import { type QRCodeType } from '../types'
import { getCryptoCurrency } from './crypto-currencies'

const parseWiFiFields = (content: string): Record<string, string> => {
  const fields: Record<string, string> = {}
  let field = ''
  let escaped = false
  for (const character of content.slice(5)) {
    if (escaped) { field += character; escaped = false }
    else if (character === '\\') escaped = true
    else if (character === ';') {
      const separator = field.indexOf(':')
      if (separator > 0) fields[field.slice(0, separator)] = field.slice(separator + 1)
      field = ''
    } else field += character
  }
  return fields
}

export function resolveExternalDestination(content: string, type: QRCodeType): string | null {
  if (!content || Array.from(content).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)) return null
  if (type === 'url') {
    try {
      const value = content.trim()
      const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`)
      return ['http:', 'https:'].includes(url.protocol) && !!url.hostname ? url.href : null
    } catch { return null }
  }
  if (type === 'email') return /^mailto:[^\s?]+(?:\?.*)?$/i.test(content) ? content : null
  if (type === 'phone') return /^tel:\+?[\d ()-]+$/i.test(content) ? content : null
  if (type === 'sms') {
    if (/^sms:\+?[\d ()-]+(?:\?.*)?$/i.test(content)) return content
    const match = content.match(/^smsto:(\+?[\d ()-]+):(.*)$/i)
    return match ? `sms:${match[1]}?body=${encodeURIComponent(match[2])}` : null
  }
  if (type === 'crypto') {
    const match = content.match(/^([a-z]+):([^\s]+)$/i)
    const currency = match ? getCryptoCurrency(match[1]) : undefined
    return currency && match ? `${currency.scheme}:${match[2]}` : null
  }
  if (type === 'location') {
    const match = content.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/i)
    if (!match || Math.abs(Number(match[1])) > 90 || Math.abs(Number(match[2])) > 180) return null
    return `https://www.google.com/maps/search/?api=1&query=${match[1]},${match[2]}`
  }
  return null
}

// Encoders
export const encodeQRData = (type: QRCodeType, metadata: Record<string, string>): string => {
  switch (type) {
    case 'url':
      return metadata.url || ''
    case 'text':
      return metadata.text || ''
    case 'email': {
      const email = metadata.email || ''
      const subject = encodeURIComponent(metadata.subject || '')
      const body = encodeURIComponent(metadata.body || '')
      let mailto = `mailto:${email}`
      const params = []
      if (subject) params.push(`subject=${subject}`)
      if (body) params.push(`body=${body}`)
      if (params.length > 0) mailto += `?${params.join('&')}`
      return mailto
    }
    case 'phone':
      return `tel:${metadata.phone || ''}`
    case 'sms':
      return `smsto:${metadata.phone || ''}:${metadata.message || ''}`
    case 'wifi': {
      const ssid = metadata.ssid || ''
      const password = metadata.password || ''
      const encryption = metadata.encryption || 'WPA'
      const hidden = metadata.hidden === 'true' ? 'H:true;' : ''
      // Escape SSID and Password characters: \, ;, , etc.
      const escape = (str: string) => str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,')
      return `WIFI:S:${escape(ssid)};T:${encryption};P:${escape(password)};${hidden};`
    }
    case 'contact': {
      const fn = metadata.firstName || ''
      const ln = metadata.lastName || ''
      const company = metadata.company || ''
      const phone = metadata.phone || ''
      const email = metadata.email || ''
      const address = metadata.address || ''
      const url = metadata.url || ''
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${ln};${fn};;;`,
        `FN:${fn} ${ln}`.trim(),
        company ? `ORG:${company}` : '',
        phone ? `TEL;TYPE=CELL:${phone}` : '',
        email ? `EMAIL:${email}` : '',
        address ? `ADR:;;${address};;;;` : '',
        url ? `URL:${url}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n')
    }
    case 'location':
      return `geo:${metadata.latitude || '0'},${metadata.longitude || '0'}`
    case 'calendar': {
      const title = metadata.title || ''
      const desc = metadata.description || ''
      const loc = metadata.location || ''
      // Format to YYYYMMDDTHHMMSSZ
      const formatVal = (str: string) => {
        if (!str) return ''
        return new Date(str).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      const start = formatVal(metadata.start || '')
      const end = formatVal(metadata.end || '')
      return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        desc ? `DESCRIPTION:${desc}` : '',
        loc ? `LOCATION:${loc}` : '',
        start ? `DTSTART:${start}` : '',
        end ? `DTEND:${end}` : '',
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\n')
    }
    case 'crypto': {
      const coin = getCryptoCurrency(metadata.coin)?.scheme ?? (metadata.coin || 'bitcoin').toLowerCase()
      const address = metadata.address || ''
      const amount = metadata.amount ? `?amount=${metadata.amount}` : ''
      return `${coin}:${address}${amount}`
    }
    default:
      return ''
  }
}

// Parser
export const parseQRCodeContent = (content: string): { type: QRCodeType; metadata: Record<string, string> } => {
  // React renders these strings as text. Preserve QR payloads (including passwords);
  // navigation is checked separately at the point where an external action runs.
  const cleanContent = content.trim()

  if (cleanContent.startsWith('mailto:')) {
    const parameters = new URLSearchParams(cleanContent.split('?').slice(1).join('?'))
    const email = cleanContent.split('?')[0].replace('mailto:', '')
    const subject = parameters.get('subject') || ''
    const body = parameters.get('body') || ''
    return {
      type: 'email',
      metadata: { email, subject, body }
    }
  }

  if (cleanContent.startsWith('tel:')) {
    return {
      type: 'phone',
      metadata: { phone: cleanContent.replace('tel:', '') }
    }
  }

  if (cleanContent.startsWith('smsto:')) {
    const parts = cleanContent.replace('smsto:', '').split(':')
    const phone = parts[0] || ''
    const message = parts.slice(1).join(':') || ''
    return {
      type: 'sms',
      metadata: { phone, message }
    }
  }

  if (cleanContent.startsWith('WIFI:')) {
    const fields = parseWiFiFields(cleanContent)
    return {
      type: 'wifi',
      metadata: {
        ssid: fields.S || '',
        password: fields.P || '',
        encryption: fields.T || 'WPA',
        hidden: fields.H === 'true' ? 'true' : 'false'
      }
    }
  }

  if (cleanContent.includes('BEGIN:VCARD')) {
    const fnMatch = cleanContent.match(/FN:([^\n\r]+)/)
    const orgMatch = cleanContent.match(/ORG:([^\n\r]+)/)
    const telMatch = cleanContent.match(/TEL;[^:]*:([^\n\r]+)/)
    const emailMatch = cleanContent.match(/EMAIL:([^\n\r]+)/)
    const adrMatch = cleanContent.match(/ADR:([^\n\r]+)/)
    const urlMatch = cleanContent.match(/URL:([^\n\r]+)/)
    
    // Split name
    let firstName = ''
    let lastName = ''
    const nMatch = cleanContent.match(/N:([^;\n\r]+);([^;\n\r]*)/)
    if (nMatch) {
      lastName = nMatch[1] || ''
      firstName = nMatch[2] || ''
    } else if (fnMatch) {
      const parts = fnMatch[1].split(' ')
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }

    return {
      type: 'contact',
      metadata: {
        firstName,
        lastName,
        company: orgMatch ? orgMatch[1] : '',
        phone: telMatch ? telMatch[1] : '',
        email: emailMatch ? emailMatch[1] : '',
        address: adrMatch ? adrMatch[1].replace(/^;;;?/, '').replace(/;+/g, ' ') : '',
        url: urlMatch ? urlMatch[1] : ''
      }
    }
  }

  if (cleanContent.startsWith('geo:')) {
    const coords = cleanContent.replace('geo:', '').split(',')
    return {
      type: 'location',
      metadata: {
        latitude: coords[0] || '0',
        longitude: coords[1] || '0'
      }
    }
  }

  if (cleanContent.includes('BEGIN:VEVENT')) {
    const summaryMatch = cleanContent.match(/SUMMARY:([^\n\r]+)/)
    const descMatch = cleanContent.match(/DESCRIPTION:([^\n\r]+)/)
    const locMatch = cleanContent.match(/LOCATION:([^\n\r]+)/)
    const startMatch = cleanContent.match(/DTSTART:([^\n\r]+)/)
    const endMatch = cleanContent.match(/DTEND:([^\n\r]+)/)

    const parseDate = (dt: string) => {
      if (!dt) return ''
      // Format YYYYMMDDTHHMMSSZ -> YYYY-MM-DDTHH:MM
      const match = dt.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/)
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`
      }
      return ''
    }

    return {
      type: 'calendar',
      metadata: {
        title: summaryMatch ? summaryMatch[1] : '',
        description: descMatch ? descMatch[1] : '',
        location: locMatch ? locMatch[1] : '',
        start: startMatch ? parseDate(startMatch[1]) : '',
        end: endMatch ? parseDate(endMatch[1]) : ''
      }
    }
  }

  // Crypto address check
  const cryptoPrefix = cleanContent.match(/^([a-z]+):/i)
  const currency = cryptoPrefix ? getCryptoCurrency(cryptoPrefix[1]) : undefined
  if (currency && cryptoPrefix) {
    const parts = cleanContent.slice(cryptoPrefix[0].length).split('?')
    const address = parts[0] || ''
    const amountMatch = parts[1]?.match(/amount=([^&]+)/)
    return {
      type: 'crypto',
      metadata: {
        coin: currency.scheme.toUpperCase(),
        address,
        amount: amountMatch ? amountMatch[1] : ''
      }
    }
  }

  // URL check
  const isUrl = /^https?:\/\//i.test(cleanContent) || /^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(cleanContent)
  if (isUrl && resolveExternalDestination(cleanContent, 'url')) {
    let url = cleanContent
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url
    }
    return {
      type: 'url',
      metadata: { url }
    }
  }

  // Fallback to text
  return {
    type: 'text',
    metadata: { text: content }
  }
}

// Handler to execute external app action for all 10 QR types
export const executeExternalAppHandler = (
  content: string,
  type: QRCodeType,
  showToast: (message: string, toastType?: 'success' | 'warning' | 'error' | 'info', duration?: number) => void
): void => {
  if (!content) return

  const needsDestination = ['url', 'email', 'phone', 'sms', 'location', 'crypto'].includes(type)
  const destination = needsDestination ? resolveExternalDestination(content, type) : null
  if (needsDestination && !destination) {
    showToast('This QR code contains an unsafe or invalid destination.', 'error')
    return
  }

  switch (type) {
    case 'url': {
      const a = document.createElement('a')
      a.href = destination!
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      break
    }
    case 'email': {
      window.location.href = destination!
      break
    }
    case 'phone': {
      window.location.href = destination!
      break
    }
    case 'sms': {
      window.location.href = destination!
      break
    }
    case 'location': {
      // Parse geo URI: geo:lat,lon
      const a = document.createElement('a')
      a.href = destination!
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      break
    }
    case 'calendar': {
      try {
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'event.ics'
        a.click()
        URL.revokeObjectURL(url)
        showToast('Calendar event downloaded. Open it to add to your calendar.', 'success')
      } catch {
        showToast('Failed to generate calendar file', 'error')
      }
      break
    }
    case 'contact': {
      try {
        const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'contact.vcf'
        a.click()
        URL.revokeObjectURL(url)
        showToast('vCard downloaded. Open it to import contact.', 'success')
      } catch {
        showToast('Failed to generate contact file', 'error')
      }
      break
    }
    case 'wifi': {
      // Parse password to copy
      const fields = parseWiFiFields(content)
      const ssid = fields.S || 'Wi-Fi Network'
      const password = fields.P || ''
      if (password) {
        if (!navigator.clipboard?.writeText) {
          showToast('Clipboard access is unavailable in this browser.', 'error')
          return
        }
        navigator.clipboard.writeText(password).then(
          () => showToast(`Copied WiFi password for "${ssid}". Go to network settings to connect.`, 'success'),
          () => showToast('Could not copy the Wi-Fi password. Check clipboard permissions.', 'error'),
        )
      } else {
        showToast(`WiFi SSID: "${ssid}". No password required.`, 'info')
      }
      break
    }
    case 'crypto': {
      // Let system open standard wallet scheme
      window.location.href = destination!
      break
    }
    case 'text': {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(content)}`
      const a = document.createElement('a')
      a.href = searchUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
      break
    }
    default: {
      showToast('No external app handler for this format', 'info')
    }
  }
}
