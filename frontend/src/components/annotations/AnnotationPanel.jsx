import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

import { usePassage } from '../../api/library'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { BottomSheet } from '../common/BottomSheet'
import { IconButton } from '../common/Button'
import { ErrorState, TextSkeleton } from '../common/states'
import { AnnotationContent } from './AnnotationContent'

/**
 * Container for the annotation experience: a side panel beside the text on
 * desktop, a bottom sheet on smaller screens. The reader's scroll position
 * is untouched in both cases.
 */
export function AnnotationPanel({ passageSlug, onClose, studyMode }) {
  const isDesktop = useIsDesktop()
  const { data: passage, isLoading, isError, error, refetch } = usePassage(passageSlug)
  const panelRef = useRef(null)

  useEffect(() => {
    if (passageSlug && isDesktop) panelRef.current?.focus()
  }, [passageSlug, isDesktop])

  const body = isLoading ? (
    <TextSkeleton lines={7} />
  ) : isError ? (
    <ErrorState title="The annotation could not be opened" error={error} onRetry={refetch} />
  ) : passage ? (
    <AnnotationContent passage={passage} studyMode={studyMode} onNavigate={onClose} />
  ) : null

  if (!isDesktop) {
    return (
      <BottomSheet open={Boolean(passageSlug)} onClose={onClose} title="Annotation">
        {body}
      </BottomSheet>
    )
  }

  return (
    <AnimatePresence>
      {passageSlug && (
        <motion.aside
          ref={panelRef}
          tabIndex={-1}
          role="complementary"
          aria-label="Passage annotations"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed right-0 top-0 bottom-0 z-40 w-[26rem] max-w-full bg-ink-900/[0.98] border-l hairline shadow-2xl flex flex-col"
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose()
          }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b hairline shrink-0">
            <h2 className="caps-label text-gold-300">Annotation</h2>
            <IconButton label="Close annotations" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>
          <div data-lenis-prevent className="overflow-y-auto p-5 grow">{body}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
