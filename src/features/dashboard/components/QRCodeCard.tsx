import React from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Card } from '../../../shared/components/ui/Card'
import { Badge } from '../../../shared/components/ui/Badge'
import { type QRCode, type Category } from '../../../shared/types'
import { Star, ArrowRight } from 'lucide-react'

export interface QRCodeCardProps {
  qrCode: QRCode
  category?: Category
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ qrCode, category }) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/detail/${qrCode.id}`)
  }

  // Format date nicely
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card
      hoverable
      pressable
      onClick={handleCardClick}
      className="flex items-center gap-4 relative overflow-hidden group border border-brand-lightText/5 hover:border-brand-primary/20"
    >
      {/* Decorative vertical category color strip */}
      {category?.color && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: category.color }}
        />
      )}

      {/* QR Code Mini Thumbnail */}
      <div className="bg-white p-1.5 rounded-lg flex-shrink-0 flex items-center justify-center shadow-md">
        <QRCodeSVG
          value={qrCode.content}
          size={48}
          fgColor={qrCode.style.foregroundColor || '#000000'}
          bgColor={qrCode.style.backgroundColor || '#FFFFFF'}
          level={qrCode.style.errorCorrectionLevel || 'M'}
        />
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-brand-lightText truncate">
            {qrCode.title}
          </h3>
          {qrCode.isFavorite && (
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-brand-lightText/50 truncate font-mono">
          {qrCode.content}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {category ? (
            <Badge
              variant="secondary"
              className="text-[9px] py-0 px-2"
              style={{
                borderColor: category.color ? `${category.color}40` : undefined,
                color: category.color || undefined,
              }}
            >
              {category.name}
            </Badge>
          ) : (
            <Badge variant="other" className="text-[9px] py-0 px-2">
              Uncategorized
            </Badge>
          )}
          <span className="text-[10px] text-brand-lightText/40 font-medium">
            {formatDate(qrCode.createdAt)}
          </span>
        </div>
      </div>

      {/* Chevron Right on Hover */}
      <div className="text-brand-lightText/30 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all duration-200">
        <ArrowRight className="h-4 w-4" />
      </div>
    </Card>
  )
}
