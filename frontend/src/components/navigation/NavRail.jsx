import { NavLink } from 'react-router-dom'
import { LogIn, Moon, Sun, UserRound } from 'lucide-react'

import { useAppStore } from '../../stores/appStore'
import { useAuthStore } from '../../stores/authStore'
import { cn } from '../../utils/cn'
import { BookSwitcher } from './BookSwitcher'
import { useNavItems } from './navItems'

/**
 * Desktop navigation: a narrow vertical rail that widens on hover or
 * keyboard focus to reveal labels. Every destination is always reachable;
 * icons carry accessible names even while the rail is collapsed.
 */
export function NavRail() {
  const user = useAuthStore((state) => state.user)
  const { items } = useNavItems()
  const colorMode = useAppStore((state) => state.colorMode)
  const toggleColorMode = useAppStore((state) => state.toggleColorMode)

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'group fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col',
        'w-16 hover:w-60 focus-within:w-60 transition-[width] duration-300 ease-out',
        'bg-ink-900/95 border-r hairline backdrop-blur-sm overflow-hidden'
      )}
    >
      <BookSwitcher expanded="group" className="shrink-0" />

      <div data-lenis-prevent className="flex-1 overflow-y-auto py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 px-[1.375rem] py-3 text-sm font-sans whitespace-nowrap transition-colors',
                isActive
                  ? 'text-gold-300 bg-gold-500/[0.07] border-r border-gold-500'
                  : 'text-parchment-400 hover:text-parchment-100 hover:bg-ink-700/50'
              )
            }
          >
            <Icon size={17} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
            <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
              {label}
            </span>
          </NavLink>
        ))}
      </div>

      <div className="border-t hairline py-3 shrink-0">
        <button
          type="button"
          onClick={toggleColorMode}
          className="flex w-full items-center gap-4 px-[1.375rem] py-3 text-sm font-sans whitespace-nowrap text-parchment-400 hover:text-parchment-100"
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {colorMode === 'dark' ? (
            <Sun size={17} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          ) : (
            <Moon size={17} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          )}
          <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
            {colorMode === 'dark' ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
        <NavLink
          to={user ? '/profile' : '/login'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-4 px-[1.375rem] py-3 text-sm font-sans whitespace-nowrap',
              isActive ? 'text-gold-300' : 'text-parchment-400 hover:text-parchment-100'
            )
          }
        >
          {user ? (
            <UserRound size={17} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          ) : (
            <LogIn size={17} strokeWidth={1.5} className="shrink-0" aria-hidden="true" />
          )}
          <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
            {user ? user.username : 'Sign in'}
          </span>
        </NavLink>
      </div>
    </nav>
  )
}
