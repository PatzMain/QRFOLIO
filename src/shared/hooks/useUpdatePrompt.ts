import { useRegisterSW } from 'virtual:pwa-register/react'

export const useUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  const handleUpdate = () => {
    void updateServiceWorker(true)
  }

  return {
    needRefresh,
    setNeedRefresh,
    offlineReady,
    setOfflineReady,
    updateServiceWorker: handleUpdate,
  }
}
