import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

const TYPE_LABELS = {
  definition: 'Definition',
  plain: 'Plain English',
  deep: 'Interpretation',
  historical: 'Historical context',
  symbolism: 'Symbolism',
  'principle-link': 'Principle link',
  'modern-example': 'Modern example',
  practical: 'Practical application',
  reflection: 'Reflection',
  misunderstanding: 'Common misunderstanding',
  'cross-reference': 'Cross-reference',
  visualisation: 'Visualisation',
  editorial: 'Editorial note',
  ai: 'AI interpretation',
}

/** Small elegant preview shown while hovering / focusing a passage mark. */
export function HoverPreview({ preview }) {
  return createPortal(
    <AnimatePresence>
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="fixed z-[80] pointer-events-none hidden lg:block max-w-xs"
          style={{ left: preview.x, top: preview.y }}
          role="status"
        >
          <div className="bg-ink-850 border border-ink-600 rounded-sm shadow-xl px-4 py-3">
            <p className="caps-label text-gold-400">
              {preview.passage.annotation_types?.map((t) => TYPE_LABELS[t] || t).slice(0, 3).join(' · ') ||
                'Annotated passage'}
            </p>
            <p className="mt-1.5 font-sans text-xs text-parchment-300 leading-relaxed">
              {preview.passage.annotation_count} note{preview.passage.annotation_count === 1 ? '' : 's'} on
              this passage — select to open.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export { TYPE_LABELS }
