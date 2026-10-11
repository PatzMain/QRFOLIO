import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DEFAULT_QR_STYLE } from '../../shared/constants'
import { ScannerPage } from './ScannerPage'

const camera = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), clear: vi.fn(), getCameras: vi.fn(), capabilities: vi.fn(), instances: [] as { isScanning: boolean; decode?: (text: string) => void }[] }))
const showToast = vi.hoisted(() => vi.fn())
vi.mock('html5-qrcode', () => ({ Html5Qrcode: class {
  isScanning = false
  decode?: (text: string) => void
  elementId: string
  constructor(elementId: string) { this.elementId = elementId; camera.instances.push(this) }
  static getCameras = camera.getCameras
  start = (_mode: unknown, _config: unknown, success: (text: string) => void) => {
    // html5-qrcode 2.3.8 reads this DOM element synchronously in start(), before
    // returning its promise. Its old async-only mock missed the broken retry.
    const element = document.getElementById(this.elementId)
    if (!element) throw new TypeError('Synthetic reader element is missing')
    if (camera.instances.some(instance => instance.isScanning)) throw new Error('Synthetic overlapping camera acquisition')
    this.decode = success
    return camera.start().then(() => { this.isScanning = true })
  }
  stop = async () => { await camera.stop(); this.isScanning = false }
  clear = camera.clear
  getRunningTrackCapabilities = camera.capabilities
} }))
vi.mock('../../shared/hooks/useQRCodes', () => ({ useQRCodes: () => ({ createQRCode: vi.fn() }) }))
vi.mock('../../shared/hooks/useCategories', () => ({ useCategories: () => ({ categories: [] }) }))
vi.mock('../../shared/hooks/useSettings', () => ({ useSettings: () => ({ settings: { defaultStyle: DEFAULT_QR_STYLE, hapticFeedback: false } }) }))
vi.mock('../../shared/components/ui/Toast', () => ({ useToast: () => ({ showToast }) }))

beforeEach(() => { camera.instances.length = 0; camera.start.mockReset().mockResolvedValue(undefined); camera.stop.mockReset().mockResolvedValue(undefined); camera.clear.mockClear(); camera.getCameras.mockReset(); camera.capabilities.mockReset().mockReturnValue({}); showToast.mockClear() })
afterEach(() => { cleanup(); vi.restoreAllMocks() })
it('shows camera denial and offers retry', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  camera.start.mockRejectedValue(new Error('Synthetic permission denial'))
  camera.getCameras.mockRejectedValue(new Error('Synthetic permission denial'))
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  expect(await screen.findByText('Camera Access Required')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Retry Access' })).toBeEnabled()
})
it('stops a camera whose pending startup finishes after navigation away', async () => {
  let finish!: () => void
  camera.start.mockImplementation(() => new Promise<void>(resolve => { finish = resolve }))
  const view = render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  await waitFor(() => expect(camera.start).toHaveBeenCalledOnce())
  view.unmount()
  await act(async () => { finish(); await Promise.resolve() })
  expect(camera.stop).toHaveBeenCalledOnce()
  expect(camera.clear).toHaveBeenCalledOnce()
  expect(camera.instances[0].isScanning).toBe(false)
})
it('stops the replacement camera when navigation happens during a camera switch', async () => {
  let finish!: () => void
  camera.start.mockResolvedValueOnce(undefined).mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
  const view = render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Flip Camera' }))
  await waitFor(() => expect(camera.instances).toHaveLength(2))
  view.unmount()
  await act(async () => { finish(); await Promise.resolve() })
  expect(camera.instances.every(instance => !instance.isScanning)).toBe(true)
  expect(camera.stop).toHaveBeenCalledTimes(2)
})

it('decodes two consecutive scans through the same connected reader without overlapping streams', async () => {
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  await screen.findByRole('button', { name: 'Flip Camera' })
  act(() => { camera.instances[0].decode?.('Synthetic first scan') })
  const retry = await screen.findByRole('button', { name: 'Scan Another Code' })
  await waitFor(() => expect(retry).toBeEnabled())
  expect(document.getElementById('qr-camera-reader')?.isConnected).toBe(true)
  fireEvent.click(retry)
  await screen.findByRole('button', { name: 'Flip Camera' })
  act(() => { camera.instances[1].decode?.('Synthetic second scan') })
  expect(await screen.findByText('Synthetic second scan')).toBeInTheDocument()
  await waitFor(() => expect(camera.instances.every(instance => !instance.isScanning)).toBe(true))
  expect(camera.start).toHaveBeenCalledTimes(2)
  expect(camera.stop).toHaveBeenCalledTimes(2)
})

it('waits for camera release before retry and accepts only the first decoded result', async () => {
  let release!: () => void
  camera.stop.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve }))
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  await screen.findByRole('button', { name: 'Flip Camera' })
  act(() => {
    camera.instances[0].decode?.('Synthetic accepted scan')
    camera.instances[0].decode?.('Synthetic duplicate scan')
  })
  const retry = await screen.findByRole('button', { name: 'Scan Another Code' })
  await waitFor(() => expect(camera.stop).toHaveBeenCalledOnce())
  expect(retry).toBeDisabled()
  fireEvent.click(retry)
  expect(camera.start).toHaveBeenCalledOnce()
  expect(screen.queryByText('Synthetic duplicate scan')).not.toBeInTheDocument()
  await act(async () => { release() })
  await waitFor(() => expect(retry).toBeEnabled())
  fireEvent.click(retry)
  await screen.findByRole('button', { name: 'Flip Camera' })
  expect(camera.start).toHaveBeenCalledTimes(2)
})

it('recovers from camera denial through retry without reloading the page', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  camera.start.mockRejectedValueOnce(new Error('Synthetic permission denial'))
  camera.getCameras.mockRejectedValueOnce(new Error('Synthetic permission denial'))
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Retry Access' }))
  expect(await screen.findByRole('button', { name: 'Flip Camera' })).toBeInTheDocument()
  expect(screen.queryByText('Camera Access Required')).not.toBeInTheDocument()
  expect(camera.start).toHaveBeenCalledTimes(2)
})

it('keeps a working camera usable when optional torch capability inspection fails', async () => {
  camera.capabilities.mockImplementation(() => { throw new Error('Synthetic capability inspection unsupported') })
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  expect(await screen.findByRole('button', { name: 'Flip Camera' })).toBeInTheDocument()
  expect(screen.queryByText('Camera Access Required')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Toggle Flashlight' })).not.toBeInTheDocument()
})

it('does not acquire a replacement camera while a previous stream fails to stop', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  camera.stop.mockRejectedValue(new Error('Synthetic camera release failure'))
  render(<MemoryRouter><ScannerPage /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Flip Camera' }))
  expect(await screen.findByText('Camera Access Required')).toBeInTheDocument()
  expect(camera.start).toHaveBeenCalledOnce()
  expect(camera.instances).toHaveLength(1)
})
