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

export const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/read', label: 'Read', icon: BookOpen },
  { to: '/principles', label: 'The Seven Principles', icon: Compass },
  { to: '/map', label: 'Knowledge Map', icon: Network },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/journal', label: 'Journal', icon: Feather },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/highlights', label: 'Highlights', icon: Highlighter },
  { to: '/progress', label: 'Reading Progress', icon: ScrollText },
  { to: '/about', label: 'About the Text', icon: Info },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const MOBILE_BAR_ITEMS = NAV_ITEMS.slice(0, 4)
