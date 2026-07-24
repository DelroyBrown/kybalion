import { motion } from 'framer-motion'
import { Fragment } from 'react'
import { ExternalLink } from 'lucide-react'

import { scrollToY } from '../common/SmoothScroll'

// Height of the sticky reader header plus breathing room.
const ANCHOR_OFFSET = 120

/**
 * The front page of an issue of The Crisis, set as the magazine set it:
 * the nameplate over its deck, a double rule, the dateline, and the
 * issue's own contents line. Tapping a department opens it as its own
 * page; in entire-issue mode the same line jumps down the long page.
 */
export function CrisisMasthead({ chapter, activeSection = 'all', onSelectSection }) {
  const sections = (chapter.sections || []).filter((section) => section.title)
  const wholeIssue = activeSection === 'all'

  const choose = (event, slug) => {
    if (!wholeIssue && onSelectSection) {
      event.preventDefault()
      onSelectSection(slug)
      return
    }
    event.preventDefault()
    const element = document.getElementById(`section-${slug}`)
    if (!element) return
    scrollToY(element.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET)
  }

  return (
    <motion.header
      className="pt-10 sm:pt-14 pb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="crisis-rule" aria-hidden="true" />
      <motion.h1
        className="crisis-nameplate text-center mt-7 text-[clamp(2.75rem,10vw,4.75rem)] leading-none"
        initial={{ opacity: 0, letterSpacing: '0.16em' }}
        animate={{ opacity: 1, letterSpacing: '0.08em' }}
        transition={{ delay: 0.1, duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
      >
        THE CRISIS
      </motion.h1>
      <p
        className="crisis-deck text-center mt-4 text-[0.75rem] sm:text-[0.8125rem]"
        style={{ color: 'var(--reader-muted)' }}
      >
        A Record of the Darker Races
      </p>

      <div className="crisis-rule-double mt-7" aria-hidden="true" />
      <div
        className="crisis-dateline flex items-baseline justify-between gap-4 py-2.5 text-[0.6875rem] sm:text-[0.75rem]"
        style={{ color: 'var(--reader-ink)' }}
      >
        <span className="shrink-0">{chapter.subtitle || `No. ${chapter.number}`}</span>
        <span className="text-center font-bold">{chapter.title}</span>
        <span className="shrink-0 hidden sm:inline">W. E. B. Du Bois, Editor</span>
      </div>
      <div className="crisis-rule" aria-hidden="true" />

      {sections.length > 1 && (
        <nav aria-label="In this issue" className="mt-6 text-center">
          <span className="crisis-deck text-[0.6875rem]" style={{ color: 'var(--reader-accent)' }}>
            In This Issue
          </span>
          <p
            className="mt-2.5 mx-auto max-w-xl font-serif text-[0.9375rem] leading-relaxed"
            style={{ color: 'var(--reader-ink)' }}
          >
            {sections.map((section, index) => {
              const current = !wholeIssue && section.slug === activeSection
              return (
                <Fragment key={section.id ?? section.slug}>
                  {index > 0 && (
                    <span aria-hidden="true" style={{ color: 'var(--reader-faint)' }}>
                      {' '}
                      ·{' '}
                    </span>
                  )}
                  <a
                    href={`?s=${section.slug}`}
                    onClick={(event) => choose(event, section.slug)}
                    aria-current={current ? 'true' : undefined}
                    className="underline underline-offset-4 hover:opacity-75 transition-opacity"
                    style={{
                      color: current ? 'var(--reader-accent)' : 'var(--reader-ink)',
                      textDecorationStyle: current ? 'solid' : 'dotted',
                      fontWeight: current ? 700 : 400,
                    }}
                  >
                    {section.title}
                  </a>
                </Fragment>
              )
            })}
          </p>
          {onSelectSection && (
            <button
              type="button"
              onClick={() => onSelectSection(wholeIssue ? sections[0]?.slug : 'all')}
              className="mt-3 font-sans text-xs underline decoration-dotted underline-offset-4 hover:opacity-75 transition-opacity"
              style={{ color: 'var(--reader-muted)' }}
            >
              {wholeIssue ? 'Read section by section' : 'Read the entire issue on one page'}
            </button>
          )}
        </nav>
      )}

      {chapter.source_url && (
        <p className="mt-5 text-center">
          <a
            href={chapter.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-sans text-xs underline decoration-dotted underline-offset-4 hover:opacity-75 transition-opacity"
            style={{ color: 'var(--reader-muted)' }}
          >
            View the original page scans <ExternalLink size={11} aria-hidden="true" />
          </a>
        </p>
      )}
    </motion.header>
  )
}
