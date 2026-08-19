import { Fragment, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

import { useBook } from '../../api/library'
import { cn } from '../../utils/cn'

/**
 * The whole canon, always one tap away: every book of the open scripture as
 * a chip under the reader header, the current one centred on arrival. Thin
 * rules mark where the traditional divisions (carried in `subtitle`) change.
 */
export function BookStrip({ bookSlug, currentSlug, className }) {
  const { data: book } = useBook(bookSlug)
  const scrollRef = useRef(null)
  const currentRef = useRef(null)
  const chapters = book?.chapters || []

  // Centre the open book by moving the strip's own scroll offset — a
  // scrollIntoView here would drag the reading column up with it.
  useEffect(() => {
    const strip = scrollRef.current
    const current = currentRef.current
    if (!strip || !current) return
    const stripBox = strip.getBoundingClientRect()
    const currentBox = current.getBoundingClientRect()
    strip.scrollLeft +=
      currentBox.left - stripBox.left - (stripBox.width - currentBox.width) / 2
  }, [chapters.length, currentSlug])

  if (chapters.length < 2) return null

  return (
    <nav
      aria-label="Books of this canon"
      ref={scrollRef}
      className="overflow-x-auto border-t"
      style={{ borderColor: 'var(--reader-rule)' }}
    >
      <div
        className={cn(
          'mx-auto flex items-center gap-1 px-3 sm:px-6 h-9 w-max min-w-full transition-[margin]',
          className
        )}
      >
        {chapters.map((chapter, index) => {
          const isCurrent = chapter.slug === currentSlug
          const startsDivision =
            index > 0 && chapter.subtitle !== chapters[index - 1].subtitle
          return (
            <Fragment key={chapter.slug}>
              {startsDivision && (
                <span
                  aria-hidden="true"
                  className="shrink-0 h-4 w-px mx-1"
                  style={{ background: 'var(--reader-rule)' }}
                />
              )}
              <Link
                ref={isCurrent ? currentRef : undefined}
                to={`/read/${chapter.slug}`}
                aria-current={isCurrent ? 'page' : undefined}
                title={chapter.subtitle || undefined}
                className="shrink-0 max-w-[13rem] truncate px-2.5 py-1 rounded-sm font-sans text-[0.6875rem] tracking-caps uppercase transition-colors"
                style={{
                  color: isCurrent ? 'var(--reader-accent)' : 'var(--reader-muted)',
                  background: isCurrent
                    ? 'color-mix(in srgb, var(--reader-accent) 12%, transparent)'
                    : 'transparent',
                }}
              >
                {chapter.title}
              </Link>
            </Fragment>
          )
        })}
      </div>
    </nav>
  )
}
