import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, renderHook } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { useMediaQuery } from '../shared/hooks/useMediaQuery'
import { mockPwaController } from './setup'

// Helper to resize the viewport
const resizeViewport = (width: number) => {
  window.innerWidth = width
  window.dispatchEvent(new Event('resize'))
}

describe('Responsive Layout & useMediaQuery Hook', () => {
  const originalWidth = window.innerWidth

  beforeEach(() => {
    // Reset window width to mobile default
    window.innerWidth = 375
    window.dispatchEvent(new Event('resize'))
    mockPwaController.reset()
  })

  afterEach(() => {
    // Restore original window width
    window.innerWidth = originalWidth
    window.dispatchEvent(new Event('resize'))
    mockPwaController.reset()
  })

  // Tier 1: Feature Coverage

  it('1. Mobile Bottom Nav Visible (viewport < 1024px)', () => {
    resizeViewport(768)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    // Check bottom nav is present. BottomNav labels are HOME, CATEGORIES, SETTINGS
    expect(screen.getByText(/home/i)).toBeInTheDocument()
    expect(screen.getByText(/categories/i)).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('2. Mobile Sidebar Navigation Hidden', () => {
    resizeViewport(768)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    const aside = document.querySelector('aside')
    expect(aside).toBeNull()
  })

  it('3. Desktop Sidebar Navigation Visible (viewport >= 1024px)', () => {
    resizeViewport(1200)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    // Sidebar should be present (aside tag)
    const aside = document.querySelector('aside')
    expect(aside).not.toBeNull()
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /scan qr code/i })).toBeInTheDocument()
  })

  it('4. Desktop Bottom Nav Hidden', () => {
    resizeViewport(1200)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    // BottomNav (nav tag) should not be present
    const nav = document.querySelector('nav.fixed')
    expect(nav).toBeNull()
  })

  it('5. Media Query Hook Returns Correct Status', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    
    // Initial (window.innerWidth is 375, so < 1024px)
    expect(result.current).toBe(false)

    // Resize to desktop
    act(() => {
      resizeViewport(1024)
    })
    expect(result.current).toBe(true)

    // Resize back to mobile
    act(() => {
      resizeViewport(768)
    })
    expect(result.current).toBe(false)
  })

  // Tier 2: Boundary & Corner

  it('6. Boundary Width 1023px (Mobile)', () => {
    resizeViewport(1023)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    const aside = document.querySelector('aside')
    expect(aside).toBeNull()
    const nav = document.querySelector('nav')
    expect(nav).not.toBeNull()
  })

  it('7. Boundary Width 1024px (Desktop)', () => {
    resizeViewport(1024)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    const aside = document.querySelector('aside')
    expect(aside).not.toBeNull()
    const nav = document.querySelector('nav.fixed')
    expect(nav).toBeNull()
  })

  it('8. Extreme Narrow Viewport (320px)', () => {
    resizeViewport(320)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    const aside = document.querySelector('aside')
    expect(aside).toBeNull()
    const nav = document.querySelector('nav')
    expect(nav).not.toBeNull()
  })

  it('9. Extreme Wide Viewport (2560px)', () => {
    resizeViewport(2560)
    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    const aside = document.querySelector('aside')
    expect(aside).not.toBeNull()
    const nav = document.querySelector('nav.fixed')
    expect(nav).toBeNull()
  })

  it('10. Rapid Resizing Transitions', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'))
    
    expect(result.current).toBe(false)

    // Perform rapid resize transitions
    act(() => {
      resizeViewport(1024)
      resizeViewport(500)
      resizeViewport(1200)
      resizeViewport(300)
      resizeViewport(1024)
    })

    expect(result.current).toBe(true)

    act(() => {
      resizeViewport(1023)
    })
    expect(result.current).toBe(false)
  })

  it('11. UpdateBanner Renders When needRefresh Is True', () => {
    act(() => {
      mockPwaController.triggerNeedRefresh()
    })

    render(
      <MemoryRouter>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </MemoryRouter>
    )

    expect(screen.getByText(/update available/i)).toBeInTheDocument()
  })
})
