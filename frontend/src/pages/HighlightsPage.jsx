import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Trash2 } from 'lucide-react'

import { useDeleteHighlight, useHighlights, useUpdateHighlight } from '../api/userData'
import { IconButton } from '../components/common/Button'
import { EmptyState } from '../components/common/states'
import { Tag } from '../components/common/Tag'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import { formatDate, toRoman } from '../utils/format'

const STYLE_DOTS = {
  gold: 'rgba(191,160,93,0.85)',
  ember: 'rgba(178,106,76,0.85)',
  violet: 'rgba(131,113,143,0.9)',
  sage: 'rgba(138,148,120,0.9)',
}

export function HighlightsPage() {
  useDocumentTitle('Highlights')
  const authed = useAuthStore((state) => Boolean(state.access))
  const [styleFilter, setStyleFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  const { data } = useHighlights()
  const updateHighlight = useUpdateHighlight()
  const deleteHighlight = useDeleteHighlight()

  const grouped = useMemo(() => {
    const list = (data?.results || []).filter((h) => !styleFilter || h.style === styleFilter)
    const groups = new Map()
    for (const highlight of list) {
      const key = highlight.chapter.slug
      if (!groups.has(key)) groups.set(key, { chapter: highlight.chapter, items: [] })
      groups.get(key).items.push(highlight)
    }
    return [...groups.values()].sort((a, b) => a.chapter.number - b.chapter.number)
  }, [data, styleFilter])

  if (!authed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          title="Highlights are kept for you"
          body="Sign in, select any passage of the original text while reading, and your markings will gather here — anchored to the text, not the page."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100">Highlights</h1>

      <div className="mt-6 flex items-center gap-2">
        <span className="font-sans text-xs text-parchment-500">Filter:</span>
        <button
          type="button"
          onClick={() => setStyleFilter('')}
          className={cn(
            'rounded-sm px-2 py-1 font-sans text-xs',
            !styleFilter ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500'
          )}
        >
          All
        </button>
        {Object.entries(STYLE_DOTS).map(([key, color]) => (
          <button
            key={key}
            type="button"
            aria-label={`Filter by ${key} highlights`}
            aria-pressed={styleFilter === key}
            onClick={() => setStyleFilter(key === styleFilter ? '' : key)}
            className={cn(
              'h-6 w-6 rounded-full border transition-transform',
              styleFilter === key ? 'border-gold-400 scale-110' : 'border-ink-500'
            )}
            style={{ background: color }}
          />
        ))}
      </div>

      <div className="mt-8 space-y-10">
        {grouped.map((group) => (
          <section key={group.chapter.slug} aria-labelledby={`hl-${group.chapter.slug}`}>
            <h2 id={`hl-${group.chapter.slug}`} className="caps-label text-gold-400 border-b hairline pb-2">
              Chapter {toRoman(group.chapter.number)} · {group.chapter.title}
            </h2>
            <ul className="mt-4 space-y-4">
              {group.items.map((highlight) => (
                <li key={highlight.id} className="flex gap-3">
                  <span
                    className="mt-2 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: STYLE_DOTS[highlight.style] }}
                    aria-label={`${highlight.style} highlight`}
                  />
                  <div className="min-w-0 flex-1">
                    <blockquote className="font-serif italic text-parchment-100 leading-relaxed">
                      “{highlight.text}”
                    </blockquote>
                    {editingId === highlight.id ? (
                      <div className="mt-2">
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={2}
                          aria-label="Highlight note"
                          className="w-full bg-ink-900 border border-ink-600 rounded-sm p-2 font-sans text-sm text-parchment-200"
                        />
                        <div className="mt-1 flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateHighlight.mutate(
                                { id: highlight.id, note: noteDraft },
                                { onSuccess: () => setEditingId(null) }
                              )
                            }
                            className="font-sans text-xs text-gold-300"
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} className="font-sans text-xs text-parchment-500">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      highlight.note && <p className="editorial-body mt-1.5 text-sm text-parchment-400">{highlight.note}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {(highlight.tags || []).map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                      <span className="font-sans text-[0.6875rem] text-parchment-500">{formatDate(highlight.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(highlight.id)
                          setNoteDraft(highlight.note || '')
                        }}
                        className="font-sans text-[0.6875rem] text-parchment-500 hover:text-parchment-300"
                      >
                        {highlight.note ? 'Edit note' : 'Add note'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-center shrink-0">
                    <Link
                      to={`/read/${highlight.chapter.slug}`}
                      className="p-2 text-parchment-500 hover:text-gold-300"
                      aria-label="Open in reader"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                    <IconButton label="Delete highlight" onClick={() => deleteHighlight.mutate(highlight.id)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {grouped.length === 0 && (
        <EmptyState
          title="No markings yet"
          body="Select any span of the original text while reading and choose one of the four restrained colours. Your highlights anchor to the text itself and survive every layout change."
          actionLabel="Open the book"
          actionTo="/read"
        />
      )}
    </div>
  )
}
