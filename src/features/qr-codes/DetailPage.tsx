import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Edit2,
  ExternalLink,
  Share2,
  Copy,
  Star,
  Download
} from 'lucide-react'
import { Header } from '../../shared/components/layout/Header'
import { IconButton } from '../../shared/components/ui/IconButton'
import { Button } from '../../shared/components/ui/Button'
import { Card } from '../../shared/components/ui/Card'
import { Badge } from '../../shared/components/ui/Badge'
import { Modal } from '../../shared/components/ui/Modal'
import { Spinner } from '../../shared/components/feedback/Spinner'
import { useQRCodes } from '../../shared/hooks/useQRCodes'
import { useCategories } from '../../shared/hooks/useCategories'
import { useFavorites } from '../../shared/hooks/useFavorites'
import type { QRCode } from '../../shared/types'
import { useToast } from '../../shared/components/ui/Toast'
import { QRCodeSVG } from 'qrcode.react'
import { executeExternalAppHandler } from '../../shared/lib/qr-utils'

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getQRCode, deleteQRCode } = useQRCodes()
  const { categories } = useCategories()
  const { toggleFavorite } = useFavorites()
  const { showToast } = useToast()

  const [qrCode, setQrCode] = useState<QRCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Fetch QR Code — showToast intentionally excluded from deps to prevent
  // the effect from re-running on every render (showToast identity changes).
  useEffect(() => {
    if (id) {
      const loadQR = async () => {
        const qr = await getQRCode(id)
        if (qr) {
          setQrCode(qr)
        } else {
          showToast('QR Code not found', 'error')
          navigate('/')
        }
        setLoading(false)
      }
      loadQR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!qrCode) return null

  const category = categories.find((c) => c.id === qrCode.categoryId)

  const handleToggleFavorite = async () => {
    if (!id) return
    try {
      await toggleFavorite(id)
      setQrCode((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
      showToast(
        qrCode.isFavorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      )
    } catch {
      showToast('Failed to update favorite status', 'error')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode.content)
      showToast('Copied content to clipboard', 'success')
    } catch {
      showToast('Failed to copy content', 'error')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: qrCode.title,
          text: qrCode.content,
        })
        showToast('Shared successfully', 'success')
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback
      handleCopy()
    }
  }

  const handleOpenAction = () => {
    if (!qrCode) return
    executeExternalAppHandler(qrCode.content, qrCode.type, showToast)
  }

  const handleDelete = async () => {
    if (!id || isDeleting) return
    setIsDeleting(true)
    try {
      await deleteQRCode(id)
      setIsDeleteModalOpen(false)
      showToast('QR Code deleted', 'success')
      navigate('/')
    } catch {
      showToast('Failed to delete QR Code', 'error')
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    const svgEl = qrCodeRef.current?.querySelector('svg')
    if (!svgEl) {
      showToast('QR Code element not found', 'error')
      return
    }

    try {
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext('2d')
        if (context) {
          context.fillStyle = '#FFFFFF'
          context.fillRect(0, 0, 512, 512)
          context.drawImage(image, 0, 0, 512, 512)
          
          const png = canvas.toDataURL('image/png')
          const downloadLink = document.createElement('a')
          downloadLink.href = png
          downloadLink.download = `${qrCode.title.replace(/\s+/g, '_')}_qr.png`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
        URL.revokeObjectURL(blobURL)
      }
      image.src = blobURL
      showToast('QR Code downloaded as PNG', 'success')
    } catch (err) {
      console.error(err)
      showToast('Failed to download QR Code', 'error')
    }
  }

  const detailHeaderRight = (
    <div className="flex items-center gap-1">
      <IconButton
        variant="ghost"
        size="sm"
        icon={<Star className={`h-5 w-5 ${qrCode.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-brand-lightText/70'}`} />}
        onClick={handleToggleFavorite}
        aria-label={qrCode.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      />
      <IconButton
        variant="ghost"
        size="sm"
        icon={<Edit2 className="h-5 w-5 text-brand-lightText/70" />}
        onClick={() => navigate(`/edit/${id}`)}
        aria-label="Edit QR Code"
      />
    </div>
  )

  const deleteModalFooter = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
        Cancel
      </Button>
      <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
    </>
  )

  return (
    <>
      <Header
        title={qrCode.title}
        showBackButton
        onBack={() => navigate(-1)}
        rightAction={detailHeaderRight}
      />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1 max-w-sm lg:max-w-3xl mx-auto w-full pt-4 pb-8 items-center lg:items-start text-center lg:text-left lg:p-6">
        {/* Large Glass QR Code Card */}
        <Card className="flex flex-col items-center justify-center p-8 border border-brand-lightText/10 shadow-glass w-full aspect-square max-w-[280px] shrink-0">
          <div ref={qrCodeRef} className="bg-white p-4 rounded-2xl shadow-xl">
            <QRCodeSVG
              value={qrCode.content}
              size={180}
              fgColor={qrCode.style.foregroundColor}
              bgColor={qrCode.style.backgroundColor}
              level={qrCode.style.errorCorrectionLevel}
            />
          </div>
        </Card>

        {/* Details & Actions Column */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-6 w-full">
          {/* Category & Metadata Details */}
          <div className="flex flex-col items-center lg:items-start gap-3 w-full">
            {category ? (
              <Badge
                variant="secondary"
                className="py-1 px-3 border"
                style={{
                  borderColor: category.color ? `${category.color}40` : undefined,
                  color: category.color || undefined,
                }}
              >
                {category.name}
              </Badge>
            ) : (
              <Badge variant="other" className="py-1 px-3">
                Uncategorized
              </Badge>
            )}

            <p className="text-sm font-semibold text-brand-lightText/85 break-all max-w-[280px] lg:max-w-none font-mono px-4 lg:px-0">
              {qrCode.content}
            </p>
          </div>

          {/* Circular Action Row */}
          <div className="flex items-center justify-center lg:justify-start gap-6 w-full py-4 border-y border-brand-lightText/5">
            <div className="flex flex-col items-center gap-1.5">
              <IconButton
                variant="secondary"
                size="lg"
                icon={<ExternalLink className="h-5 w-5" />}
                onClick={handleOpenAction}
                aria-label="Open Link"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-lightText/40">Open</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <IconButton
                variant="secondary"
                size="lg"
                icon={<Share2 className="h-5 w-5" />}
                onClick={handleShare}
                aria-label="Share Link"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-lightText/40">Share</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <IconButton
                variant="secondary"
                size="lg"
                icon={<Copy className="h-5 w-5" />}
                onClick={handleCopy}
                aria-label="Copy Content"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-lightText/40">Copy</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <IconButton
                variant="secondary"
                size="lg"
                icon={<Download className="h-5 w-5" />}
                onClick={handleDownload}
                aria-label="Download QR"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-lightText/40">Download</span>
            </div>
          </div>

          {/* Edit and Delete Buttons */}
          <div className="flex flex-col gap-3 w-full mt-2">
            <Button variant="secondary" className="w-full" onClick={() => navigate(`/edit/${id}`)}>
              Edit Code
            </Button>
            <Button variant="danger" className="w-full" onClick={() => setIsDeleteModalOpen(true)}>
              Delete Code
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete QR Code"
        footer={deleteModalFooter}
      >
        <p className="text-sm text-brand-lightText/70">
          Are you sure you want to delete <span className="font-semibold text-brand-lightText">"{qrCode.title}"</span>? This action cannot be undone.
        </p>
      </Modal>
    </>
  )
}
