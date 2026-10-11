import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Link,
  AlignLeft,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  User,
  MapPin,
  Calendar,
  Coins,
  Save
} from 'lucide-react'
import { Header } from '../../shared/components/layout/Header'
import { Input } from '../../shared/components/ui/Input'
import { Select } from '../../shared/components/ui/Select'
import { Button } from '../../shared/components/ui/Button'
import { Card } from '../../shared/components/ui/Card'
import { Tabs } from '../../shared/components/ui/Tabs'
import { type QRCodeType, type QRStyle } from '../../shared/types'
import { DEFAULT_QR_STYLE } from '../../shared/constants'
import { useQRCodes } from '../../shared/hooks/useQRCodes'
import { useCategories } from '../../shared/hooks/useCategories'
import { useToast } from '../../shared/components/ui/Toast'
import { useSettings } from '../../shared/hooks/useSettings'
import { encodeQRData } from '../../shared/lib/qr-utils'
import { MAX_QR_TITLE_LENGTH } from '../../shared/lib/backup'
import { storageErrorMessage } from '../../shared/lib/library'
import { TypeFormRenderer } from './components/TypeForms'
import { QRCodeSVG } from 'qrcode.react'
import {
  validateURL,
  validateEmail,
  validatePhone,
  validateWiFi,
  validateContact,
  validateLocation,
  validateCalendar,
  validateCrypto
} from '../../shared/lib/validators'

export const GeneratorPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getQRCode, createQRCode, updateQRCode } = useQRCodes()
  const { categories } = useCategories()
  const { showToast } = useToast()
  const { settings } = useSettings()

  const [isEditMode, setIsEditMode] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<QRCodeType>('url')
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [style, setStyle] = useState<QRStyle>(DEFAULT_QR_STYLE)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load code if editing
  useEffect(() => {
    if (id) {
      const loadQR = async () => {
        const qr = await getQRCode(id)
        if (qr) {
          setIsEditMode(true)
          setTitle(qr.title)
          setType(qr.type)
          setMetadata(qr.metadata)
          setCategoryId(qr.categoryId)
          setStyle(qr.style)
        } else {
          showToast('QR Code not found', 'error')
          navigate('/')
        }
      }
      loadQR()
    }
  }, [id, getQRCode, navigate, showToast])

  // Sync default QR colors from settings when not editing
  useEffect(() => {
    if (settings?.defaultStyle && !isEditMode) {
      const fg = settings.defaultStyle.foregroundColor
      const bg = settings.defaultStyle.backgroundColor
      const timer = setTimeout(() => {
        setStyle((prev) => ({
          ...prev,
          foregroundColor: fg,
          backgroundColor: bg,
        }))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [settings, isEditMode])


  const handleMetadataChange = (key: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  // A3: Memoize typeOptions array — no deps means created once, never recreated
  const typeOptions = useMemo(() => [
    { value: 'url', label: 'Link', icon: <Link className="h-3.5 w-3.5" /> },
    { value: 'text', label: 'Text', icon: <AlignLeft className="h-3.5 w-3.5" /> },
    { value: 'wifi', label: 'Wi-Fi', icon: <Wifi className="h-3.5 w-3.5" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
    { value: 'phone', label: 'Call', icon: <Phone className="h-3.5 w-3.5" /> },
    { value: 'sms', label: 'SMS', icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { value: 'contact', label: 'Contact', icon: <User className="h-3.5 w-3.5" /> },
    { value: 'location', label: 'Map', icon: <MapPin className="h-3.5 w-3.5" /> },
    { value: 'calendar', label: 'Event', icon: <Calendar className="h-3.5 w-3.5" /> },
    { value: 'crypto', label: 'Crypto', icon: <Coins className="h-3.5 w-3.5" /> },
  ], [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    }

    switch (type) {
      case 'url': {
        const err = validateURL(metadata.url)
        if (err) newErrors.url = err
        break
      }
      case 'text':
        if (!metadata.text) newErrors.text = 'Text content is required'
        break
      case 'email': {
        const err = validateEmail(metadata.email)
        if (err) newErrors.email = err
        break
      }
      case 'phone': {
        const err = validatePhone(metadata.phone)
        if (err) newErrors.phone = err
        break
      }
      case 'sms': {
        const err = validatePhone(metadata.phone)
        if (err) newErrors.phone = err
        break
      }
      case 'wifi': {
        const err = validateWiFi(metadata.ssid)
        if (err) newErrors.ssid = err
        break
      }
      case 'contact': {
        const err = validateContact(metadata.firstName, metadata.lastName)
        if (err) {
          newErrors.firstName = err
          newErrors.lastName = err
        }
        break
      }
      case 'location': {
        const errs = validateLocation(metadata.latitude, metadata.longitude)
        if (errs.latitude) newErrors.latitude = errs.latitude
        if (errs.longitude) newErrors.longitude = errs.longitude
        break
      }
      case 'calendar': {
        const errs = validateCalendar(metadata.title, metadata.start, metadata.end)
        if (errs.title) newErrors.title = errs.title
        if (errs.dateRange) newErrors.dateRange = errs.dateRange
        break
      }
      case 'crypto': {
        const err = validateCrypto(metadata.coin || 'bitcoin', metadata.address)
        if (err) newErrors.address = err
        break
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      const form = e.currentTarget
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      showToast('Please fix validation errors', 'error')
      return
    }

    const content = encodeQRData(type, metadata)

    try {
      if (isEditMode && id) {
        await updateQRCode(id, {
          title,
          type,
          metadata,
          categoryId: categoryId || null,
          style,
          content,
        })
        showToast('QR Code updated successfully', 'success')
        navigate(`/detail/${id}`)
      } else {
        const newQR = await createQRCode({
          title,
          type,
          metadata,
          categoryId: categoryId || null,
          style,
          content,
          isFavorite: false,
        })
        showToast('QR Code saved successfully', 'success')
        navigate(`/detail/${newQR.id}`)
      }
    } catch (err) {
      console.error(err)
      showToast(storageErrorMessage(err, 'Failed to save QR Code'), 'error')
    }
  }

  // A3: Memoize encoding — only recalculate when type or metadata change, not on errors/other state
  const generatedContent = useMemo(
    () => encodeQRData(type, metadata) || 'QRFolio',
    [type, metadata]
  )

  return (
    <>
      <Header
        title={isEditMode ? 'Edit QR Code' : 'Generate QR Code'}
        showBackButton
        onBack={() => navigate(-1)}
      />

      <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1 w-full pb-8 p-4 lg:p-6">
        {/* Left Column: Form Inputs */}
        <div className="flex-1 max-w-2xl flex flex-col gap-6 w-full">
          {/* Title and Category Row */}
          <div className="flex flex-col gap-4">
            <Input
              label="Name / Title"
              maxLength={MAX_QR_TITLE_LENGTH}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
              }}
              placeholder="My Portfolio Website"
              error={errors.title}
              required
            />
            <Select
              label="Assign Category"
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              options={[
                { value: '', label: 'Uncategorized' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          {/* Scrollable Type Selection Grid */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
              Select QR Type
            </label>
            <Tabs
              options={typeOptions}
              selectedValue={type}
              onChange={(val) => {
                setType(val as QRCodeType)
                if (!isEditMode) {
                  setMetadata({})
                  setErrors({})
                }
              }}
              className="py-1"
            />
          </div>

          {/* Dynamic Type Form */}
          <Card className="flex flex-col gap-4 border border-brand-lightText/5">
            <TypeFormRenderer
              type={type}
              metadata={metadata}
              onChange={handleMetadataChange}
              errors={errors}
            />
            {errors.dateRange && (
              <span className="text-xs text-red-500 px-1 font-medium">{errors.dateRange}</span>
            )}
          </Card>
        </div>

        {/* Right Column: Live Preview & Submit */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-6">
          {/* Live Preview and customization */}
          <div className="flex flex-col gap-4">
            <label className="text-xs font-semibold text-brand-lightText/60 px-1 uppercase tracking-wider">
              Live Preview
            </label>
            
            <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-brand-lightText/10 rounded-2xl gap-4">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRCodeSVG
                  value={generatedContent}
                  size={180}
                  fgColor={style.foregroundColor}
                  bgColor={style.backgroundColor}
                  level={style.errorCorrectionLevel}
                />
              </div>
              
              <p className="text-[10px] text-brand-lightText/40 font-mono text-center max-w-[250px] truncate">
                {generatedContent}
              </p>

              {/* Customizer */}
              <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-brand-lightText/10">
                <Input
                  label="Foreground Color"
                  type="color"
                  value={style.foregroundColor}
                  onChange={(e) => setStyle((prev) => ({ ...prev, foregroundColor: e.target.value }))}
                  className="h-10 !p-1 cursor-pointer !bg-transparent"
                />
                <Input
                  label="Background Color"
                  type="color"
                  value={style.backgroundColor}
                  onChange={(e) => setStyle((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="h-10 !p-1 cursor-pointer !bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full mt-4" leftIcon={<Save className="h-4 w-4" />}>
            {isEditMode ? 'Save Changes' : 'Save QR Code'}
          </Button>
        </div>
      </form>
    </>
  )
}
