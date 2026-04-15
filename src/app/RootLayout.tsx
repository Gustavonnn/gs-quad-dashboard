import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from '@/components/Layout'
import { RouteFallback } from '@/components/RouteFallback'
import { Toaster } from '@/components/Toaster'
import { CommandPalette } from '@/components/CommandPalette'

export function RootLayout() {
  const location = useLocation()

  return (
    <>
      <Layout>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </Layout>
      <Toaster />
      <CommandPalette />
    </>
  )
}
