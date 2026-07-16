import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { IconButton } from './Button'
import { getLenis } from './SmoothScroll'

/**
 * Mobile bottom sheet with partial and expanded states. Drag down to
 * dismiss, drag up (or tap the handle) to expand. Keyboard: Escape closes.
 */
export function BottomSheet({ open, onClose, title, children }) {
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setExpanded(false)
      return undefined
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      getLenis()?.start()
    }
  }, [open, onClose])

  const onDragEnd = (_event, info) => {
    if (info.offset.y > 90 || info.velocity.y > 500) {
      if (expanded) setExpanded(false)
      else onClose()
    } else if (info.offset.y < -70) {
      setExpanded(true)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] lg:hidden">
          <motion.div
            className="absolute inset-0 bg-ink-950/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 0.4 }}
            onDragEnd={onDragEnd}
            className="absolute inset-x-0 bottom-0 bg-ink-850 border-t border-ink-600 rounded-t-xl shadow-2xl flex flex-col safe-bottom"
            style={{ height: expanded ? '92dvh' : '58dvh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <button
              type="button"
              className="flex justify-center py-2.5 w-full shrink-0"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
            >
              <span className="h-1 w-10 rounded-full bg-ink-500" aria-hidden="true" />
            </button>
            <div className="flex items-center justify-between px-4 pb-2 shrink-0">
              <h2 className="caps-label text-gold-300">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <X size={16} />
              </IconButton>
            </div>
            <div data-lenis-prevent className="overflow-y-auto px-4 pb-6 grow overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
