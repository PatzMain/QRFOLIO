import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback } from 'react'
import { db } from '../lib/db'
import { type Category } from '../types'
import { addLibraryCategory, deleteLibraryCategory, updateLibraryCategory } from '../lib/library'

export interface CategoryWithCount extends Category {
  codeCount: number
}

export const useCategories = () => {
  // A1: Single fetch + in-memory aggregation instead of N+1 sequential count() calls
  const categories = useLiveQuery(
    async () => {
      const [cats, allQRCodes] = await Promise.all([
        db.categories.orderBy('order').toArray(),
        db.qrcodes.toArray(),
      ])

      // Build a count map: categoryId -> count
      const countMap = allQRCodes.reduce<Record<string, number>>((acc, qr) => {
        if (qr.categoryId) {
          acc[qr.categoryId] = (acc[qr.categoryId] || 0) + 1
        }
        return acc
      }, {})

      return cats.map((cat) => ({
        ...cat,
        codeCount: countMap[cat.id] || 0,
      })) as CategoryWithCount[]
    },
    []
  ) || []

  // Get uncategorized count
  const uncategorizedCount = useLiveQuery(
    () => db.qrcodes.filter((qr) => qr.categoryId === null).count(),
    []
  ) || 0

  // A1: Use crypto.randomUUID() to avoid name-collision ID bugs
  const createCategory = useCallback(async (name: string, icon = 'Folder', color = '#6C5CE7') => {
    const id = crypto.randomUUID()
    const count = await db.categories.count()
    const newCat: Category = {
      id,
      name,
      icon,
      color,
      order: count,
      createdAt: new Date(),
    }
    await addLibraryCategory(newCat)
    return newCat
  }, [])

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    await updateLibraryCategory(id, data)
  }, [])

  const deleteCategory = useCallback(async (id: string, reassignToId: string | null = null) => {
    await deleteLibraryCategory(id, reassignToId)
  }, [])

  return {
    categories,
    uncategorizedCount,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
