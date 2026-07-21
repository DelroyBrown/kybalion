import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useExportData } from '../api/auth'
import { useResetProgress, useSavePreferences } from '../api/userData'
import { Button } from '../components/common/Button'
import { ReaderControls } from '../components/reader/ReaderControls'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BOOKS, BOOK_ORDER, useAppStore } from '../stores/appStore'
import { useAuthStore } from '../stores/authStore'
import { useReaderStore } from '../stores/readerStore'
import { cn } from '../utils/cn'

export function SettingsPage() {
  useDocumentTitle('Settings')
  const authed = useAuthStore((state) => Boolean(state.access))
  const settings = useReaderStore((state) => state.settings)
  const setSetting = useReaderStore((state) => state.setSetting)
  const savePreferences = useSavePreferences()
  const exportData = useExportData()
  const resetProgress = useResetProgress()
  const [controlsOpen, setControlsOpen] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const activeBookSlug = useAppStore((state) => state.activeBookSlug)
  const setActiveBook = useAppStore((state) => state.setActiveBook)
  const colorMode = useAppStore((state) => state.colorMode)
  const setColorMode = useAppStore((state) => state.setColorMode)

  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="font-display font-light text-3xl text-parchment-100">Settings</h1>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="caps-label text-gold-400">Appearance</h2>
          <p className="editorial-body mt-2 text-parchment-400">
            The whole interface follows one of two lights, and each book keeps its own colours.
          </p>
          <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Colour mode">
            {[
              { key: 'dark', label: 'Dark' },
              { key: 'light', label: 'Light' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                role="radio"
                aria-checked={colorMode === option.key}
                onClick={() => setColorMode(option.key)}
                className={cn(
                  'flex-1 border rounded-sm px-2 py-2.5 font-sans text-sm transition-colors',
                  colorMode === option.key
                    ? 'border-gold-500 text-gold-200 bg-gold-500/[0.06]'
                    : 'border-ink-500 text-parchment-400 hover:border-ink-400'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Open book">
            {BOOK_ORDER.map((slug) => (
              <button
                key={slug}
                type="button"
                role="radio"
                aria-checked={activeBookSlug === slug}
                onClick={() => setActiveBook(slug)}
                className={cn(
                  'flex-1 border rounded-sm px-2 py-2.5 font-sans text-sm transition-colors',
                  activeBookSlug === slug
                    ? 'border-gold-500 text-gold-200 bg-gold-500/[0.06]'
                    : 'border-ink-500 text-parchment-400 hover:border-ink-400'
                )}
              >
                {BOOKS[slug].title}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="caps-label text-gold-400">Reading</h2>
          <p className="editorial-body mt-2 text-parchment-400">
            Typeface size, spacing, width, theme, and reading mode — the same controls available
            inside the reader.
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setControlsOpen(true)}>
            Open reading settings
          </Button>
        </section>

        <section>
          <h2 className="caps-label text-gold-400">Reading position</h2>
          <p className="editorial-body mt-2 text-parchment-400">
            The reader remembers where you stopped in every chapter and returns you there.
            Clearing it starts the whole library over: “Continue reading” offers the first
            chapter again and each book opens at its beginning.
            {authed
              ? ' This clears your saved positions on every device. Time spent reading is kept.'
              : ' This clears the positions saved on this device.'}
          </p>
          {resetProgress.isSuccess && !confirmingReset ? (
            <p className="mt-4 font-sans text-sm text-gold-300" role="status">
              Your reading positions have been cleared.
            </p>
          ) : confirmingReset ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                variant="danger"
                onClick={() => {
                  resetProgress.mutate()
                  setConfirmingReset(false)
                }}
                disabled={resetProgress.isPending}
              >
                {resetProgress.isPending ? 'Clearing…' : 'Yes, forget my place'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingReset(false)}>
                Keep it
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                resetProgress.reset()
                setConfirmingReset(true)
              }}
            >
              Reset reading position
            </Button>
          )}
          {resetProgress.isError && (
            <p className="mt-3 font-sans text-sm text-crimson-300" role="alert">
              The positions could not be cleared. Please try again.
            </p>
          )}
        </section>

        <section>
          <h2 className="caps-label text-gold-400">Atmosphere & motion</h2>
          <div className="mt-4 space-y-3">
            {[
              { key: 'ambientEffects', label: 'Ambient background effects', hint: 'Drifting dust and dim light pools behind the interface.' },
              { key: 'reduceMotion', label: 'Reduce motion', hint: 'Minimises animation everywhere — smooth scrolling, scroll reveals, and visualisations.' },
              { key: 'showStreak', label: 'Show reading streak', hint: 'An understated count of consecutive reading days. Off by default.' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                role="switch"
                aria-checked={settings[option.key]}
                onClick={() => {
                  const next = !settings[option.key]
                  setSetting(option.key, next)
                  if (authed) savePreferences.mutate({ ...settings, [option.key]: next })
                }}
                className="flex w-full items-center justify-between border hairline rounded-sm px-4 py-3 text-left hover:border-gold-600/50 transition-colors"
              >
                <span>
                  <span className="font-sans text-sm text-parchment-200 block">{option.label}</span>
                  <span className="font-sans text-xs text-parchment-500">{option.hint}</span>
                </span>
                <span
                  className={`relative h-5 w-9 rounded-full transition-colors shrink-0 ml-4 ${settings[option.key] ? 'bg-gold-600' : 'bg-ink-600'}`}
                  aria-hidden="true"
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-parchment-100 transition-transform ${settings[option.key] ? 'translate-x-4' : 'translate-x-0.5'}`}
                  />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="caps-label text-gold-400">Your data</h2>
          {authed ? (
            <div className="mt-4 space-y-3">
              <p className="editorial-body text-parchment-400">
                Export everything you have created — notes, highlights, bookmarks, journal, and
                progress — as a single JSON file. Account management (including deletion) lives on
                your <Link to="/profile" className="text-gold-300 underline decoration-dotted">profile</Link>.
              </p>
              <Button variant="outline" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
                {exportData.isPending ? 'Preparing…' : 'Export my data'}
              </Button>
            </div>
          ) : (
            <p className="editorial-body mt-3 text-parchment-400">
              Reading settings and progress are stored on this device. With an account they sync —
              and can be exported or deleted at any time.
            </p>
          )}
        </section>

        <section>
          <h2 className="caps-label text-gold-400">Privacy</h2>
          <p className="editorial-body mt-3 text-parchment-400">
            Notes, highlights, bookmarks, and journal entries are private to your account and never
            shown to other readers. The application uses no third-party analytics. AI-generated
            commentary, where present, is labelled with its model and review status and is never
            mixed into the original text.
          </p>
        </section>
      </div>

      <ReaderControls open={controlsOpen} onClose={() => setControlsOpen(false)} />
    </div>
  )
}
