import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Folder,
  Plus,
  ChevronRight,
  Trash2,
  Edit2,
  FolderOpen
} from 'lucide-react'
import { Header } from '../../shared/components/layout/Header'
import { IconButton } from '../../shared/components/ui/IconButton'
import { Button } from '../../shared/components/ui/Button'
import { Card } from '../../shared/components/ui/Card'
import { Input } from '../../shared/components/ui/Input'
import { Modal } from '../../shared/components/ui/Modal'
import { useCategories } from '../../shared/hooks/useCategories'
import { useQRCodes } from '../../shared/hooks/useQRCodes'
import { useToast } from '../../shared/components/ui/Toast'
import { QRCodeCard } from '../dashboard/components/QRCodeCard'
import { MAX_CATEGORY_NAME_LENGTH } from '../../shared/lib/backup'
import { storageErrorMessage } from '../../shared/lib/library'

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate()
  const { categories, uncategorizedCount, createCategory, updateCategory, deleteCategory } = useCategories()
  const { qrCodes } = useQRCodes()
  const { showToast } = useToast()

  // Navigation within categories page (List vs Category Detail)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null)

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Form Fields
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6C5CE7')
  const [editingCatId, setEditingCatId] = useState('')
  const [editingCatName, setEditingCatName] = useState('')
  const [editingCatColor, setEditingCatColor] = useState('#6C5CE7')

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    try {
      await createCategory(newCatName.trim(), 'Folder', newCatColor)
      showToast('Category created successfully', 'success')
      setNewCatName('')
      setNewCatColor('#6C5CE7')
      setIsAddModalOpen(false)
    } catch (error) {
      showToast(storageErrorMessage(error, 'Failed to create category'), 'error')
    }
  }

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCatName.trim() || !editingCatId) return
    try {
      await updateCategory(editingCatId, {
        name: editingCatName.trim(),
        color: editingCatColor,
      })
      showToast('Category updated successfully', 'success')
      setIsEditModalOpen(false)
    } catch (error) {
      showToast(storageErrorMessage(error, 'Failed to update category'), 'error')
    }
  }

  const handleDeleteCategory = async () => {
    if (!editingCatId) return
    try {
      await deleteCategory(editingCatId)
      showToast('Category deleted successfully', 'success')
      setIsDeleteModalOpen(false)
      setSelectedCatId(null)
    } catch {
      showToast('Failed to delete category', 'error')
    }
  }

  // Get active category details
  const activeCategory = selectedCatId ? categories.find((c) => c.id === selectedCatId) : null
  
  // Filter codes for selected category
  const filteredQRCodes = selectedCatId
    ? selectedCatId === 'uncategorized'
      ? qrCodes.filter((qr) => qr.categoryId === null)
      : qrCodes.filter((qr) => qr.categoryId === selectedCatId)
    : []

  const totalCodesCount = qrCodes.length

  const addModalFooter = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" size="sm" onClick={handleAddCategory}>
        Add Category
      </Button>
    </>
  )

  const editModalFooter = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" size="sm" onClick={handleEditCategory}>
        Save Changes
      </Button>
    </>
  )

  const deleteModalFooter = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsDeleteModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" size="sm" onClick={handleDeleteCategory}>
        Delete
      </Button>
    </>
  )

  // 1. DETAIL VIEW (Viewing a specific category's QR codes)
  if (selectedCatId) {
    const titleText = selectedCatId === 'uncategorized' ? 'Uncategorized' : activeCategory?.name || 'Category'
    
    const detailRightActions = selectedCatId !== 'uncategorized' && activeCategory ? (
      <div className="flex items-center gap-1">
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Edit2 className="h-4 w-4" />}
          onClick={() => {
            setEditingCatId(activeCategory.id)
            setEditingCatName(activeCategory.name)
            setEditingCatColor(activeCategory.color || '#6C5CE7')
            setIsEditModalOpen(true)
          }}
          aria-label="Edit Category"
        />
        <IconButton
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4 text-red-500" />}
          onClick={() => {
            setEditingCatId(activeCategory.id)
            setIsDeleteModalOpen(true)
          }}
          aria-label="Delete Category"
        />
      </div>
    ) : undefined

    return (
      <>
        <Header
          title={titleText}
          showBackButton
          onBack={() => setSelectedCatId(null)}
          rightAction={detailRightActions}
        />

        <div className="flex flex-col gap-4 flex-1 w-full max-w-sm lg:max-w-none mx-auto pt-2 pb-8 lg:p-6">
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 min-h-[300px] auto-rows-min">
            {filteredQRCodes.length > 0 ? (
              filteredQRCodes.map((qr) => (
                <QRCodeCard
                  key={qr.id}
                  qrCode={qr}
                  category={activeCategory || undefined}
                />
              ))
            ) : (
              <div className="col-span-full flex-1 flex items-center justify-center py-12">
                <p className="text-sm text-brand-lightText/40">No QR codes in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Category Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Category"
          footer={editModalFooter}
        >
          <form onSubmit={handleEditCategory} className="flex flex-col gap-4">
            <Input
              label="Category Name"
              value={editingCatName}
              maxLength={MAX_CATEGORY_NAME_LENGTH}
              onChange={(e) => setEditingCatName(e.target.value)}
              placeholder="e.g. Work"
              required
            />
            <Input
              label="Category Color"
              type="color"
              value={editingCatColor}
              onChange={(e) => setEditingCatColor(e.target.value)}
              className="h-10 !p-1 cursor-pointer !bg-transparent"
            />
          </form>
        </Modal>

        {/* Delete Category Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Category"
          footer={deleteModalFooter}
        >
          <p className="text-sm text-brand-lightText/70">
            Are you sure you want to delete <span className="font-semibold text-brand-lightText">"{activeCategory?.name}"</span>? Any QR codes in this category will become Uncategorized.
          </p>
        </Modal>
      </>
    )
  }

  // 2. LIST VIEW (Viewing all categories)
  return (
    <>
      <Header
        title="Categories"
        rightAction={
          <IconButton
            variant="primary"
            size="sm"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add Category"
          />
        }
      />

      <div className="flex flex-col gap-4 flex-1 w-full max-w-sm lg:max-w-none mx-auto pt-2 pb-8 lg:p-6">
        <div className="flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {/* Default 'All Codes' row */}
          <Card
            hoverable
            pressable
            onClick={() => navigate('/')}
            className="flex items-center justify-between border border-brand-lightText/5"
          >
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-2.5 rounded-xl text-brand-primary flex items-center justify-center">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-brand-lightText">All Codes</span>
                <span className="text-xs text-brand-lightText/50">{totalCodesCount} codes</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-lightText/30" />
          </Card>

          {/* Dynamic Categories List */}
          {categories.map((cat) => (
            <Card
              key={cat.id}
              hoverable
              pressable
              onClick={() => setSelectedCatId(cat.id)}
              className="flex items-center justify-between border border-brand-lightText/5"
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl flex items-center justify-center text-white border"
                  style={{
                    backgroundColor: cat.color ? `${cat.color}20` : undefined,
                    borderColor: cat.color ? `${cat.color}40` : undefined,
                    color: cat.color || undefined,
                  }}
                >
                  <Folder className="h-5 w-5 fill-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-lightText">{cat.name}</span>
                  <span className="text-xs text-brand-lightText/50">{cat.codeCount} codes</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-lightText/30" />
            </Card>
          ))}

          {/* Uncategorized codes row */}
          {uncategorizedCount > 0 && (
            <Card
              hoverable
              pressable
              onClick={() => setSelectedCatId('uncategorized')}
              className="flex items-center justify-between border border-brand-lightText/5"
            >
              <div className="flex items-center gap-3">
                <div className="bg-brand-lightText/5 border border-brand-lightText/10 p-2.5 rounded-xl text-brand-lightText/50 flex items-center justify-center">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-lightText">Uncategorized</span>
                  <span className="text-xs text-brand-lightText/50">{uncategorizedCount} codes</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-lightText/30" />
            </Card>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Category"
        footer={addModalFooter}
      >
        <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
          <Input
            label="Category Name"
            value={newCatName}
            maxLength={MAX_CATEGORY_NAME_LENGTH}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Personal"
            required
            autoFocus
          />
          <Input
            label="Category Color"
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            className="h-10 !p-1 cursor-pointer !bg-transparent"
          />
        </form>
      </Modal>
    </>
  )
}
