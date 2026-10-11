import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUpdatePrompt } from './useUpdatePrompt'
import { mockPwaController } from '../../tests/setup'

describe('useUpdatePrompt hook', () => {
  beforeEach(() => {
    mockPwaController.reset()
  })

  it('should return needRefresh: false and offlineReady: false initially', () => {
    const { result } = renderHook(() => useUpdatePrompt())
    expect(result.current.needRefresh).toBe(false)
    expect(result.current.offlineReady).toBe(false)
  })

  it('should update needRefresh to true when triggerNeedRefresh is called', () => {
    const { result } = renderHook(() => useUpdatePrompt())

    act(() => {
      mockPwaController.triggerNeedRefresh()
    })

    expect(result.current.needRefresh).toBe(true)
  })

  it('should update offlineReady to true when triggerOfflineReady is called', () => {
    const { result } = renderHook(() => useUpdatePrompt())

    act(() => {
      mockPwaController.triggerOfflineReady()
    })

    expect(result.current.offlineReady).toBe(true)
  })

  it('should call updateServiceWorker on the registration controller when updateServiceWorker is called', () => {
    const { result } = renderHook(() => useUpdatePrompt())

    act(() => {
      result.current.updateServiceWorker()
    })

    expect(mockPwaController.updateServiceWorker).toHaveBeenCalledWith(true)
  })
})
