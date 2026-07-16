import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Feather } from 'lucide-react'

import { usePrinciple, usePrinciples } from '../api/principles'
import { useCreateNote, useDeleteNote, useNotes } from '../api/userData'
import { Reveal } from '../components/common/Reveal'
import { ErrorState, LoadingVeil } from '../components/common/states'
import { PrincipleSymbol } from '../components/principles/PrincipleSymbol'
import { VisualisationFrame } from '../components/visualisations/VisualisationFrame'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuthStore } from '../stores/authStore'
import { accent } from '../utils/accents'
import { formatDate, toRoman, truncate } from '../utils/format'
import { renderMarkdownLite } from '../utils/markdownLite'

function SectionHeading({ children }) {
  return <h2 className="caps-label text-gold-400">{children}</h2>
}

function PrincipleNotes({ principle }) {
  const authed = useAuthStore((state) => Boolean(state.access))
  const { data: notes } = useNotes(authed ? { kind: 'principle', object_id: principle.slug } : undefined)
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const [draft, setDraft] = useState('')

  if (!authed) {
    return (
      <p className="editorial-body text-parchment-500">
        <Link to="/login" className="text-gold-300 underline decoration-dotted">Sign in</Link> to keep
        private study notes on this principle.
      </p>
    )
  }
  return (
    <div>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={3}
        placeholder={`Your working understanding of ${principle.name.toLowerCase()}…`}
        aria-label="New note on this principle"
        className="w-full bg-ink-900 border border-ink-600 rounded-sm p-3 font-serif text-sm text-parchment-100 placeholder:text-parchment-600 focus:border-gold-600"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={!draft.trim() || createNote.isPending}
          onClick={() =>
            createNote.mutate(
              {
                kind: 'principle',
                object_id: principle.slug,
                label: principle.name,
                body: draft.trim(),
                linked_principle: principle.slug,
              },
              { onSuccess: () => setDraft('') }
            )
          }
          className="font-sans text-xs tracking-caps uppercase text-gold-300 hover:text-gold-200 disabled:opacity-40"
        >
          Save note
        </button>
      </div>
      <ul className="mt-4 space-y-4">
        {(notes?.results || []).map((note) => (
          <li key={note.id} className="border-l border-gold-600/40 pl-3">
            <div className="editorial-body text-sm">{renderMarkdownLite(note.body)}</div>
            <div className="mt-1 flex gap-3 font-sans text-[0.6875rem] text-parchment-500">
              <span>{formatDate(note.updated_at)} · private</span>
              <button type="button" onClick={() => deleteNote.mutate(note.id)} className="text-crimson-300">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PrincipleDetailPage() {
  const { slug } = useParams()
  const { data: principle, isLoading, isError, error, refetch } = usePrinciple(slug)
  const { data: allPrinciples } = usePrinciples()
  useDocumentTitle(principle?.name)

  if (isLoading) return <LoadingVeil label="Opening the principle" />
  if (isError) return <ErrorState error={error} onRetry={refetch} />
  if (!principle) return null

  const tone = accent(principle.accent)
  const visualisation = principle.visualisations?.[0]
  const modernExamples = principle.examples.filter((e) => e.kind === 'modern')
  const practicalExamples = principle.examples.filter((e) => e.kind === 'practical')
  const index = allPrinciples?.findIndex((p) => p.slug === slug) ?? -1
  const previous = index > 0 ? allPrinciples[index - 1] : null
  const next = index >= 0 && index < (allPrinciples?.length || 0) - 1 ? allPrinciples[index + 1] : null

  return (
    <div className="relative">
      {/* Each principle carries its own dim atmosphere */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[26rem] -z-[1] pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${tone.hex}14, transparent 70%)` }}
      />

      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12 lg:py-16">
        <Link to="/principles" className="inline-flex items-center gap-1.5 font-sans text-xs text-parchment-500 hover:text-parchment-300">
          <ArrowLeft size={12} aria-hidden="true" /> All principles
        </Link>

        <header className="mt-8 text-center">
          <span className={`inline-block ${tone.text}`}>
            <PrincipleSymbol symbol={principle.symbol} size={72} />
          </span>
          <p className="caps-label text-parchment-500 mt-5">Principle {principle.number} of 7</p>
          <h1 className="mt-2 font-display font-light text-3xl sm:text-4xl text-parchment-100">
            {principle.name}
          </h1>
          <blockquote className="mt-7 font-serif italic text-xl sm:text-2xl leading-relaxed text-parchment-100 max-w-xl mx-auto">
            “{principle.aphorism}”
          </blockquote>
          <p className="mt-3 font-sans text-xs text-parchment-500">{principle.aphorism_source}</p>
        </header>

        <div className="mt-14 space-y-14">
          <Reveal>
          <section aria-labelledby={`plain-${slug}`}>
            <SectionHeading>In plain terms</SectionHeading>
            <p className="mt-3 font-serif text-lg leading-relaxed text-parchment-100">
              {principle.plain_explanation}
            </p>
          </section>
          </Reveal>

          <Reveal>
          <section aria-labelledby={`deep-${slug}`}>
            <SectionHeading>A fuller reading</SectionHeading>
            <p className="editorial-body mt-3">{principle.deep_interpretation}</p>
            {principle.editorial_note && (
              <div className="mt-5 border-l-2 pl-4" style={{ borderColor: tone.hex }}>
                <span className="caps-label text-parchment-500">Editorial note</span>
                <p className="editorial-body mt-1.5 text-parchment-400">{principle.editorial_note}</p>
              </div>
            )}
          </section>
          </Reveal>

          {visualisation && (
            <Reveal>
            <section aria-label="Interactive visualisation">
              <VisualisationFrame
                componentKey={visualisation.component_key}
                title={visualisation.title}
                description={visualisation.description}
                accentHex={tone.hex}
              />
            </section>
            </Reveal>
          )}

          {principle.passages?.length > 0 && (
            <Reveal>
            <section>
              <SectionHeading>In the text</SectionHeading>
              <ul className="mt-4 space-y-3">
                {principle.passages.map((passage) => (
                  <li key={passage.slug}>
                    <Link
                      to={`/read/${passage.chapter.slug}?passage=${passage.slug}`}
                      className="group lift block border hairline rounded-sm p-4 hover:border-gold-600/60"
                    >
                      <span className="font-serif italic text-parchment-200 leading-relaxed">
                        “{truncate(passage.excerpt, 160)}”
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 font-sans text-xs text-parchment-500 group-hover:text-gold-300">
                        Chapter {toRoman(passage.chapter.number)} · {passage.chapter.title}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            </Reveal>
          )}

          {(modernExamples.length > 0 || practicalExamples.length > 0) && (
            <Reveal>
            <section>
              <SectionHeading>Seen today</SectionHeading>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[...modernExamples, ...practicalExamples].map((example, i) => (
                  <div key={i} className="border hairline rounded-sm p-5">
                    <span className="caps-label text-parchment-500">
                      {example.kind === 'modern' ? 'Modern example' : 'Everyday practice'}
                    </span>
                    <h3 className="mt-2 font-display text-lg text-parchment-100">{example.title}</h3>
                    <p className="editorial-body mt-2">{example.body}</p>
                  </div>
                ))}
              </div>
            </section>
            </Reveal>
          )}

          {principle.misunderstandings?.length > 0 && (
            <Reveal>
            <section>
              <SectionHeading>Often misread as…</SectionHeading>
              <ul className="mt-4 space-y-4">
                {principle.misunderstandings.map((item, i) => (
                  <li key={i} className="border-l-2 border-crimson-500/50 pl-4">
                    <p className="font-serif italic text-parchment-200">“{item.claim}”</p>
                    <p className="editorial-body mt-1.5 text-parchment-400">{item.clarification}</p>
                  </li>
                ))}
              </ul>
            </section>
            </Reveal>
          )}

          {principle.relationships?.length > 0 && (
            <Reveal>
            <section>
              <SectionHeading>Among the seven</SectionHeading>
              <ul className="mt-4 space-y-3">
                {principle.relationships.map((relationship, i) => {
                  const other = relationship.principle
                  const otherTone = accent(other.accent)
                  return (
                    <li key={i}>
                      <Link
                        to={`/principles/${other.slug}`}
                        className="group flex items-start gap-4 border hairline rounded-sm p-4 hover:border-gold-600/60 transition-colors"
                      >
                        <span className={`${otherTone.text} mt-0.5 shrink-0`}>
                          <PrincipleSymbol symbol={other.symbol} size={26} />
                        </span>
                        <span>
                          <span className="font-sans text-sm text-parchment-100 group-hover:text-gold-200">
                            {other.name}
                            <span className="ml-2 font-sans text-[0.625rem] tracking-caps uppercase text-parchment-500">
                              {relationship.kind.replace('_', ' ')}
                            </span>
                          </span>
                          {relationship.description && (
                            <span className="editorial-body mt-1 block text-sm text-parchment-400">
                              {relationship.description}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
            </Reveal>
          )}

          {principle.reflection_prompts?.length > 0 && (
            <Reveal>
            <section>
              <SectionHeading>For reflection</SectionHeading>
              <ul className="mt-4 space-y-5">
                {principle.reflection_prompts.map((prompt) => (
                  <li key={prompt.id} className="text-center border hairline rounded-sm px-6 py-6">
                    <p className="font-serif italic text-lg text-parchment-100 leading-relaxed">
                      {prompt.prompt}
                    </p>
                    <Link
                      to={`/journal?kind=principle&principle=${principle.slug}&prompt=${prompt.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 font-sans text-xs text-gold-300 hover:text-gold-200"
                    >
                      <Feather size={12} aria-hidden="true" /> Write about this
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
            </Reveal>
          )}

          <Reveal>
          <section>
            <SectionHeading>Your notes</SectionHeading>
            <div className="mt-4">
              <PrincipleNotes principle={principle} />
            </div>
          </section>
          </Reveal>
        </div>

        <nav className="mt-16 flex justify-between border-t hairline pt-8" aria-label="Principle navigation">
          {previous ? (
            <Link to={`/principles/${previous.slug}`} className="group text-left">
              <span className="caps-label text-parchment-500 flex items-center gap-1.5">
                <ArrowLeft size={12} aria-hidden="true" /> Previous
              </span>
              <span className="mt-1 block font-serif text-parchment-200 group-hover:text-gold-200">
                {previous.name}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link to={`/principles/${next.slug}`} className="group text-right">
              <span className="caps-label text-parchment-500 flex items-center justify-end gap-1.5">
                Next <ArrowRight size={12} aria-hidden="true" />
              </span>
              <span className="mt-1 block font-serif text-parchment-200 group-hover:text-gold-200">
                {next.name}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </div>
  )
}
