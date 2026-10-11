import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'

export const useFavorites = () => {
  const favorites = useLiveQuery(
    () => db.qrcodes.filter((qr) => qr.isFavorite).toArray(),
    []
  ) || []

  const toggleFavorite = async (id: string) => {
    const qr = await db.qrcodes.get(id)
    if (qr) {
      await db.qrcodes.update(id, {
        isFavorite: !qr.isFavorite,
        updatedAt: new Date(),
      })
    }
  }

  return {
    favorites,
    toggleFavorite,
  }
}
