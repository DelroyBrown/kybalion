import { motion } from 'framer-motion'
import { forwardRef, useMemo } from 'react'

import { segmentText } from '../../utils/segmentText'
import { cn } from '../../utils/cn'
import { EASE } from '../../utils/motion'
import { useRevealAllowed } from '../common/Reveal'

/**
 * One paragraph of original text. Curated passages render as quiet dotted
 * marks; the reader's own highlights render as tinted washes. Both survive
 * overlap because the text is segmented by range boundaries.
 */
export const ParagraphBlock = forwardRef(function ParagraphBlock(
  {
    paragraph,
    globalOrder,
    showMarks,
    showNumbers,
    highlights = [],
    activePassageSlug,
    onOpenPassage,
    onPassageHover,
  },
  ref
) {
  const revealAllowed = useRevealAllowed()
  const segments = useMemo(() => {
    const ranges = []
    if (showMarks) {
      for (const passage of paragraph.passages || []) {
        ranges.push({ start: passage.start_offset, end: passage.end_offset, type: 'passage', data: passage })
      }
    }
    for (const highlight of highlights) {
      ranges.push({ start: highlight.start_offset, end: highlight.end_offset, type: 'highlight', data: highlight })
    }
    return segmentText(paragraph.text, ranges)
  }, [paragraph, highlights, showMarks])

  const isEpigraph = paragraph.kind === 'epigraph'
  const isQuote = paragraph.kind === 'quote'
  const isEditorial = paragraph.kind === 'editorial'

  const renderSegment = (segment, index) => {
    const passage = segment.ranges.find((r) => r.type === 'passage')?.data
    const highlight = segment.ranges.find((r) => r.type === 'highlight')?.data
    const classes = cn(highlight && `user-highlight-${highlight.style}`)

    if (passage) {
      return (
        <span
          key={index}
          data-seg-start={segment.start}
          data-passage-slug={passage.slug}
          data-active={activePassageSlug === passage.slug || undefined}
          role="button"
          tabIndex={0}
          aria-label={`Annotated passage: ${segment.text.slice(0, 60)}. ${passage.annotation_count} notes available.`}
          className={cn('passage-mark', classes)}
          onClick={() => onOpenPassage(passage.slug)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onOpenPassage(passage.slug)
            }
          }}
          onMouseEnter={(event) => onPassageHover?.(passage, event.currentTarget)}
          onMouseLeave={() => onPassageHover?.(null)}
          onFocus={(event) => onPassageHover?.(passage, event.currentTarget)}
          onBlur={() => onPassageHover?.(null)}
        >
          {segment.text}
        </span>
      )
    }
    return (
      <span key={index} data-seg-start={segment.start} className={classes || undefined}>
        {segment.text}
      </span>
    )
  }

  // Each paragraph settles gently into place the first time it scrolls
  // into view — a rise small and quick enough never to interrupt reading.
  const revealProps = revealAllowed
    ? {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '0px 0px -6% 0px' },
        transition: { duration: 0.7, ease: EASE },
      }
    : {}

  return (
    <motion.div
      ref={ref}
      data-paragraph-id={paragraph.id}
      data-global-order={globalOrder}
      className={cn('relative group', isEditorial && 'my-6')}
      {...revealProps}
    >
      {showNumbers && (
        <span
          className="absolute -left-10 top-1 hidden sm:block font-sans text-[0.6875rem] select-none"
          style={{ color: 'var(--reader-faint)' }}
          aria-hidden="true"
        >
          {globalOrder}
        </span>
      )}

      {paragraph.is_placeholder && (
        <span
          className="mb-1.5 inline-block font-sans text-[0.625rem] tracking-caps uppercase rounded-sm border px-1.5 py-0.5"
          style={{ color: 'var(--reader-faint)', borderColor: 'var(--reader-rule)' }}
        >
          Placeholder — awaiting verified 1908 text
        </span>
      )}

      {isEditorial ? (
        <div className="border rounded-sm p-4" style={{ borderColor: 'var(--reader-rule)' }}>
          <span className="caps-label block mb-2" style={{ color: 'var(--reader-muted)' }}>
            Editorial note
          </span>
          <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--reader-muted)' }}>
            {segments.map(renderSegment)}
          </p>
        </div>
      ) : (
        <p
          className={cn(
            isEpigraph && 'text-center italic px-2 sm:px-8 py-2',
            isQuote && 'italic border-l-2 pl-5'
          )}
          style={{
            borderColor: isQuote ? 'var(--reader-rule)' : undefined,
            fontSize: isEpigraph ? 'calc(1.25rem * var(--reader-font-scale, 1))' : undefined,
          }}
        >
          {segments.map(renderSegment)}
        </p>
      )}
    </motion.div>
  )
})
