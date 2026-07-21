import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X } from 'lucide-react'

import { useBook } from '../api/library'
import { useClearRecentSearches, useRecentSearches, useSearch } from '../api/search'
import { EmptyState, ErrorState, TextSkeleton } from '../components/common/states'
import { useDebounce } from '../hooks/useDebounce'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import { toRoman } from '../utils/format'

const GROUPS = [
  { key: 'passages', label: 'In the text' },
  { key: 'chapters', label: 'Chapters' },
  { key: 'principles', label: 'Principles' },
  { key: 'annotations', label: 'Commentary' },
  { key: 'definitions', label: 'Definitions' },
  { key: 'notes', label: 'My notes' },
  { key: 'journal', label: 'My journal' },
  { key: 'highlights', label: 'My highlights' },
  { key: 'bookmarks', label: 'My bookmarks' },
]

const LOCAL_RECENTS_KEY = 'kybalion-recent-searches'

/** Wrap query matches in <mark> without HTML injection. */
function Highlighted({ text, query }) {
  if (!text) return null
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-gold-500/25 text-gold-100 rounded-[2px] px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function resultRoute(item) {
  switch (item.type) {
    case 'passage':
      return `/read/${item.chapter.slug}`
    case 'chapter':
      return `/read/${item.slug}`
    case 'principle':
      return `/principles/${item.slug}`
    case 'annotation':
      return `/read/${item.chapter.slug}?passage=${item.passage_slug}`
    case 'definition':
      return '/search'
    case 'note':
      return item.chapter_slug ? `/read/${item.chapter_slug}` : '/journal'
    case 'journal':
      return '/journal'
    case 'highlight':
      return `/read/${item.chapter.slug}`
    case 'bookmark':
      return item.chapter_slug ? `/read/${item.chapter_slug}` : '/bookmarks'
    default:
      return '/search'
  }
}

export function SearchPage() {
  useDocumentTitle('Search')
  const [searchParams, setSearchParams] = useSearchParams()
  const [input, setInput] = useState(searchParams.get('q') || '')
  const [activeTypes, setActiveTypes] = useState([])
  const [chapter, setChapter] = useState('')
  const [exact, setExact] = useState(false)
  const query = useDebounce(input.trim(), 300)

  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: book } = useBook()
  const activeBookSlug = useAppStore((state) => state.activeBookSlug)
  const { data, isFetching, isError, error, refetch } = useSearch({
    query,
    types: activeTypes,
    book: activeBookSlug,
    chapter: chapter || undefined,
    exact,
  })
  const { data: serverRecents } = useRecentSearches()
  const clearRecents = useClearRecentSearches()
  const [localRecents, setLocalRecents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_RECENTS_KEY) || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    if (query) setSearchParams({ q: query }, { replace: true })
  }, [query, setSearchParams])

  // Keep a small local history for anonymous readers.
  useEffect(() => {
    if (!query || authed) return
    setLocalRecents((current) => {
      const next = [query, ...current.filter((item) => item !== query)].slice(0, 8)
      localStorage.setItem(LOCAL_RECENTS_KEY, JSON.stringify(next))
      return next
    })
  }, [query, authed])

  const recents = authed ? (serverRecents || []).map((r) => r.query) : localRecents
  const results = data?.results || {}
  // Principles and their glossary belong to the Kybalion's study layer.
  const hermetic = activeBookSlug === 'the-kybalion'
  const visibleGroups = useMemo(
    () =>
      GROUPS.filter(
        (group) =>
          (results[group.key] || []).length > 0 &&
          (hermetic || !['principles', 'definitions'].includes(group.key))
      ),
    [results, hermetic]
  )

  const toggleType = (key) =>
    setActiveTypes((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    )

  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100 text-center">Search the archive</h1>

      {/* The field */}
      <div className="relative mt-8">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-parchment-500" aria-hidden="true" />
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="A word, a phrase, a principle…"
          aria-label="Search the text, commentary, and your own writing"
          autoFocus
          className="w-full bg-ink-900 border border-ink-600 focus:border-gold-600 rounded-sm pl-12 pr-10 py-4 font-serif text-lg text-parchment-100 placeholder:text-parchment-600"
        />
        {input && (
          <button
            type="button"
            onClick={() => setInput('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-parchment-500 hover:text-parchment-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {GROUPS.filter((g) => authed || !['notes', 'journal', 'highlights', 'bookmarks'].includes(g.key)).map((group) => (
          <button
            key={group.key}
            type="button"
            aria-pressed={activeTypes.includes(group.key)}
            onClick={() => toggleType(group.key)}
            className={cn(
              'rounded-sm border px-2.5 py-1 font-sans text-xs transition-colors',
              activeTypes.includes(group.key)
                ? 'border-gold-500 text-gold-200 bg-gold-500/10'
                : 'border-ink-600 text-parchment-500 hover:text-parchment-300'
            )}
          >
            {group.label}
          </button>
        ))}
        <select
          value={chapter}
          onChange={(event) => setChapter(event.target.value)}
          aria-label="Filter by chapter"
          className="ml-auto bg-ink-900 border border-ink-600 rounded-sm px-2 py-1.5 font-sans text-xs text-parchment-300"
        >
          <option value="">All chapters</option>
          {(book?.chapters || []).map((entry) => (
            <option key={entry.slug} value={entry.slug}>
              {toRoman(entry.number)}. {entry.title}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 font-sans text-xs text-parchment-400">
          <input type="checkbox" checked={exact} onChange={(event) => setExact(event.target.checked)} className="accent-[#bfa05d]" />
          Exact phrase
        </label>
      </div>

      {/* Recent searches */}
      {!query && recents.length > 0 && (
        <div className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="caps-label text-parchment-500">Recent searches</h2>
            <button
              type="button"
              onClick={() => {
                if (authed) clearRecents.mutate()
                else {
                  localStorage.removeItem(LOCAL_RECENTS_KEY)
                  setLocalRecents([])
                }
              }}
              className="font-sans text-xs text-parchment-500 hover:text-parchment-300"
            >
              Clear history
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recents.map((recent) => (
              <button
                key={recent}
                type="button"
                onClick={() => setInput(recent)}
                className="border border-ink-600 hover:border-gold-600 rounded-sm px-3 py-1.5 font-serif text-sm text-parchment-300"
              >
                {recent}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-10" aria-live="polite">
        {isFetching && !data && <TextSkeleton lines={6} />}
        {isError && <ErrorState title="The search could not be completed" error={error} onRetry={refetch} />}

        {data && query && (
          <>
            <p className="font-sans text-xs text-parchment-500">
              {data.total} result{data.total === 1 ? '' : 's'} for “{data.query}”
            </p>
            {data.total === 0 && (
              <EmptyState
                title="Nothing answered to that phrase"
                body="Try fewer words, a different spelling, or search the commentary as well as the text."
              />
            )}
            <div className="mt-6 space-y-10">
              {visibleGroups.map((group) => (
                <section key={group.key} aria-labelledby={`group-${group.key}`}>
                  <h2 id={`group-${group.key}`} className="caps-label text-gold-400 border-b hairline pb-2">
                    {group.label}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {results[group.key].map((item, index) => (
                      <li key={index}>
                        <Link
                          to={resultRoute(item)}
                          className="group block rounded-sm px-3 py-2.5 -mx-3 hover:bg-ink-800/50 transition-colors"
                        >
                          <span className="flex items-center gap-2 font-sans text-xs text-parchment-500">
                            <span className="border border-ink-600 rounded-sm px-1.5 py-0.5 uppercase tracking-wide text-[0.625rem]">
                              {item.type}
                            </span>
                            {item.chapter && (
                              <span>
                                Chapter {toRoman(item.chapter.number)} · {item.chapter.title}
                              </span>
                            )}
                            {item.term && <span className="font-serif text-parchment-300">{item.term}</span>}
                            {item.title && item.type !== 'chapter' && <span>{item.title}</span>}
                            {item.type === 'chapter' && (
                              <span className="font-serif text-parchment-200">
                                {toRoman(item.number)}. {item.title}
                              </span>
                            )}
                            {item.name && <span className="font-serif text-parchment-200">{item.name}</span>}
                            {item.is_placeholder && (
                              <span className="text-[0.625rem] uppercase tracking-wide border border-ink-600 rounded-sm px-1">
                                placeholder
                              </span>
                            )}
                          </span>
                          {item.snippet && (
                            <span className="mt-1 block font-serif text-[0.9375rem] text-parchment-200 leading-relaxed">
                              <Highlighted text={item.snippet} query={query} />
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </>
        )}

        {!query && recents.length === 0 && (
          <EmptyState
            title="The index is ready"
            body="Search the original text, the commentary, the definitions — and, once signed in, your own notes and journal."
          />
        )}
      </div>
    </div>
  )
}
