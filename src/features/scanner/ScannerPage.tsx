import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Zap,
  ZapOff,
  SwitchCamera
} from 'lucide-react'
import { Header } from '../../shared/components/layout/Header'
import { IconButton } from '../../shared/components/ui/IconButton'
import { Button } from '../../shared/components/ui/Button'
import { Card } from '../../shared/components/ui/Card'
import { Input } from '../../shared/components/ui/Input'
import { Select } from '../../shared/components/ui/Select'
import { Modal } from '../../shared/components/ui/Modal'
import { useQRCodes } from '../../shared/hooks/useQRCodes'
import { useCategories } from '../../shared/hooks/useCategories'
import { useToast } from '../../shared/components/ui/Toast'
import { useSettings } from '../../shared/hooks/useSettings'
import { parseQRCodeContent, executeExternalAppHandler } from '../../shared/lib/qr-utils'
import { storageErrorMessage } from '../../shared/lib/library'

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate()
  const { createQRCode } = useQRCodes()
  const { categories } = useCategories()
  const { showToast } = useToast()
  const { settings } = useSettings()

  const [scanResult, setScanResult] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [torchActive, setTorchActive] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  // Save Scanned Code Form Fields
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [saveTitle, setSaveTitle] = useState('')
  const [saveCategoryId, setSaveCategoryId] = useState<string | null>(null)

  // Custom QR colors for scanned code saving
  const [foregroundColor, setForegroundColor] = useState('#6C5CE7')
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')

  // Sync with default settings colors once loaded
  useEffect(() => {
    if (settings?.defaultStyle) {
      const fg = settings.defaultStyle.foregroundColor
      const bg = settings.defaultStyle.backgroundColor
      const timer = setTimeout(() => {
        setForegroundColor(fg)
        setBackgroundColor(bg)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [settings])

  type FacingMode = 'environment' | 'user'
  const [cameraRequest, setCameraRequest] = useState<{ mode: FacingMode; previousMode?: FacingMode; attempt: number }>({ mode: 'environment', attempt: 0 })
  const [isCameraBusy, setIsCameraBusy] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(false)
  const cameraQueueRef = useRef<Promise<void>>(Promise.resolve())
  const cameraBusyRef = useRef(true)
  const workingFacingModeRef = useRef<FacingMode>('environment')
  const hapticFeedbackRef = useRef(settings.hapticFeedback)
  const qrReaderId = 'qr-camera-reader'

  useEffect(() => { hapticFeedbackRef.current = settings.hapticFeedback }, [settings.hapticFeedback])

  // The decoder starts synchronously against its reader element. Serialize every
  // start/stop, including pending starts during navigation and Strict Mode replay.
  const queueCameraOperation = useCallback((operation: () => Promise<void>) => {
    const pending = cameraQueueRef.current.then(operation)
    cameraQueueRef.current = pending.catch(() => {})
    return pending
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    let qrScanner: Html5Qrcode | null = null
    let cleared = false
    let scanHandled = false

    const stopScanner = async () => {
      if (!qrScanner || cleared) return
      if (qrScanner.isScanning) await qrScanner.stop()
      qrScanner.clear()
      cleared = true
      if (html5QrcodeRef.current === qrScanner) html5QrcodeRef.current = null
    }

    const handleScanSuccess = (text: string) => {
      if (cancelled || scanHandled) return
      scanHandled = true
      cameraBusyRef.current = true
      setIsCameraBusy(true)
      setIsCameraActive(false)
      setTorchActive(false)
      setScanResult(text)
      setSaveTitle(`Scanned ${parseQRCodeContent(text).type.toUpperCase()}`)
      if (hapticFeedbackRef.current && 'vibrate' in navigator) navigator.vibrate(100)
      void queueCameraOperation(async () => {
        try { await stopScanner() }
        catch (error) { console.error('Failed to stop camera after scan success:', error) }
        if (!cancelled) {
          cameraBusyRef.current = false
          setIsCameraBusy(false)
        }
      })
    }

    void queueCameraOperation(async () => {
      if (cancelled) return
      cameraBusyRef.current = true
      setIsCameraBusy(true)
      setIsCameraActive(false)
      setHasPermission(null)
      setTorchActive(false)
      setTorchSupported(false)
      try {
        // A failed previous stop must finish before acquiring another stream.
        const previousScanner = html5QrcodeRef.current
        if (previousScanner) {
          if (previousScanner.isScanning) await previousScanner.stop()
          previousScanner.clear()
          if (cancelled) return
          html5QrcodeRef.current = null
        }
        qrScanner = new Html5Qrcode(qrReaderId)
        html5QrcodeRef.current = qrScanner
        const scanner = qrScanner
        const start = (mode: FacingMode) => scanner.start({ facingMode: mode }, { fps: 8 }, handleScanSuccess, () => {})
        let workingMode = cameraRequest.mode
        try { await start(workingMode) }
        catch (startError) {
          if (cancelled) return
          if (cameraRequest.previousMode) {
            showToast('Could not switch camera', 'error')
            workingMode = cameraRequest.previousMode
            await start(workingMode)
          } else {
            const devices = await Html5Qrcode.getCameras()
            if (cancelled) return
            if (!devices.length) throw startError
            await scanner.start(devices[devices.length - 1].id, { fps: 8 }, handleScanSuccess, () => {})
          }
        }
        if (cancelled) { await stopScanner(); return }
        workingFacingModeRef.current = workingMode
        setHasPermission(true)
        if (!scanHandled) {
          setIsCameraActive(true)
          // Optional capability inspection must not turn a working camera into an error.
          try {
            const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean }
            setTorchSupported(capabilities.torch === true)
          } catch { setTorchSupported(false) }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Camera startup error:', error)
          setHasPermission(false)
          setIsCameraActive(false)
        }
      } finally {
        if (!cancelled && !scanHandled) {
          cameraBusyRef.current = false
          setIsCameraBusy(false)
        }
      }
    })

    return () => {
      cancelled = true
      mountedRef.current = false
      void queueCameraOperation(async () => {
        try { await stopScanner() }
        catch (error) { console.error('Failed to stop camera scanner on unmount:', error) }
      })
    }
  }, [cameraRequest, queueCameraOperation, showToast])

  const handleToggleTorch = async () => {
    const scanner = html5QrcodeRef.current
    if (!scanner?.isScanning || !torchSupported || cameraBusyRef.current) return
    cameraBusyRef.current = true
    setIsCameraBusy(true)
    await queueCameraOperation(async () => {
      try {
        const nextTorchState = !torchActive
        await scanner.applyVideoConstraints({ advanced: [{ torch: nextTorchState } as MediaTrackConstraintSet] })
        if (mountedRef.current && scanner === html5QrcodeRef.current && scanner.isScanning) setTorchActive(nextTorchState)
      } catch { if (mountedRef.current) showToast('Flashlight not available', 'error') }
      finally {
        cameraBusyRef.current = false
        if (mountedRef.current) setIsCameraBusy(false)
      }
    })
  }

  const handleFlipCamera = () => {
    if (!html5QrcodeRef.current?.isScanning || cameraBusyRef.current) return
    cameraBusyRef.current = true
    setIsCameraBusy(true)
    setIsCameraActive(false)
    const previousMode = workingFacingModeRef.current
    setCameraRequest(request => ({ mode: previousMode === 'environment' ? 'user' : 'environment', previousMode, attempt: request.attempt + 1 }))
  }

  const handleCopy = async () => {
    if (!scanResult) return
    try {
      await navigator.clipboard.writeText(scanResult)
      showToast('Copied content to clipboard', 'success')
    } catch {
      showToast('Failed to copy', 'error')
    }
  }

  const handleOpenLink = () => {
    if (!scanResult) return
    const parsed = parseQRCodeContent(scanResult)
    if (parsed.type === 'url') {
      setIsConfirmOpen(true)
    } else {
      executeExternalAppHandler(scanResult, parsed.type, showToast)
    }
  }

  const handleConfirmOpenLink = () => {
    if (!scanResult) return
    setIsConfirmOpen(false)
    executeExternalAppHandler(scanResult, 'url', showToast)
  }

  const handleSaveToLibrary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanResult || isSaving) return
    if (!saveTitle.trim()) {
      showToast('Title is required to save', 'error')
      return
    }

    const parsed = parseQRCodeContent(scanResult)
    setIsSaving(true)

    try {
      await createQRCode({
        title: saveTitle,
        type: parsed.type,
        metadata: parsed.metadata,
        categoryId: saveCategoryId || null,
        style: {
          foregroundColor: foregroundColor,
          backgroundColor: backgroundColor,
          dotsStyle: 'square',
          cornersSquareStyle: 'square',
          cornersDotStyle: 'square',
          errorCorrectionLevel: 'M',
          size: 300,
          margin: 4,
        },
        content: scanResult,
        isFavorite: false,
      })
      showToast('Saved to QRFolio', 'success')
      navigate('/')
    } catch (error) {
      showToast(storageErrorMessage(error, 'Failed to save QR Code'), 'error')
      setIsSaving(false)
    }
  }

  const handleResetScanner = () => {
    if (cameraBusyRef.current) return
    cameraBusyRef.current = true
    setIsCameraBusy(true)
    setIsCameraActive(false)
    setScanResult(null)
    setSaveTitle('')
    setSaveCategoryId(null)
    setTorchActive(false)
    setIsSaving(false)

    // Reset colors to settings defaults
    if (settings?.defaultStyle) {
      setForegroundColor(settings.defaultStyle.foregroundColor)
      setBackgroundColor(settings.defaultStyle.backgroundColor)
    } else {
      setForegroundColor('#6C5CE7')
      setBackgroundColor('#FFFFFF')
    }

    setCameraRequest(request => ({ mode: workingFacingModeRef.current, attempt: request.attempt + 1 }))
  }

  const parsedResult = scanResult ? parseQRCodeContent(scanResult) : null

  return (
    <>
      <Header
        title="Scan QR Code"
        showBackButton
        onBack={() => navigate(-1)}
        rightAction={
          torchSupported && isCameraActive ? (
            <IconButton
              variant="ghost"
              size="sm"
              icon={torchActive ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5 text-yellow-400" />}
              onClick={handleToggleTorch}
              disabled={isCameraBusy}
              aria-label="Toggle Flashlight"
            />
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6 flex-1 max-w-sm lg:max-w-2xl mx-auto w-full pt-4 pb-8 items-center justify-center relative lg:p-6">
        {/* Scanner Viewfinder */}
          <div hidden={scanResult !== null} className="relative w-full aspect-square max-w-[280px] lg:max-w-[400px] bg-black border border-brand-lightText/10 rounded-2xl overflow-hidden shadow-glass">
            <div id={qrReaderId} className="w-full h-full object-cover" />
            
            {/* Target Scanning Overlay Frame (guides user to the full 1x1 scanning square) */}
            {isCameraActive && (
              <div className="absolute inset-4 pointer-events-none animate-pulse">
                {/* Thin guidelines */}
                <div className="absolute inset-0 border border-brand-primary/20 rounded-xl" />
                {/* Corner Brackets */}
                <div className="absolute -top-[1px] -left-[1px] w-6 h-6 border-t-[3px] border-l-[3px] border-brand-primary rounded-tl-lg" />
                <div className="absolute -top-[1px] -right-[1px] w-6 h-6 border-t-[3px] border-r-[3px] border-brand-primary rounded-tr-lg" />
                <div className="absolute -bottom-[1px] -left-[1px] w-6 h-6 border-b-[3px] border-l-[3px] border-brand-primary rounded-bl-lg" />
                <div className="absolute -bottom-[1px] -right-[1px] w-6 h-6 border-b-[3px] border-r-[3px] border-brand-primary rounded-br-lg" />
              </div>
            )}

            {/* Error / No Permission view */}
            {hasPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 bg-brand-darkSurface/90 z-10">
                <Camera className="h-10 w-10 text-brand-lightText/40" />
                <h3 className="text-sm font-bold">Camera Access Required</h3>
                <p className="text-xs text-brand-lightText/60 leading-relaxed">
                  Please enable camera permission in your browser settings to scan QR codes.
                </p>
                <Button size="sm" className="mt-2" disabled={isCameraBusy} onClick={handleResetScanner}>
                  Retry Access
                </Button>
              </div>
            )}

            {/* Flip Camera Button overlay */}
            {isCameraActive && (
              <div className="absolute bottom-4 right-4 z-20">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  disabled={isCameraBusy}
                  className="p-2.5 rounded-xl bg-brand-darkBg/80 backdrop-blur-md border border-brand-lightText/15 text-brand-lightText hover:bg-brand-darkBg transition-all duration-200 active:scale-95 outline-none flex items-center justify-center cursor-pointer shadow-lg"
                  aria-label="Flip Camera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

        {/* Scan Result Panel */}
        {scanResult && parsedResult && (
          <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
              <div className="flex-1 w-full flex flex-col gap-4">
                <Card className="flex flex-col gap-4 border border-brand-primary/20 w-full animate-fade-in">
                  <div className="flex flex-col gap-1 items-center text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                      Scan Successful ({parsedResult.type.toUpperCase()})
                    </span>
                    <p className="text-sm font-semibold font-mono text-brand-lightText/85 break-all mt-2 p-3 bg-brand-darkBg/60 rounded-xl border border-brand-lightText/5 w-full">
                      {scanResult}
                    </p>
                  </div>

                  {/* Actions row */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button variant="secondary" onClick={handleCopy} leftIcon={<Copy className="h-4 w-4" />}>
                      Copy Raw
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleOpenLink}
                      leftIcon={<ExternalLink className="h-4 w-4" />}
                      disabled={!scanResult}
                    >
                      Open Content
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Form to Save Code to Dexie */}
              <form onSubmit={handleSaveToLibrary} className="flex-1 w-full flex flex-col gap-4">
                <h3 className="text-xs font-semibold text-brand-lightText/60 uppercase tracking-wider px-1">
                  Save to Library
                </h3>
                <Card className="flex flex-col gap-4 border border-brand-lightText/5">
                  <Input
                    label="Name / Title"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Scanned URL"
                    maxLength={512}
                    required
                  />
                  <Select
                    label="Select Category"
                    value={saveCategoryId || ''}
                    onChange={(e) => setSaveCategoryId(e.target.value || null)}
                    options={[
                      { value: '', label: 'Uncategorized' },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />

                  {/* QR Color Customization Row */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-brand-lightText/5">
                    <Input
                      label="Foreground Color"
                      type="color"
                      value={foregroundColor}
                      onChange={(e) => setForegroundColor(e.target.value)}
                      className="h-10 !p-1 cursor-pointer !bg-transparent"
                    />
                    <Input
                      label="Background Color"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="h-10 !p-1 cursor-pointer !bg-transparent"
                    />
                  </div>

                  <Button type="submit" leftIcon={<Plus className="h-4 w-4" />} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Add to QRFolio'}
                  </Button>
                </Card>
              </form>
            </div>

            <Button variant="ghost" onClick={handleResetScanner} disabled={isCameraBusy} leftIcon={<RefreshCw className="h-4 w-4" />} className="w-full">
              Scan Another Code
            </Button>
          </div>
        )}

        {/* Tip Text */}
        {!scanResult && hasPermission && (
          <p className="text-xs text-brand-lightText/40 font-medium text-center">
            Position the QR code inside the viewfinder window to scan.
          </p>
        )}
      </div>

      {/* External Link Redirect Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Open External Link?"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmOpenLink}>
              Open Link
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-brand-lightText/70">
            You are about to navigate away to the following external address. Please make sure you trust this destination:
          </p>
          <p className="text-xs font-mono font-semibold text-brand-primary break-all bg-white/5 border border-brand-lightText/10 p-3 rounded-xl select-all mt-1">
            {scanResult}
          </p>
        </div>
      </Modal>
    </>
  )
}
