/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../../shared/lib/db'
import { DEFAULT_CATEGORIES, DEFAULT_QR_STYLE } from '../../shared/constants'
import { Spinner } from '../../shared/components/feedback/Spinner'

interface DatabaseContextType {
  isInitialized: boolean
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [initializationError, setInitializationError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    const initializeDb = async () => {
      try {
        await db.transaction('rw', [db.categories, db.settings], async () => {
        // Seed categories if empty
        const categoryCount = await db.categories.count()
        if (categoryCount === 0) {
          const categorySeed = DEFAULT_CATEGORIES.map((cat) => ({
            ...cat,
            createdAt: new Date(),
          }))
          await db.categories.bulkAdd(categorySeed)
        }

        // Seed settings if empty
        const settingsCount = await db.settings.count()
        if (settingsCount === 0) {
          await db.settings.add({
            id: 'app-settings',
            defaultStyle: DEFAULT_QR_STYLE,
            defaultCategoryId: null,
            exportFormat: 'json',
            hapticFeedback: true,
            reducedMotion: false,
          })
        }
        })
        if (!cancelled) { setInitializationError(false); setIsInitialized(true) }
      } catch (error) {
        console.error('Failed to initialize database:', error)
        if (!cancelled) setInitializationError(true)
      }
    }

    initializeDb()
    return () => { cancelled = true }
  }, [attempt])

  if (initializationError) {
    return <div className="min-h-screen bg-brand-darkBg flex flex-col items-center justify-center gap-4 p-6 text-center" role="alert">
      <p>QRFolio could not open local storage. Check browser storage permissions and available space, then try again.</p>
      <button type="button" className="glass-button-primary px-4 py-2" onClick={() => { setInitializationError(false); setAttempt(value => value + 1) }}>Retry</button>
    </div>
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <DatabaseContext.Provider value={{ isInitialized }}>
      {children}
    </DatabaseContext.Provider>
  )
}
