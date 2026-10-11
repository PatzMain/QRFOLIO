// @vitest-environment happy-dom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { encodeQRData, parseQRCodeContent, executeExternalAppHandler, resolveExternalDestination } from './qr-utils'
afterEach(() => vi.restoreAllMocks())

describe('QR Utilities (Encoders & Parsers)', () => {
  it.each([
    ['BTC', 'bitcoin'], ['ETH', 'ethereum'], ['SOL', 'solana'],
    ['DOGE', 'dogecoin'], ['LTC', 'litecoin'],
  ])('roundtrips the actual %s form value through its canonical scheme', (code, scheme) => {
    const content = encodeQRData('crypto', { coin: code, address: 'SyntheticAddress', amount: '0.1' })
    expect(content).toBe(`${scheme}:SyntheticAddress?amount=0.1`)
    const parsed = parseQRCodeContent(content)
    expect(parsed).toEqual({ type: 'crypto', metadata: { coin: scheme.toUpperCase(), address: 'SyntheticAddress', amount: '0.1' } })
    expect(encodeQRData('crypto', parsed.metadata)).toBe(content)
    expect(parseQRCodeContent(`${code.toLowerCase()}:SyntheticAddress?amount=0.1`)).toEqual(parsed)
    expect(resolveExternalDestination(`${code}:SyntheticAddress?amount=0.1`, 'crypto')).toBe(content)
    expect(resolveExternalDestination('javascript:SyntheticAddress', 'crypto')).toBeNull()
  })
  it('should encode and parse URLs correctly', () => {
    const meta = { url: 'https://example.com' }
    const encoded = encodeQRData('url', meta)
    expect(encoded).toBe('https://example.com')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('url')
    expect(parsed.metadata.url).toBe('https://example.com')
  })

  it('should encode and parse plain text correctly', () => {
    const meta = { text: 'Hello world sample text' }
    const encoded = encodeQRData('text', meta)
    expect(encoded).toBe('Hello world sample text')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('text')
    expect(parsed.metadata.text).toBe('Hello world sample text')
  })

  it('should encode and parse Email correctly', () => {
    const meta = { email: 'user@example.com', subject: 'Inquiry', body: 'Hello there' }
    const encoded = encodeQRData('email', meta)
    expect(encoded).toContain('mailto:user@example.com')
    expect(encoded).toContain('subject=Inquiry')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('email')
    expect(parsed.metadata.email).toBe('user@example.com')
    expect(parsed.metadata.subject).toBe('Inquiry')
    expect(parsed.metadata.body).toBe('Hello there')
  })

  it('should encode and parse phone/tel links correctly', () => {
    const meta = { phone: '+1234567890' }
    const encoded = encodeQRData('phone', meta)
    expect(encoded).toBe('tel:+1234567890')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('phone')
    expect(parsed.metadata.phone).toBe('+1234567890')
  })

  it('should encode and parse SMS links correctly', () => {
    const meta = { phone: '+1234567890', message: 'Hello SMS' }
    const encoded = encodeQRData('sms', meta)
    expect(encoded).toBe('smsto:+1234567890:Hello SMS')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('sms')
    expect(parsed.metadata.phone).toBe('+1234567890')
    expect(parsed.metadata.message).toBe('Hello SMS')
  })

  it('should encode and parse Wi-Fi settings correctly', () => {
    const meta = { ssid: 'HomeNet', password: 'secretPass123', encryption: 'WPA', hidden: 'false' }
    const encoded = encodeQRData('wifi', meta)
    expect(encoded).toBe('WIFI:S:HomeNet;T:WPA;P:secretPass123;;')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('wifi')
    expect(parsed.metadata.ssid).toBe('HomeNet')
    expect(parsed.metadata.password).toBe('secretPass123')
  })

  it('should encode and parse Contacts (vCard) correctly', () => {
    const meta = { firstName: 'Alice', lastName: 'Smith', company: 'Acme', phone: '5551234', email: 'alice@acme.com', address: '123 Main St', url: 'acme.com' }
    const encoded = encodeQRData('contact', meta)
    expect(encoded).toContain('BEGIN:VCARD')
    expect(encoded).toContain('FN:Alice Smith')
    expect(encoded).toContain('ORG:Acme')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('contact')
    expect(parsed.metadata.firstName).toBe('Alice')
    expect(parsed.metadata.lastName).toBe('Smith')
    expect(parsed.metadata.company).toBe('Acme')
  })

  it('should encode and parse Map Locations (geo) correctly', () => {
    const meta = { latitude: '37.7749', longitude: '-122.4194' }
    const encoded = encodeQRData('location', meta)
    expect(encoded).toBe('geo:37.7749,-122.4194')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('location')
    expect(parsed.metadata.latitude).toBe('37.7749')
    expect(parsed.metadata.longitude).toBe('-122.4194')
  })

  it('should encode and parse Calendar events (vCalendar) correctly', () => {
    const meta = { title: 'Conference', description: 'Annual meet', location: 'Hall A', start: '2026-07-06T10:00:00.000Z', end: '2026-07-06T12:00:00.000Z' }
    const encoded = encodeQRData('calendar', meta)
    expect(encoded).toContain('BEGIN:VEVENT')
    expect(encoded).toContain('SUMMARY:Conference')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('calendar')
    expect(parsed.metadata.title).toBe('Conference')
  })

  it('should encode and parse Crypto Address correctly', () => {
    const meta = { coin: 'BITCOIN', address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', amount: '0.015' }
    const encoded = encodeQRData('crypto', meta)
    expect(encoded).toBe('bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?amount=0.015')

    const parsed = parseQRCodeContent(encoded)
    expect(parsed.type).toBe('crypto')
    expect(parsed.metadata.coin).toBe('BITCOIN')
    expect(parsed.metadata.address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    expect(parsed.metadata.amount).toBe('0.015')
  })
})

describe('executeExternalAppHandler', () => {
  it('should copy password and show toast for Wi-Fi configurations', async () => {
    const showToast = vi.fn()
    const content = 'WIFI:S:OfficeNetwork;T:WPA;P:Pa$$w0rd;;'
    
    // Mock navigator.clipboard
    const mockWriteText = vi.fn().mockImplementation(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText
      },
      writable: true,
      configurable: true
    })

    executeExternalAppHandler(content, 'wifi', showToast)
    await Promise.resolve()
    expect(mockWriteText).toHaveBeenCalledWith('Pa$$w0rd')
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining('Copied WiFi password'), 'success')
  })

  it('should open link in new window for standard URLs', () => {
    const showToast = vi.fn()
    const mockClick = vi.fn()
    const mockAnchor = { href: '', target: '', rel: '', click: mockClick }
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockAnchor as unknown as HTMLAnchorElement
      return {} as unknown as HTMLElement
    })

    executeExternalAppHandler('https://example.com', 'url', showToast)
    expect(mockAnchor.href).toBe('https://example.com/')
    expect(mockAnchor.target).toBe('_blank')
    expect(mockAnchor.rel).toBe('noopener noreferrer')
    expect(mockClick).toHaveBeenCalled()
  })
})

describe('external actions and damaged input', () => {
  it.each(['url', 'email', 'phone', 'sms', 'crypto'] as const)('blocks executable and mismatched destinations for %s', type => {
    for (const content of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'java\nscript:alert(1)', 'file:///secret']) {
      expect(resolveExternalDestination(content, type)).toBeNull()
      const toast = vi.fn()
      executeExternalAppHandler(content, type, toast)
      expect(toast).toHaveBeenCalledWith(expect.stringContaining('unsafe or invalid'), 'error')
    }
  })
  it('normalizes scanned hostnames and supports long URL suffixes and fragments', () => {
    expect(resolveExternalDestination('example.com', 'url')).toBe('https://example.com/')
    expect(parseQRCodeContent('https://example.technology/path#section').type).toBe('url')
    expect(resolveExternalDestination('geo:999,999', 'location')).toBeNull()
  })
  it('preserves escaped Wi-Fi passwords and SSIDs through creation and scanning', () => {
    const metadata = { ssid: 'Demo;Net:Lab,\\', password: 'Only;<demo>:,\\', encryption: 'WPA', hidden: 'true' }
    expect(parseQRCodeContent(encodeQRData('wifi', metadata)).metadata).toEqual(metadata)
  })
  it('handles malformed email content without crashing the scan parser', () => {
    expect(() => parseQRCodeContent('mailto:%broken?subject=%')).not.toThrow()
  })
  it('reports clipboard denial instead of success', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } })
    const toast = vi.fn()
    executeExternalAppHandler('WIFI:S:Demo;T:WPA;P:synthetic;;', 'wifi', toast)
    await Promise.resolve()
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('clipboard permissions'), 'error')
  })
})
