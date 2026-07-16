import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bookmark, Sparkles } from 'lucide-react'

import { useNotes, useCreateNote, useDeleteNote, useToggleBookmark, useBookmarks } from '../../api/userData'
import { useAuthStore } from '../../stores/authStore'
import { accent } from '../../utils/accents'
import { cn } from '../../utils/cn'
import { formatDate, toRoman, truncate } from '../../utils/format'
import { renderMarkdownLite } from '../../utils/markdownLite'
import { TYPE_LABELS } from '../reader/HoverPreview'
import { PrincipleSymbol } from '../principles/PrincipleSymbol'

/** One annotation card: body plus clear provenance. */
function AnnotationCard({ annotation }) {
  const isAi = annotation.origin === 'ai'
  return (
    <article className="border-b hairline pb-5 last:border-b-0">
      {annotation.title && (
        <h4 className="font-display text-lg text-parchment-100">{annotation.title}</h4>
      )}
      <div className="editorial-body mt-2 space-y-3">{renderMarkdownLite(annotation.body)}</div>

      {annotation.related_principles?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {annotation.related_principles.map((slug) => (
            <Link
              key={slug}
              to={`/principles/${slug}`}
              className="font-sans text-xs text-gold-300 hover:text-gold-200 underline decoration-dotted underline-offset-4"
            >
              {slug.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      )}

      {annotation.sources?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {annotation.sources.map((source, i) => (
            <li key={i} className="font-sans text-xs text-parchment-500">
              {source.url ? (
                <a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-dotted">
                  {source.citation}
                </a>
              ) : (
                source.citation
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 flex items-center gap-2 font-sans text-[0.6875rem] text-parchment-500">
        {isAi ? (
          <>
            <Sparkles size={11} className="text-violet-300" aria-hidden="true" />
            <span className="text-violet-300">
              AI-generated ({annotation.ai_meta?.model || 'model unknown'})
              {annotation.ai_meta?.reviewed ? ' · editor-reviewed' : ' · not yet reviewed'}
            </span>
          </>
        ) : (
          <span>{annotation.attribution || 'Editorial commentary'}</span>
        )}
      </p>
    </article>
  )
}

function NotesTab({ passage }) {
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: notes } = useNotes(
    authed ? { kind: 'passage', object_id: passage.slug } : undefined
  )
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const [draft, setDraft] = useState('')

  if (!authed) {
    return (
      <p className="editorial-body text-parchment-400">
        <Link to="/login" className="text-gold-300 underline decoration-dotted">Sign in</Link> to keep
        private notes on this passage.
      </p>
    )
  }

  const save = () => {
    if (!draft.trim()) return
    createNote.mutate(
      {
        kind: 'passage',
        object_id: passage.slug,
        chapter_slug: passage.chapter?.slug || '',
        label: truncate(passage.excerpt, 80),
        body: draft.trim(),
      },
      { onSuccess: () => setDraft('') }
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="quick-note" className="caps-label text-parchment-500">
          New private note
        </label>
        <textarea
          id="quick-note"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Your thoughts on this passage…"
          className="mt-2 w-full bg-ink-900 border border-ink-600 rounded-sm p-3 font-serif text-sm text-parchment-100 placeholder:text-parchment-600 focus:border-gold-600"
        />
        <div className="mt-2 flex justify-between items-center">
          <span className="font-sans text-xs text-parchment-500">{draft.length} characters</span>
          <button
            type="button"
            onClick={save}
            disabled={!draft.trim() || createNote.isPending}
            className="font-sans text-xs tracking-caps uppercase text-gold-300 hover:text-gold-200 disabled:opacity-40"
          >
            {createNote.isPending ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </div>
      <ul className="space-y-4">
        {(notes?.results || []).map((note) => (
          <li key={note.id} className="border-l border-gold-600/40 pl-3">
            <div className="editorial-body text-sm">{renderMarkdownLite(note.body)}</div>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="font-sans text-[0.6875rem] text-parchment-500">
                {formatDate(note.updated_at)} · private
              </span>
              <button
                type="button"
                onClick={() => deleteNote.mutate(note.id)}
                className="font-sans text-[0.6875rem] text-crimson-300 hover:text-crimson-300/80"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The full annotation experience for a passage: tabs per annotation type
 * plus definitions, related passages, and (in study mode) private notes.
 * Only sections that actually have content are rendered.
 */
export function AnnotationContent({ passage, studyMode, onNavigate }) {
  const authed = useAuthStore((state) => Boolean(state.access))
  const toggleBookmark = useToggleBookmark()
  const { data: bookmarks } = useBookmarks(authed ? { kind: 'passage' } : undefined)
  const isBookmarked = (bookmarks?.results || []).some((b) => b.object_id === passage.slug)

  const tabs = useMemo(() => {
    const groups = new Map()
    for (const annotation of passage.annotations || []) {
      const key = annotation.annotation_type.slug
      if (!groups.has(key)) groups.set(key, { type: annotation.annotation_type, items: [] })
      groups.get(key).items.push(annotation)
    }
    const list = [...groups.values()]
      .sort((a, b) => a.type.order - b.type.order)
      .map((group) => ({
        key: group.type.slug,
        label: group.type.name || TYPE_LABELS[group.type.slug] || group.type.slug,
        kind: 'annotations',
        items: group.items,
      }))
    if (passage.definitions?.length) {
      list.push({ key: 'definitions', label: 'Definitions', kind: 'definitions' })
    }
    if (passage.related_passages?.length) {
      list.push({ key: 'related', label: 'Related passages', kind: 'related' })
    }
    if (studyMode) {
      list.push({ key: 'notes', label: 'My notes', kind: 'notes' })
    }
    return list
  }, [passage, studyMode])

  const [activeKey, setActiveKey] = useState(tabs[0]?.key)
  const activeTab = tabs.find((tab) => tab.key === activeKey) || tabs[0]

  return (
    <div>
      {/* The passage itself, always visible for context */}
      <blockquote
        className="font-serif italic text-lg leading-relaxed text-parchment-100 border-l-2 border-gold-600/60 pl-4"
        cite="The Kybalion, 1908"
      >
        “{passage.excerpt}”
      </blockquote>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-sans text-xs text-parchment-500">
          Chapter {toRoman(passage.chapter?.number)} · {passage.chapter?.title}
        </span>
        {passage.is_placeholder && (
          <span className="font-sans text-[0.625rem] tracking-caps uppercase text-parchment-500 border border-ink-500 rounded-sm px-1.5 py-0.5">
            Placeholder text
          </span>
        )}
        {authed && (
          <button
            type="button"
            onClick={() =>
              toggleBookmark.mutate({
                kind: 'passage',
                object_id: passage.slug,
                chapter_slug: passage.chapter?.slug || '',
                title: truncate(passage.excerpt, 80),
                label: `Chapter ${toRoman(passage.chapter?.number)}`,
              })
            }
            className={cn(
              'inline-flex items-center gap-1 font-sans text-xs',
              isBookmarked ? 'text-gold-300' : 'text-parchment-500 hover:text-parchment-300'
            )}
            aria-pressed={isBookmarked}
          >
            <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} aria-hidden="true" />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
        )}
      </div>

      {/* Principle chips */}
      {passage.principles?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {passage.principles.map((principle) => (
            <Link
              key={principle.slug}
              to={`/principles/${principle.slug}`}
              onClick={onNavigate}
              className={cn(
                'inline-flex items-center gap-2 border rounded-sm px-2.5 py-1.5 font-sans text-xs transition-colors',
                'border-ink-500 hover:border-gold-600 text-parchment-300 hover:text-gold-200'
              )}
            >
              <span className={accent(principle.accent).text}>
                <PrincipleSymbol symbol={principle.symbol} size={16} />
              </span>
              {principle.name}
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      {tabs.length > 0 && (
        <>
          <div role="tablist" aria-label="Annotation sections" className="mt-6 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab?.key === tab.key}
                onClick={() => setActiveKey(tab.key)}
                className={cn(
                  'shrink-0 rounded-sm px-3 py-1.5 font-sans text-xs tracking-wide transition-colors',
                  activeTab?.key === tab.key
                    ? 'bg-gold-500/15 text-gold-200'
                    : 'text-parchment-400 hover:text-parchment-200 hover:bg-ink-700/60'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-5 space-y-5">
            {activeTab?.kind === 'annotations' &&
              activeTab.items.map((annotation) => <AnnotationCard key={annotation.id} annotation={annotation} />)}

            {activeTab?.kind === 'definitions' &&
              passage.definitions.map((definition) => (
                <div key={definition.slug} className="border-b hairline pb-4 last:border-b-0">
                  <h4 className="font-display text-lg text-parchment-100">{definition.term}</h4>
                  {definition.etymology && (
                    <p className="font-sans text-xs text-parchment-500 italic mt-0.5">{definition.etymology}</p>
                  )}
                  <p className="editorial-body mt-2">{definition.meaning}</p>
                </div>
              ))}

            {activeTab?.kind === 'related' &&
              passage.related_passages.map((related, i) => (
                <Link
                  key={i}
                  to={`/read/${related.passage.chapter.slug}?passage=${related.passage.slug}`}
                  onClick={onNavigate}
                  className="block border hairline rounded-sm p-4 hover:border-gold-600/60 transition-colors"
                >
                  <span className="caps-label text-parchment-500">
                    {related.kind} · Chapter {toRoman(related.passage.chapter.number)}
                  </span>
                  <span className="mt-1.5 block font-serif italic text-sm text-parchment-200">
                    “{truncate(related.passage.excerpt, 140)}”
                  </span>
                  {related.note && <span className="editorial-body mt-2 block text-sm">{related.note}</span>}
                  <span className="mt-2 inline-flex items-center gap-1 font-sans text-xs text-gold-300">
                    Open in reader <ArrowUpRight size={12} aria-hidden="true" />
                  </span>
                </Link>
              ))}

            {activeTab?.kind === 'notes' && <NotesTab passage={passage} />}
          </div>
        </>
      )}

      {tabs.length === 0 && (
        <p className="editorial-body mt-6 text-parchment-500">
          No commentary has been published for this passage yet.
        </p>
      )}
    </div>
  )
}
