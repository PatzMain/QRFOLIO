import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DatabaseProvider } from './DatabaseProvider'
const storage = vi.hoisted(() => ({ transaction: vi.fn() }))
vi.mock('../../shared/lib/db', () => ({ db: { transaction: storage.transaction, categories: {}, settings: {} } }))
afterEach(() => { cleanup(); vi.restoreAllMocks(); storage.transaction.mockReset() })
it('shows an actionable storage error and recovers after retry', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  storage.transaction.mockRejectedValueOnce(new Error('Synthetic storage denial')).mockResolvedValueOnce(undefined)
  render(<DatabaseProvider><p>Library ready</p></DatabaseProvider>)
  expect(await screen.findByRole('alert')).toHaveTextContent('could not open local storage')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByText('Library ready')).toBeInTheDocument()
})
