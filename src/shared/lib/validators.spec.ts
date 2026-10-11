import { describe, it, expect } from 'vitest'
import {
  validateURL,
  validateEmail,
  validatePhone,
  validateCrypto,
  validateContact
} from './validators'

describe('Form Validators', () => {
  describe('validateURL', () => {
    it('should validate correct URLs', () => {
      expect(validateURL('https://example.com')).toBeNull()
      expect(validateURL('http://example.org/path?q=1')).toBeNull()
      expect(validateURL('google.com')).toBeNull() // automatically handles prefixing in validator
    })

    it('should reject invalid formats', () => {
      expect(validateURL('')).toBe('URL is required')
      expect(validateURL('https://')).toBe('Invalid URL format')
    })
  })

  describe('validateEmail', () => {
    it('should validate valid emails', () => {
      expect(validateEmail('test@example.com')).toBeNull()
      expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull()
    })

    it('should reject invalid email formats', () => {
      expect(validateEmail('')).toBe('Email is required')
      expect(validateEmail('test')).toBe('Invalid email format')
      expect(validateEmail('test@')).toBe('Invalid email format')
      expect(validateEmail('@domain.com')).toBe('Invalid email format')
    })
  })

  describe('validatePhone', () => {
    it('should validate valid phone numbers', () => {
      expect(validatePhone('+123456789')).toBeNull()
      expect(validatePhone('123-456-7890')).toBeNull()
      expect(validatePhone('(123) 456 7890')).toBeNull()
    })

    it('should reject empty or invalid phones', () => {
      expect(validatePhone('')).toBe('Phone number is required')
      expect(validatePhone('123')).toBe('Invalid phone number format')
      expect(validatePhone('abcdefg')).toBe('Invalid phone number format')
    })
  })

  describe('validateCrypto', () => {
    it('rejects invalid addresses for the actual BTC and ETH form values', () => {
      expect(validateCrypto('BTC', 'synthetic-invalid-address')).toBe('Invalid Bitcoin address format')
      expect(validateCrypto('ETH', 'synthetic-invalid-address')).toBe('Invalid Ethereum address format')
      expect(validateCrypto('BTC', '1' + 'A'.repeat(33))).toBeNull()
      expect(validateCrypto('ETH', '0x' + '1'.repeat(40))).toBeNull()
    })
    it('should validate correct Bitcoin addresses', () => {
      expect(validateCrypto('bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBeNull()
      expect(validateCrypto('bitcoin', '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5')).toBeNull()
      expect(validateCrypto('bitcoin', 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5d9w')).toBeNull()
    })

    it('should reject incorrect Bitcoin addresses', () => {
      expect(validateCrypto('bitcoin', '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('Invalid Bitcoin address format')
    })

    it('should validate correct Ethereum addresses', () => {
      expect(validateCrypto('ethereum', '0x71C7656EC7ab88b098defB751B7401B5f6d1476B')).toBeNull()
    })

    it('should reject incorrect Ethereum addresses', () => {
      expect(validateCrypto('ethereum', '0x71C7656EC7ab88b098defB751B7401B5f6d1476')).toBe('Invalid Ethereum address format')
      expect(validateCrypto('ethereum', '71C7656EC7ab88b098defB751B7401B5f6d1476B')).toBe('Invalid Ethereum address format')
    })

    it('should bypass validation for other coins', () => {
      expect(validateCrypto('solana', 'someAddress')).toBeNull()
    })
  })
  it('requires either contact name, rejecting whitespace-only names', () => {
    expect(validateContact('Synthetic', '')).toBeNull()
    expect(validateContact('', 'Synthetic')).toBeNull()
    expect(validateContact('  ', ' ')).toBe('First name or last name is required')
    expect(validateContact(undefined, undefined)).toBe('First name or last name is required')
    expect(validateContact(undefined, 'Synthetic')).toBeNull()
  })
})
