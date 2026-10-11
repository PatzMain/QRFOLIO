import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { type AppSettings } from '../types'
import { DEFAULT_QR_STYLE } from '../constants'

export const useSettings = () => {
  const settings = useLiveQuery(
    () => db.settings.get('app-settings'),
    []
  )

  const updateSettings = async (data: Partial<AppSettings>) => {
    const current = await db.settings.get('app-settings') || defaultSettings
    await db.settings.put({
      ...current,
      ...data,
      id: 'app-settings',
    })
  }

  const defaultSettings: AppSettings = {
    id: 'app-settings',
    defaultStyle: DEFAULT_QR_STYLE,
    defaultCategoryId: null,
    exportFormat: 'json',
    hapticFeedback: true,
    reducedMotion: false,
  }

  return {
    settings: settings || defaultSettings,
    updateSettings,
  }
}
