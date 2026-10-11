import React, { useRef, useState } from 'react'
import {
  Download,
  Upload,
  Trash2,
  Info,
  Sliders,
  Database,
  Settings,
  Smartphone,
  Share2
} from 'lucide-react'
import { Header } from '../../shared/components/layout/Header'
import { Toggle } from '../../shared/components/ui/Toggle'
import { Card } from '../../shared/components/ui/Card'
import { Button } from '../../shared/components/ui/Button'
import { Input } from '../../shared/components/ui/Input'
import { Modal } from '../../shared/components/ui/Modal'
import { useSettings } from '../../shared/hooks/useSettings'
import { useInstallPrompt } from '../../shared/hooks/useInstallPrompt'
import { useToast } from '../../shared/components/ui/Toast'
import { BackupLimitError, exportBackup, MAX_BACKUP_BYTES, parseBackupText, restoreBackup, serializeBackup } from '../../shared/lib/backup'
import { clearLibrary, storageErrorMessage } from '../../shared/lib/library'

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings()
  const { showToast } = useToast()
  const { isInstallable, installApp } = useInstallPrompt()

  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const importInput = useRef<HTMLInputElement>(null)

  const handleUpdateSettings = async (changes: Parameters<typeof updateSettings>[0]) => {
    try {
      await updateSettings(changes)
    } catch (error) {
      showToast(storageErrorMessage(error, 'Settings could not be saved. Try again.'), 'error')
    }
  }

  const handleExportData = async () => {
    try {
      const backup = await exportBackup()
      
      const blob = new Blob([serializeBackup(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrfolio_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      showToast('Data exported successfully', 'success')
    } catch (error) {
      showToast(storageErrorMessage(error, 'Failed to export data'), 'error')
    }
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = e.target.files?.[0]
    if (!file || importing) return

    setImporting(true)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new BackupLimitError('Backup exceeds the 10 MiB limit. Your library was not changed.')
      await restoreBackup(parseBackupText(await file.text()))
      showToast('Data imported successfully', 'success')
    } catch (error) {
      showToast(storageErrorMessage(error, 'Backup could not be restored. Your library was not changed.'), 'error')
    } finally {
      setImporting(false)
      input.value = ''
    }
  }

  const handleClearAllData = async () => {
    try {
      await clearLibrary()
      showToast('All library data cleared', 'success')
      setIsClearModalOpen(false)
    } catch (error) {
      showToast(storageErrorMessage(error, 'Failed to clear data'), 'error')
    }
  }

  const clearModalFooter = (
    <>
      <Button variant="secondary" size="sm" onClick={() => setIsClearModalOpen(false)}>
        Cancel
      </Button>
      <Button variant="danger" size="sm" onClick={handleClearAllData}>
        Clear Data
      </Button>
    </>
  )

  return (
    <>
      <Header title="Settings" showBackButton={false} />

      <div className="flex flex-col gap-6 flex-1 w-full max-w-sm lg:max-w-2xl mx-auto pt-2 pb-8 lg:p-6">

        {/* Install App Banner — only shown when PWA install is available */}
        {isInstallable && (
          <div
            className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 cursor-pointer group select-none"
            style={{
              background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)',
              boxShadow: '0 8px 32px rgba(108, 92, 231, 0.35)',
            }}
            onClick={async () => {
              const ok = await installApp()
              if (ok) showToast('QRFolio installed successfully! 🎉', 'success')
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.currentTarget.click()
              }
            }}
            aria-label="Install QRFolio app"
          >
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-4 -right-2 w-16 h-16 rounded-full bg-white/10 pointer-events-none" />

            {/* Icon */}
            <div className="z-10 shrink-0 bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors duration-200">
              <Smartphone className="h-6 w-6 text-white" />
            </div>

            {/* Text */}
            <div className="z-10 flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Install QRFolio</p>
              <p className="text-white/75 text-xs mt-0.5 leading-snug">Add to your home screen for the best offline experience</p>
            </div>

            {/* Arrow */}
            <div className="z-10 shrink-0">
              <Share2 className="h-5 w-5 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200" />
            </div>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 items-start">
          {/* General Settings Section */}
          <div className="flex flex-col gap-3 w-full">
            <h3 className="text-xs font-bold text-brand-lightText/40 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Sliders className="h-3.5 w-3.5" /> General Configuration
            </h3>
            
            <Card className="flex flex-col gap-4 border border-brand-lightText/5">
              <Toggle
                label="Reduce Motion (Disable animations)"
                checked={settings.reducedMotion}
                onChange={(val) => handleUpdateSettings({ reducedMotion: val })}
              />
              
              <Toggle
                label="Haptic Feedback (Vibration)"
                checked={settings.hapticFeedback}
                onChange={(val) => handleUpdateSettings({ hapticFeedback: val })}
              />

              <div className="flex flex-col gap-2 pt-2 border-t border-brand-lightText/5">
                <span className="text-xs font-semibold text-brand-lightText/60 uppercase tracking-wider px-1">
                  Default QR Colors
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Foreground"
                    type="color"
                    value={settings.defaultStyle.foregroundColor}
                    onChange={(e) =>
                      handleUpdateSettings({
                        defaultStyle: {
                          ...settings.defaultStyle,
                          foregroundColor: e.target.value,
                        },
                      })
                    }
                    className="h-9 !p-1 cursor-pointer !bg-transparent"
                  />
                  <Input
                    label="Background"
                    type="color"
                    value={settings.defaultStyle.backgroundColor}
                    onChange={(e) =>
                      handleUpdateSettings({
                        defaultStyle: {
                          ...settings.defaultStyle,
                          backgroundColor: e.target.value,
                        },
                      })
                    }
                    className="h-9 !p-1 cursor-pointer !bg-transparent"
                  />
                </div>
              </div>


            </Card>
          </div>

          {/* Right Column: Data & About */}
          <div className="flex flex-col gap-6 w-full">
            {/* Data & Backup Settings Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-brand-lightText/40 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Database className="h-3.5 w-3.5" /> Data & Storage
              </h3>
              
              <Card className="flex flex-col gap-4 border border-brand-lightText/5">
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-brand-lightText/50 leading-relaxed">
                    Export QR codes, categories, and settings. Import adds categories, replaces QR codes with matching IDs, and restores settings from version 2 backups. Back up your current library first. Backup files contain readable QR content, including Wi-Fi passwords.
                  </span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button variant="secondary" size="sm" onClick={handleExportData} leftIcon={<Download className="h-3.5 w-3.5" />}>
                      Export Backup
                    </Button>
                    
                    <div className="flex">
                      <input
                        ref={importInput}
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        disabled={importing}
                      />
                      <Button variant="secondary" size="sm" className="w-full" disabled={importing} onClick={() => importInput.current?.click()}>
                        <Upload className="h-3.5 w-3.5" />
                        {importing ? 'Importing...' : 'Import Backup'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-lightText/5 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-brand-lightText/60 uppercase tracking-wider px-1">
                    Danger Zone
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsClearModalOpen(true)}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    className="w-full text-xs"
                  >
                    Wipe Library Data
                  </Button>
                </div>
              </Card>
            </div>

            {/* About Settings Section */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-brand-lightText/40 uppercase tracking-wider flex items-center gap-1.5 px-1">
                <Info className="h-3.5 w-3.5" /> About App
              </h3>
              
              <Card className="flex flex-col gap-3 border border-brand-lightText/5 items-center text-center p-6">
                <div className="bg-brand-primary/10 border border-brand-primary/20 p-3 rounded-2xl text-brand-primary flex items-center justify-center">
                  <Settings className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-base font-bold text-brand-lightText">QRFolio</span>
                  <span className="text-xs text-brand-lightText/50 font-medium">Version 0.1.0 (Initial preview)</span>
                </div>
                <p className="text-xs text-brand-lightText/60 max-w-[240px] leading-relaxed mt-2">
                  "Organize. Access. Share. All in a Scan." A secure, offline-first QR Code wallet and designer.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Wipe Data Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Wipe Library Data"
        footer={clearModalFooter}
      >
        <p className="text-sm text-brand-lightText/70">
          Are you sure you want to delete all saved QR codes and custom categories? This action is permanent and cannot be undone.
        </p>
      </Modal>
    </>
  )
}
