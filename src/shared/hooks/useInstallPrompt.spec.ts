import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { useInstallPrompt, type BeforeInstallPromptEvent } from './useInstallPrompt'

const installEvent = (outcome: 'accepted' | 'dismissed' = 'dismissed', prompt = vi.fn().mockResolvedValue(undefined)) => {
  const event = new Event('beforeinstallprompt', { cancelable: true }) as BeforeInstallPromptEvent
  Object.defineProperties(event, {
    prompt: { value: prompt },
    userChoice: { value: Promise.resolve({ outcome, platform: 'synthetic' }) },
    platforms: { value: ['synthetic'] },
  })
  return event
}

beforeEach(() => { window.dispatchEvent(new Event('appinstalled')) })
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('consumes a dismissed install event and waits for a fresh browser event before retry', async () => {
  const { result } = renderHook(() => useInstallPrompt())
  const dismissed = installEvent()
  act(() => { window.dispatchEvent(dismissed) })
  expect(result.current.isInstallable).toBe(true)
  await act(async () => { expect(await result.current.installApp()).toBe(false) })
  expect(result.current.isInstallable).toBe(false)
  await act(async () => { expect(await result.current.installApp()).toBe(false) })
  expect(dismissed.prompt).toHaveBeenCalledOnce()
  const accepted = installEvent('accepted')
  act(() => { window.dispatchEvent(accepted) })
  await act(async () => { expect(await result.current.installApp()).toBe(true) })
  expect(accepted.prompt).toHaveBeenCalledOnce()
  expect(result.current.isInstallable).toBe(false)
})

it('prompts only once when two controls attempt the same pending install', async () => {
  let finish!: () => void
  const prompt = vi.fn(() => new Promise<void>(resolve => { finish = resolve }))
  const first = renderHook(() => useInstallPrompt())
  const second = renderHook(() => useInstallPrompt())
  act(() => { window.dispatchEvent(installEvent('dismissed', prompt)) })
  await act(async () => {
    const pending = first.result.current.installApp()
    expect(await second.result.current.installApp()).toBe(false)
    finish()
    expect(await pending).toBe(false)
  })
  expect(prompt).toHaveBeenCalledOnce()
  expect(first.result.current.isInstallable).toBe(false)
  expect(second.result.current.isInstallable).toBe(false)
})

it('discards a failed browser prompt instead of offering the same consumed event again', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const prompt = vi.fn().mockRejectedValue(new Error('Synthetic browser prompt rejection'))
  const { result } = renderHook(() => useInstallPrompt())
  act(() => { window.dispatchEvent(installEvent('dismissed', prompt)) })
  await act(async () => { expect(await result.current.installApp()).toBe(false) })
  expect(result.current.isInstallable).toBe(false)
  expect(prompt).toHaveBeenCalledOnce()
})

it('clears install availability when the browser reports installation', () => {
  const { result } = renderHook(() => useInstallPrompt())
  act(() => { window.dispatchEvent(installEvent()) })
  expect(result.current.isInstallable).toBe(true)
  act(() => { window.dispatchEvent(new Event('appinstalled')) })
  expect(result.current.isInstallable).toBe(false)
})

it('does not offer installation in a standalone app window', () => {
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
  const { result } = renderHook(() => useInstallPrompt())
  act(() => { window.dispatchEvent(installEvent()) })
  expect(result.current.isInstallable).toBe(false)
})
