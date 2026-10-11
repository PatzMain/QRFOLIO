import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Modal } from './Modal'

afterEach(cleanup)
it('names the dialog, traps keyboard focus, closes on Escape, and returns focus', () => {
  const trigger = document.createElement('button')
  document.body.appendChild(trigger)
  trigger.focus()
  const close = vi.fn()
  const view = render(<Modal isOpen onClose={close} title="Restore backup" footer={<button>Confirm</button>}><input aria-label="Backup title" /></Modal>)
  expect(screen.getByRole('dialog', { name: 'Restore backup' })).toHaveAttribute('aria-modal', 'true')
  const first = screen.getByRole('button', { name: 'Close modal' })
  const last = screen.getByRole('button', { name: 'Confirm' })
  expect(first).toHaveFocus()
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(first).toHaveFocus()
  fireEvent.keyDown(first, { key: 'Escape' })
  expect(close).toHaveBeenCalledOnce()
  view.unmount()
  expect(trigger).toHaveFocus()
  trigger.remove()
})
