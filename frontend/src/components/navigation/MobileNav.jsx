import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { LogIn, Menu, UserRound, X } from 'lucide-react'

import { useAuthStore } from '../../stores/authStore'
import { useUiStore } from '../../stores/uiStore'
import { cn } from '../../utils/cn'
import { MOBILE_BAR_ITEMS, NAV_ITEMS } from './navItems'

/** Mobile: a four-item bottom bar plus a slide-up sheet with everything. */
export function MobileNav() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore()
  const user = useAuthStore((state) => state.user)

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-ink-900/95 border-t hairline backdrop-blur-sm safe-bottom"
      >
        <div className="flex items-stretch justify-around">
          {MOBILE_BAR_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 px-3 min-w-[3.5rem] font-sans text-[0.625rem] tracking-wide',
                  isActive ? 'text-gold-300' : 'text-parchment-400'
                )
              }
            >
              <Icon size={19} strokeWidth={1.5} aria-hidden="true" />
              <span>{label.replace('The Seven ', '')}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 px-3 min-w-[3.5rem] font-sans text-[0.625rem] tracking-wide text-parchment-400"
            aria-label="Open full menu"
          >
            <Menu size={19} strokeWidth={1.5} aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-950/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              data-lenis-prevent
              className="absolute inset-x-0 bottom-0 bg-ink-850 border-t border-ink-600 rounded-t-xl max-h-[80dvh] overflow-y-auto safe-bottom"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="caps-label text-gold-300">Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="p-2 text-parchment-400"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 p-4 pt-1">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-sm px-4 py-3.5 font-sans text-sm',
                        isActive ? 'text-gold-300 bg-gold-500/[0.07]' : 'text-parchment-300 hover:bg-ink-700/60'
                      )
                    }
                  >
                    <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
                <NavLink
                  to={user ? '/profile' : '/login'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-sm px-4 py-3.5 font-sans text-sm text-parchment-300 hover:bg-ink-700/60"
                >
                  {user ? <UserRound size={17} strokeWidth={1.5} aria-hidden="true" /> : <LogIn size={17} strokeWidth={1.5} aria-hidden="true" />}
                  {user ? user.username : 'Sign in'}
                </NavLink>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
