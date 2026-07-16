import { useBook } from '../api/library'
import { Reveal } from '../components/common/Reveal'
import { TextSkeleton } from '../components/common/states'
import { Sigil } from '../components/common/Sigil'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function AboutPage() {
  useDocumentTitle('About the Text')
  const { data: book, isLoading } = useBook()

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12 lg:py-16">
      <header className="text-center">
        <Sigil size={64} className="text-gold-500 mx-auto" />
        <h1 className="mt-6 font-display font-light text-3xl text-parchment-100">About the Text</h1>
      </header>

      {isLoading ? (
        <div className="mt-10">
          <TextSkeleton lines={8} />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <Reveal>
          <section>
            <h2 className="caps-label text-gold-400">The book</h2>
            <p className="editorial-body mt-3">{book?.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 font-sans text-sm">
              <dt className="text-parchment-500">Title</dt>
              <dd className="text-parchment-200 italic font-serif">{book?.title}</dd>
              <dt className="text-parchment-500">Attributed to</dt>
              <dd className="text-parchment-200">{book?.author_attribution}</dd>
              <dt className="text-parchment-500">First published</dt>
              <dd className="text-parchment-200">{book?.published_year}</dd>
              <dt className="text-parchment-500">Copyright status</dt>
              <dd className="text-parchment-200">
                {book?.is_public_domain ? 'Public domain' : 'See edition notes'}
              </dd>
            </dl>
          </section>

          <section>
            <h2 className="caps-label text-gold-400">Editions & sources</h2>
            {book?.editions?.map((edition) => (
              <div key={edition.slug} className="mt-3 border hairline rounded-sm p-5">
                <p className="font-sans text-sm text-parchment-200">{edition.name}</p>
                {edition.license_note && (
                  <p className="font-sans text-xs text-parchment-500 mt-1">{edition.license_note}</p>
                )}
                {edition.source_notes && (
                  <p className="editorial-body mt-3 text-parchment-400 text-sm">{edition.source_notes}</p>
                )}
              </div>
            ))}
          </section>
          </Reveal>

          <Reveal>
          <section>
            <h2 className="caps-label text-gold-400">What is original, what is added</h2>
            <p className="editorial-body mt-3">
              The original 1908 text is always set in serif type on the reading surface. Everything
              else — plain-English explanations, interpretations, definitions, examples, and
              visualisations — is modern editorial material, visibly separated and labelled by
              type. Machine-generated commentary, where present, carries an explicit “AI” label
              with its model and review status. Nothing modern is ever mixed into the original
              text.
            </p>
            <p className="editorial-body mt-3">
              The reading text of chapters I–XV is loaded verbatim from the public-domain Project
              Gutenberg transcription of the 1908 edition. Should any paragraph ever carry a{' '}
              <span className="text-gold-300">placeholder</span> badge, it means that passage is
              awaiting verified text and is not a quotation.
            </p>
          </section>
          </Reveal>

          <Reveal>
          <section>
            <h2 className="caps-label text-gold-400">A note on interpretation</h2>
            <p className="editorial-body mt-3">
              This edition treats The Kybalion as a historical philosophical document worth
              studying, questioning, and testing against experience — not as unquestionable truth.
              The commentary deliberately includes sceptical readings and common criticisms
              alongside sympathetic ones, and makes no medical, scientific, or financial claims on
              the text's behalf.
            </p>
          </section>
          </Reveal>
        </div>
      )}
    </div>
  )
}
