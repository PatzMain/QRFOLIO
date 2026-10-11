import { useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { type QRCode } from '../types'
import { addLibraryQRCode, updateLibraryQRCode } from '../lib/library'

export const useQRCodes = () => {
  const qrCodes = useLiveQuery(
    () => db.qrcodes.orderBy('createdAt').reverse().toArray(),
    []
  ) || []

  const getQRCode = useCallback(async (id: string) => {
    return await db.qrcodes.get(id)
  }, [])

  const createQRCode = useCallback(async (qrData: Omit<QRCode, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID()
    const now = new Date()
    const newQR: QRCode = {
      ...qrData,
      id,
      createdAt: now,
      updatedAt: now,
    }
    await addLibraryQRCode(newQR)
    return newQR
  }, [])

  const updateQRCode = useCallback(async (id: string, qrData: Partial<QRCode>) => {
    const now = new Date()
    const updatedFields = {
      ...qrData,
      updatedAt: now,
    }
    await updateLibraryQRCode(id, updatedFields)
  }, [])

  const deleteQRCode = useCallback(async (id: string) => {
    await db.qrcodes.delete(id)
  }, [])

  return {
    qrCodes,
    getQRCode,
    createQRCode,
    updateQRCode,
    deleteQRCode,
  }
}
