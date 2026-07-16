import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'

import { AmbientBackground } from '../components/common/AmbientBackground'
import { MobileNav } from '../components/navigation/MobileNav'
import { NavRail } from '../components/navigation/NavRail'
import { useUiStore } from '../stores/uiStore'
import { pageTransition } from '../utils/motion'

export function AppLayout() {
  const location = useLocation()
  const distractionFree = useUiStore((state) => state.distractionFree)

  return (
    <div className="min-h-dvh grain">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-ink-800 focus:text-gold-200 focus:px-4 focus:py-2 focus:rounded-sm"
      >
        Skip to content
      </a>
      <AmbientBackground />
      {!distractionFree && <NavRail />}
      {!distractionFree && <MobileNav />}
      <main
        id="main"
        className={
          distractionFree
            ? 'min-h-dvh'
            : 'min-h-dvh lg:pl-16 pb-20 lg:pb-0'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} {...pageTransition} className="min-h-dvh">
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
