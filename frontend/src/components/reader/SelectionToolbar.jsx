import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

import { useCreateHighlight } from '../../api/userData'
import { useAuthStore } from '../../stores/authStore'
import { selectionOffsetsWithin } from '../../utils/segmentText'
import { cn } from '../../utils/cn'

const STYLES = [
  { key: 'gold', label: 'Tarnished gold', swatch: 'rgba(191,160,93,0.75)' },
  { key: 'ember', label: 'Ember', swatch: 'rgba(178,106,76,0.75)' },
  { key: 'violet', label: 'Desaturated violet', swatch: 'rgba(131,113,143,0.8)' },
  { key: 'sage', label: 'Oxidised sage', swatch: 'rgba(138,148,120,0.8)' },
]

/**
 * Floating toolbar that appears over a text selection inside the reading
 * column, offering restrained highlight styles and an optional note.
 * Highlights anchor to paragraph identity + character offsets, so they
 * survive any layout or typography change.
 */
export function SelectionToolbar({ containerRef }) {
  const [selection, setSelection] = useState(null)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const authed = useAuthStore((state) => Boolean(state.access))
  const createHighlight = useCreateHighlight()
  const toolbarRef = useRef(null)

  useEffect(() => {
    const onSelectionEnd = () => {
      // Let the browser finish placing the selection first.
      requestAnimationFrame(() => {
        const domSelection = window.getSelection()
        if (!domSelection || domSelection.isCollapsed || !containerRef.current) {
          if (!toolbarRef.current?.contains(document.activeElement)) {
            setSelection(null)
            setShowNote(false)
          }
          return
        }
        const anchorParagraph = domSelection.anchorNode?.parentElement?.closest('[data-paragraph-id]')
        const focusParagraph = domSelection.focusNode?.parentElement?.closest('[data-paragraph-id]')
        if (!anchorParagraph || anchorParagraph !== focusParagraph) {
          setSelection(null)
          return
        }
        const offsets = selectionOffsetsWithin(anchorParagraph)
        if (!offsets) {
          setSelection(null)
          return
        }
        const rect = domSelection.getRangeAt(0).getBoundingClientRect()
        setSelection({
          paragraphId: Number(anchorParagraph.dataset.paragraphId),
          ...offsets,
          x: Math.max(12, Math.min(rect.left + rect.width / 2, window.innerWidth - 180)),
          y: Math.max(60, rect.top - 12),
        })
      })
    }
    document.addEventListener('mouseup', onSelectionEnd)
    document.addEventListener('touchend', onSelectionEnd)
    return () => {
      document.removeEventListener('mouseup', onSelectionEnd)
      document.removeEventListener('touchend', onSelectionEnd)
    }
  }, [containerRef])

  const save = (style) => {
    createHighlight.mutate(
      {
        paragraph: selection.paragraphId,
        start_offset: selection.start,
        end_offset: selection.end,
        style,
        note: note.trim(),
      },
      {
        onSuccess: () => {
          window.getSelection()?.removeAllRanges()
          setSelection(null)
          setNote('')
          setShowNote(false)
        },
      }
    )
  }

  return createPortal(
    <AnimatePresence>
      {selection && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.16 }}
          className="fixed z-[75] -translate-x-1/2 -translate-y-full"
          style={{ left: selection.x, top: selection.y }}
          role="toolbar"
          aria-label="Highlight selection"
        >
          <div className="bg-ink-850 border border-ink-600 rounded-sm shadow-xl p-2.5">
            {authed ? (
              <>
                <div className="flex items-center gap-2">
                  {STYLES.map((style) => (
                    <button
                      key={style.key}
                      type="button"
                      aria-label={`Highlight in ${style.label}`}
                      title={style.label}
                      disabled={createHighlight.isPending}
                      onClick={() => save(style.key)}
                      className="h-6 w-6 rounded-full border border-ink-500 hover:scale-110 transition-transform"
                      style={{ background: style.swatch }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowNote((value) => !value)}
                    className={cn(
                      'ml-1 font-sans text-xs px-2 py-1 rounded-sm',
                      showNote ? 'text-gold-200 bg-gold-500/15' : 'text-parchment-400 hover:text-parchment-200'
                    )}
                  >
                    + note
                  </button>
                </div>
                {showNote && (
                  <input
                    type="text"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note, then pick a colour"
                    className="mt-2 w-56 bg-ink-900 border border-ink-600 rounded-sm px-2 py-1.5 font-sans text-xs text-parchment-200 placeholder:text-parchment-600"
                  />
                )}
              </>
            ) : (
              <p className="font-sans text-xs text-parchment-300 px-1 py-0.5">
                <Link to="/login" className="text-gold-300 underline decoration-dotted">
                  Sign in
                </Link>{' '}
                to keep highlights
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
