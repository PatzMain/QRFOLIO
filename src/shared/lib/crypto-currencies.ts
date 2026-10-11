// Shared names for the existing generator choices and their stored URI schemes.
export const CRYPTO_CURRENCIES = [
  { value: 'BTC', scheme: 'bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ETH', scheme: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'SOL', scheme: 'solana', label: 'Solana (SOL)' },
  { value: 'DOGE', scheme: 'dogecoin', label: 'Dogecoin (DOGE)' },
  { value: 'LTC', scheme: 'litecoin', label: 'Litecoin (LTC)' },
] as const

export function getCryptoCurrency(coin?: string) {
  const value = (coin || 'bitcoin').trim().toLowerCase()
  return CRYPTO_CURRENCIES.find(currency => currency.value.toLowerCase() === value || currency.scheme === value)
}
