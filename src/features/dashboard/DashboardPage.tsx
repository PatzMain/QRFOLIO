import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, QrCode, Scan, Star } from 'lucide-react'
import { useQRCodes } from '../../shared/hooks/useQRCodes'
import { useCategories } from '../../shared/hooks/useCategories'
import { Header } from '../../shared/components/layout/Header'
import { IconButton } from '../../shared/components/ui/IconButton'
import { Input } from '../../shared/components/ui/Input'
import { Tabs } from '../../shared/components/ui/Tabs'
import { EmptyState } from '../../shared/components/feedback/EmptyState'
import { QRCodeCard } from './components/QRCodeCard'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { qrCodes } = useQRCodes()
  const { categories } = useCategories()
  
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  // A2: Memoize tab options to prevent recreation on unrelated renders
  const categoryTabOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    ...categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })),
  ], [categories])

  // A2: Memoize filtered list — only recomputes when inputs change
  const filteredQRCodes = useMemo(() => qrCodes.filter((qr) => {
    // 1. Filter by category
    const categoryMatch = selectedCategory === 'all' || qr.categoryId === selectedCategory
    
    // 2. Filter by search query
    const searchMatch =
      !searchQuery.trim() ||
      qr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qr.type.toLowerCase().includes(searchQuery.toLowerCase())

    // 3. Filter by favorites
    const favoritesMatch = !showFavoritesOnly || qr.isFavorite

    return categoryMatch && searchMatch && favoritesMatch
  }), [qrCodes, selectedCategory, searchQuery, showFavoritesOnly])



  const headerRightAction = (
    <div className="flex items-center gap-2">
      <IconButton
        variant="ghost"
        size="sm"
        icon={<Scan className="h-5 w-5 text-brand-lightText/70 hover:text-brand-secondary" />}
        onClick={() => navigate('/scan')}
        aria-label="Scan QR Code"
      />
      <IconButton
        variant="primary"
        size="sm"
        icon={<Plus className="h-5 w-5" />}
        onClick={() => navigate('/generate')}
        aria-label="Create QR Code"
      />
    </div>
  )

  return (
    <>
      <Header
        title="Dashboard"
        showLogo
        rightAction={headerRightAction}
        showBackButton={false}
      />

      <div className="flex flex-col gap-4 flex-1 lg:p-6">
        {/* Search Bar */}
        <div className="flex items-center gap-2 mt-1 lg:max-w-md">
          <Input
            placeholder="Search codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="!py-2.5"
          />
          <IconButton
            variant={showFavoritesOnly ? 'primary' : 'secondary'}
            size="md"
            icon={<Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            aria-label="Filter favorites"
            className="!py-3"
          />
        </div>

        {/* Categories Tab Selector */}
        {categories.length > 0 && (
          <Tabs
            options={categoryTabOptions}
            selectedValue={selectedCategory}
            onChange={setSelectedCategory}
            className="py-1"
          />
        )}

        {/* QR Code List */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 min-h-[300px] auto-rows-min">
          {filteredQRCodes.length > 0 ? (
            filteredQRCodes.map((qr) => {
              const cat = categories.find((c) => c.id === qr.categoryId)
              return (
                <QRCodeCard
                  key={qr.id}
                  qrCode={qr}
                  category={cat}
                />
              )
            })
          ) : (
            <div className="col-span-full flex-1 flex items-center justify-center py-12">
              <EmptyState
                icon={QrCode}
                title={searchQuery || showFavoritesOnly ? "No codes found" : "No QR Codes yet"}
                description={
                  searchQuery || showFavoritesOnly
                    ? "Try adjusting your search query or filters"
                    : "Generate your first offline-first QR Code in seconds!"
                }
                actionLabel={searchQuery || showFavoritesOnly ? undefined : "Create QR Code"}
                onAction={searchQuery || showFavoritesOnly ? undefined : () => navigate('/generate')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
