import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { UpdateBanner } from './UpdateBanner'

afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('allows update and in-memory snooze when every session-storage operation is blocked', async () => {
  const blocked = () => { throw new DOMException('Synthetic blocked browser storage', 'SecurityError') }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(blocked)
  const onUpdate = vi.fn()
  const view = render(<UpdateBanner needRefresh onUpdate={onUpdate} />)
  fireEvent.click(screen.getByRole('button', { name: 'Update' }))
  expect(onUpdate).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument())
  view.rerender(<UpdateBanner needRefresh={false} onUpdate={onUpdate} />)
  view.rerender(<UpdateBanner needRefresh onUpdate={onUpdate} />)
  expect(await screen.findByRole('button', { name: 'Update' })).toBeInTheDocument()
})
