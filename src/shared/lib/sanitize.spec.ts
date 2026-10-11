import { describe, it, expect } from 'vitest'
import { sanitizeContent } from './sanitize'

describe('sanitizeContent', () => {
  it('should pass normal safe text as is', () => {
    expect(sanitizeContent('Hello World')).toBe('Hello World')
    expect(sanitizeContent('https://google.com')).toBe('https://google.com')
  })

  it('should strip basic script tags', () => {
    expect(sanitizeContent('<script>alert("XSS")</script>Hello'))
      .toBe('Hello')
  })

  it('should remove javascript: protocol schemes', () => {
    expect(sanitizeContent('javascript:alert(1)')).toBe('alert(1)')
    expect(sanitizeContent('JavaScript:alert(1)')).toBe('alert(1)')
  })

  it('should remove data:text/html schemes', () => {
    expect(sanitizeContent('data:text/html,alert(1)')).toBe('text/html,alert(1)')
    expect(sanitizeContent('DATA:TEXT/HTML;base64,alert(1)')).toBe('TEXT/HTML;base64,alert(1)')
  })

  it('should strip inline HTML event handlers', () => {
    expect(sanitizeContent('<img src="x" onerror="alert(1)">'))
      .toBe('')
    expect(sanitizeContent('<body onload="run()">'))
      .toBe('')
  })

  it('should handle complex nested script structures', () => {
    const input = 'safe<script>unsafe</script>text<iframe src="javascript:alert(1)"></iframe>'
    const output = sanitizeContent(input)
    expect(output).not.toContain('<script>')
    expect(output).not.toContain('javascript:')
  })
})
