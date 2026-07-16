import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Trash2 } from 'lucide-react'

import { useBookmarks, useDeleteBookmark } from '../api/userData'
import { IconButton } from '../components/common/Button'
import { EmptyState } from '../components/common/states'
import { Tag } from '../components/common/Tag'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import { formatDate } from '../utils/format'

const KIND_LABELS = {
  chapter: 'Chapter',
  section: 'Section',
  paragraph: 'Paragraph',
  passage: 'Passage',
  annotation: 'Annotation',
  principle: 'Principle',
  visualisation: 'Visualisation',
}

export function bookmarkRoute(bookmark) {
  switch (bookmark.kind) {
    case 'principle':
    case 'visualisation':
      return `/principles/${bookmark.object_id}`
    case 'passage':
      return bookmark.chapter_slug
        ? `/read/${bookmark.chapter_slug}?passage=${bookmark.object_id}`
        : '/read'
    default:
      return bookmark.chapter_slug ? `/read/${bookmark.chapter_slug}` : '/read'
  }
}

export function BookmarksPage() {
  useDocumentTitle('Bookmarks')
  const authed = useAuthStore((state) => Boolean(state.access))
  const [kind, setKind] = useState('')
  const [searchText, setSearchText] = useState('')
  const [ordering, setOrdering] = useState('-created_at')

  const params = { ordering }
  if (kind) params.kind = kind
  const { data } = useBookmarks(authed ? params : undefined)
  const deleteBookmark = useDeleteBookmark()

  const bookmarks = useMemo(() => {
    const list = data?.results || []
    const query = searchText.trim().toLowerCase()
    if (!query) return list
    return list.filter((bookmark) =>
      [bookmark.title, bookmark.note, bookmark.label, bookmark.object_id]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    )
  }, [data, searchText])

  if (!authed) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <EmptyState
          title="Bookmarks need a shelf"
          body="Sign in and anything you mark — chapters, passages, principles — will wait for you here, on every device."
          actionLabel="Sign in"
          actionTo="/login"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100">Bookmarks</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search bookmarks…"
          aria-label="Search bookmarks"
          className="bg-ink-900 border border-ink-600 rounded-sm px-3 py-2 font-sans text-sm text-parchment-200 placeholder:text-parchment-600 w-52"
        />
        <button
          type="button"
          onClick={() => setKind('')}
          className={cn(
            'rounded-sm px-2.5 py-1.5 font-sans text-xs',
            !kind ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500 hover:text-parchment-300'
          )}
        >
          All
        </button>
        {Object.entries(KIND_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setKind(key === kind ? '' : key)}
            className={cn(
              'rounded-sm px-2.5 py-1.5 font-sans text-xs',
              kind === key ? 'bg-gold-500/15 text-gold-200' : 'text-parchment-500 hover:text-parchment-300'
            )}
          >
            {label}s
          </button>
        ))}
        <select
          value={ordering}
          onChange={(event) => setOrdering(event.target.value)}
          aria-label="Sort bookmarks"
          className="ml-auto bg-ink-900 border border-ink-600 rounded-sm px-2 py-1.5 font-sans text-xs text-parchment-300"
        >
          <option value="-created_at">Newest first</option>
          <option value="created_at">Oldest first</option>
          <option value="title">By title</option>
        </select>
      </div>

      <ul className="mt-8 space-y-3">
        {bookmarks.map((bookmark) => (
          <li key={bookmark.id} className="group border hairline rounded-sm p-4 hover:border-gold-600/50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="caps-label text-parchment-500">
                  {KIND_LABELS[bookmark.kind]} {bookmark.label && `· ${bookmark.label}`}
                </span>
                <Link to={bookmarkRoute(bookmark)} className="mt-1 block font-serif text-lg text-parchment-100 hover:text-gold-200">
                  {bookmark.title || bookmark.object_id}
                </Link>
                {bookmark.note && <p className="editorial-body mt-1.5 text-sm text-parchment-400">{bookmark.note}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(bookmark.tags || []).map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                  <span className="font-sans text-[0.6875rem] text-parchment-500">
                    Saved {formatDate(bookmark.created_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center shrink-0">
                <Link
                  to={bookmarkRoute(bookmark)}
                  className="p-2 text-parchment-500 hover:text-gold-300"
                  aria-label="Open original location"
                >
                  <ArrowUpRight size={16} />
                </Link>
                <IconButton label="Remove bookmark" onClick={() => deleteBookmark.mutate(bookmark.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {bookmarks.length === 0 && (
        <EmptyState
          title="Nothing marked yet"
          body="While reading, the bookmark control in the header saves the chapter; inside any annotation you can bookmark the passage itself."
          actionLabel="Open the book"
          actionTo="/read"
        />
      )}
    </div>
  )
}
