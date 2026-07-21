import {
  BookOpen,
  Bookmark,
  Compass,
  Feather,
  Highlighter,
  Home,
  Info,
  Network,
  ScrollText,
  Search,
  Settings,
} from 'lucide-react'

import { useActiveBook } from '../../stores/appStore'

const ALL_ITEMS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/read', label: 'Read', icon: BookOpen },
  { to: '/principles', label: 'The Seven Principles', icon: Compass, principlesOnly: true },
  { to: '/map', label: 'Knowledge Map', icon: Network, principlesOnly: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/journal', label: 'Journal', icon: Feather },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/highlights', label: 'Highlights', icon: Highlighter },
  { to: '/progress', label: 'Reading Progress', icon: ScrollText },
  { to: '/about', label: 'About the Text', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Navigation for the active book — the Kybalion-specific study features
 *  (principles, knowledge map) withdraw when another book is open. */
export function useNavItems() {
  const book = useActiveBook()
  const items = ALL_ITEMS.filter((item) => !item.principlesOnly || book.hasPrinciples)
  return { items, barItems: items.slice(0, 4) }
}
