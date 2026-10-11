/**
 * Santizes string inputs to prevent XSS or malicious payload injection
 * through scanned QR Code content or form fields.
 */
export const sanitizeContent = (str: string): string => {
  if (!str) return ''
  
  // Remove script tags and their content
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove generic HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  
  // Neutralize dangerous pseudo-protocols like javascript: or data: in links
  sanitized = sanitized.replace(/^(javascript|data|vbscript):/gi, '')
  
  return sanitized.trim()
}
