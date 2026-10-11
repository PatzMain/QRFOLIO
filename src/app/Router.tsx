import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from '../shared/components/layout/AppShell'
import { PageTransition } from '../shared/components/layout/PageTransition'
import { Spinner } from '../shared/components/feedback/Spinner'

// Lazy loaded page components
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then(module => ({ default: module.DashboardPage })))
const CategoriesPage = lazy(() => import('../features/categories/CategoriesPage').then(module => ({ default: module.CategoriesPage })))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then(module => ({ default: module.SettingsPage })))
const GeneratorPage = lazy(() => import('../features/generator/GeneratorPage').then(module => ({ default: module.GeneratorPage })))
const DetailPage = lazy(() => import('../features/qr-codes/DetailPage').then(module => ({ default: module.DetailPage })))
const ScannerPage = lazy(() => import('../features/scanner/ScannerPage').then(module => ({ default: module.ScannerPage })))

export const AppRouter: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-darkBg flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <Routes>
        <Route
        path="/"
        element={
          <AppShell>
            <PageTransition>
              <DashboardPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/categories"
        element={
          <AppShell>
            <PageTransition>
              <CategoriesPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/settings"
        element={
          <AppShell>
            <PageTransition>
              <SettingsPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/generate"
        element={
          <AppShell>
            <PageTransition>
              <GeneratorPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/edit/:id"
        element={
          <AppShell>
            <PageTransition>
              <GeneratorPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/detail/:id"
        element={
          <AppShell>
            <PageTransition>
              <DetailPage />
            </PageTransition>
          </AppShell>
        }
      />
      <Route
        path="/scan"
        element={
          <AppShell>
            <PageTransition>
              <ScannerPage />
            </PageTransition>
          </AppShell>
        }
      />
    </Routes>
    </Suspense>
  )
}
