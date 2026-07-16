import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Download, Plus, Star, Trash2 } from 'lucide-react'

import { useReflectionPrompts } from '../api/principles'
import { downloadJson } from '../api/auth'
import {
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useExportJournal,
  useJournalEntries,
  useUpdateJournalEntry,
} from '../api/userData'
import { Button, IconButton } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { EmptyState } from '../components/common/states'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import { formatDate, truncate } from '../utils/format'

const KINDS = [
  { key: 'free', label: 'Free writing' },
  { key: 'passage', label: 'Passage reflection' },
  { key: 'principle', label: 'Principle reflection' },
  { key: 'prompt', label: 'Guided prompt' },
  { key: 'chapter', label: 'Chapter reflection' },
  { key: 'daily', label: 'Daily reflection' },
]

export function JournalPage() {
  useDocumentTitle('Journal')
  const authed = useAuthStore((state) => Boolean(state.access))
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterKind, setFilterKind] = useState('')
  const [filterFavourite, setFilterFavourite] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved

  const params = {}
  if (filterKind) params.kind = filterKind
  if (filterFavourite) params.favourite = true
  if (searchText.trim()) params.search = searchText.trim()
  const { data } = useJournalEntries(authed ? params : undefined)
  const entries = data?.results || []

  const createEntry = useCreateJournalEntry()
  const updateEntry = useUpdateJournalEntry()
  const deleteEntry = useDeleteJournalEntry()
  const exportAll = useExportJournal()
  const { data: prompts } = useReflectionPrompts()

  const selected = entries.find((entry) => entry.id === selectedId) || null

  // Draft state for the editor.
  const [draft, setDraft] = useState({ title: '', body: '', kind: 'free', tags: '', favourite: false })
  const [links, setLinks] = useState({}) // passage / principle / chapter / prompt
  const dirtyRef = useRef(false)

  // Prefill from query params (arriving from reader / principle pages).
  useEffect(() => {
    const kind = searchParams.get('kind')
    if (!kind) return
    const nextLinks = {}
    for (const key of ['passage', 'principle', 'chapter', 'prompt']) {
      const value = searchParams.get(key)
      if (value) nextLinks[key] = key === 'prompt' ? Number(value) : value
    }
    setLinks(nextLinks)
    setDraft((current) => ({ ...current, kind }))
    setSelectedId(null)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const loadEntry = (entry) => {
    setSelectedId(entry.id)
    setDraft({
      title: entry.title || '',
      body: entry.body || '',
      kind: entry.kind,
      tags: (entry.tags || []).join(', '),
      favourite: entry.favourite,
    })
    setLinks({
      passage: entry.passage || undefined,
      principle: entry.principle || undefined,
      chapter: entry.chapter || undefined,
      prompt: entry.prompt || undefined,
    })
    dirtyRef.current = false
    setSaveState('idle')
  }

  const startNew = () => {
    setSelectedId(null)
    setDraft({ title: '', body: '', kind: 'free', tags: '', favourite: false })
    setLinks({})
    dirtyRef.current = false
    setSaveState('idle')
  }

  const payload = useCallback(
    (isDraft) => ({
      title: draft.title,
      body: draft.body,
      kind: draft.kind,
      favourite: draft.favourite,
      is_draft: isDraft,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      passage: links.passage || null,
      principle: links.principle || null,
      chapter: links.chapter || null,
      prompt: links.prompt || null,
    }),
    [draft, links]
  )

  // Autosave 1.5s after typing stops.
  const debouncedBody = useDebounce(draft.body, 1500)
  useEffect(() => {
    if (!dirtyRef.current || !authed || !debouncedBody.trim()) return
    setSaveState('saving')
    const finish = { onSuccess: () => setSaveState('saved'), onError: () => setSaveState('idle') }
    if (selectedId) {
      updateEntry.mutate({ id: selectedId, ...payload(false) }, finish)
    } else {
      createEntry.mutate(payload(true), {
        ...finish,
        onSuccess: (created) => {
          setSelectedId(created.id)
          setSaveState('saved')
        },
      })
    }
    dirtyRef.current = false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedBody])

  const saveNow = () => {
    if (!draft.body.trim()) return
    setSaveState('saving')
    if (selectedId) {
      updateEntry.mutate({ id: selectedId, ...payload(false) }, { onSuccess: () => setSaveState('saved') })
    } else {
      createEntry.mutate(payload(false), {
        onSuccess: (created) => {
          setSelectedId(created.id)
          setSaveState('saved')
        },
      })
    }
  }

  const activePrompt = useMemo(
    () => (links.prompt ? prompts?.find((prompt) => prompt.id === links.prompt) : null),
    [links.prompt, prompts]
  )

  if (!authed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          title="The journal is private"
          body="Reflections belong to their author. Create a free account and your journal will follow you between devices — visible to no one else."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b hairline pb-5">
        <div>
          <h1 className="font-display font-light text-3xl text-parchment-100">Reflection Journal</h1>
          <p className="editorial-body mt-1 text-parchment-500">Private writing, linked to what prompted it.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              exportAll.mutate(undefined, {
                onSuccess: (result) => downloadJson(result, 'kybalion-journal.json'),
              })
            }
          >
            <Download size={13} aria-hidden="true" /> Export all
          </Button>
          <Button size="sm" onClick={startNew}>
            <Plus size={13} aria-hidden="true" /> New entry
          </Button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,20rem)_1fr] gap-10">
        {/* Entry list */}
        <aside>
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search entries…"
            aria-label="Search journal entries"
            className="w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 font-sans text-sm text-parchment-200 placeholder:text-parchment-600"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterKind('')}
              className={cn(
                'rounded-sm px-2 py-1 font-sans text-[0.6875rem]',
                !filterKind ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500 hover:text-parchment-300'
              )}
            >
              All
            </button>
            {KINDS.map((kind) => (
              <button
                key={kind.key}
                type="button"
                onClick={() => setFilterKind(kind.key === filterKind ? '' : kind.key)}
                className={cn(
                  'rounded-sm px-2 py-1 font-sans text-[0.6875rem]',
                  filterKind === kind.key ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500 hover:text-parchment-300'
                )}
              >
                {kind.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={filterFavourite}
              onClick={() => setFilterFavourite((value) => !value)}
              className={cn(
                'rounded-sm px-2 py-1 font-sans text-[0.6875rem] inline-flex items-center gap-1',
                filterFavourite ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500 hover:text-parchment-300'
              )}
            >
              <Star size={10} aria-hidden="true" /> Favourites
            </button>
          </div>

          <ul data-lenis-prevent className="mt-4 space-y-1 max-h-[32rem] overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => loadEntry(entry)}
                  className={cn(
                    'w-full text-left rounded-sm px-3 py-3 transition-colors',
                    selectedId === entry.id ? 'bg-gold-500/[0.08]' : 'hover:bg-ink-800/60'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-serif text-sm text-parchment-100 truncate">
                      {entry.title || truncate(entry.body, 40) || 'Untitled'}
                    </span>
                    {entry.favourite && <Star size={11} className="text-gold-400 shrink-0" aria-label="Favourite" />}
                    {entry.is_draft && (
                      <span className="font-sans text-[0.625rem] uppercase tracking-wide text-parchment-500 border border-ink-600 rounded-sm px-1 shrink-0">
                        draft
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block font-sans text-[0.6875rem] text-parchment-500">
                    {KINDS.find((kind) => kind.key === entry.kind)?.label} · {formatDate(entry.updated_at)}
                  </span>
                </button>
              </li>
            ))}
            {entries.length === 0 && (
              <li className="editorial-body text-parchment-500 text-sm px-3 py-6">
                Nothing written yet. The first entry is the hardest — and the shortest ones count.
              </li>
            )}
          </ul>
        </aside>

        {/* Editor */}
        <section aria-label="Journal editor">
          {activePrompt && (
            <blockquote className="mb-5 border-l-2 border-gold-600/60 pl-4 font-serif italic text-parchment-200">
              {activePrompt.prompt}
            </blockquote>
          )}
          {(links.passage || links.principle || links.chapter) && (
            <p className="mb-4 font-sans text-xs text-parchment-500">
              Linked to{' '}
              {links.passage && <span className="text-gold-300">passage “{links.passage}” </span>}
              {links.principle && (
                <Link to={`/principles/${links.principle}`} className="text-gold-300 underline decoration-dotted">
                  {links.principle}
                </Link>
              )}
              {links.chapter && <span className="text-gold-300"> chapter {links.chapter}</span>}
            </p>
          )}

          <input
            type="text"
            value={draft.title}
            onChange={(event) => {
              setDraft((current) => ({ ...current, title: event.target.value }))
              dirtyRef.current = true
            }}
            placeholder="Title (optional)"
            aria-label="Entry title"
            className="w-full bg-transparent border-b hairline focus:border-gold-600 pb-2 font-display text-2xl text-parchment-100 placeholder:text-parchment-600 outline-none"
          />
          <textarea
            value={draft.body}
            onChange={(event) => {
              setDraft((current) => ({ ...current, body: event.target.value }))
              dirtyRef.current = true
              setSaveState('idle')
            }}
            rows={14}
            placeholder="Write freely. Markdown-lite: *italic* and **bold**."
            aria-label="Entry body"
            className="mt-5 w-full bg-ink-900/60 border border-ink-600 focus:border-gold-600 rounded-sm p-4 font-serif text-[1.0625rem] leading-relaxed text-parchment-100 placeholder:text-parchment-600"
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="caps-label text-parchment-500">Kind</span>
              <select
                value={draft.kind}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, kind: event.target.value }))
                  dirtyRef.current = true
                }}
                className="mt-1.5 w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 font-sans text-sm text-parchment-200"
              >
                {KINDS.map((kind) => (
                  <option key={kind.key} value={kind.key}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="caps-label text-parchment-500">Tags</span>
              <input
                type="text"
                value={draft.tags}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, tags: event.target.value }))
                  dirtyRef.current = true
                }}
                placeholder="comma, separated"
                className="mt-1.5 w-full bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 font-sans text-sm text-parchment-200 placeholder:text-parchment-600"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={saveNow} disabled={!draft.body.trim()}>
              {selectedId ? 'Save entry' : 'Create entry'}
            </Button>
            <IconButton
              label={draft.favourite ? 'Remove from favourites' : 'Mark as favourite'}
              active={draft.favourite}
              onClick={() => {
                setDraft((current) => ({ ...current, favourite: !current.favourite }))
                dirtyRef.current = true
              }}
            >
              <Star size={16} fill={draft.favourite ? 'currentColor' : 'none'} />
            </IconButton>
            {selected && (
              <>
                <IconButton
                  label="Export this entry"
                  onClick={() => downloadJson(selected, `kybalion-entry-${selected.id}.json`)}
                >
                  <Download size={16} />
                </IconButton>
                <IconButton label="Delete this entry" onClick={() => setDeleteTarget(selected)}>
                  <Trash2 size={16} />
                </IconButton>
              </>
            )}
            <span className="ml-auto font-sans text-xs text-parchment-500" aria-live="polite">
              {saveState === 'saving' && 'Saving…'}
              {saveState === 'saved' && 'Saved'}
              {saveState === 'idle' && draft.body && !selectedId && 'Autosaves as a draft while you write'}
            </span>
          </div>
        </section>
      </div>

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete entry">
        <p className="editorial-body">
          Delete “{deleteTarget?.title || truncate(deleteTarget?.body || '', 40) || 'Untitled'}”? This
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() =>
              deleteEntry.mutate(deleteTarget.id, {
                onSuccess: () => {
                  setDeleteTarget(null)
                  if (selectedId === deleteTarget.id) startNew()
                },
              })
            }
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
