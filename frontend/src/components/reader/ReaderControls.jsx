import { Minus, Plus } from 'lucide-react'

import { useSavePreferences } from '../../api/userData'
import { useAuthStore } from '../../stores/authStore'
import {
  DEFAULT_SETTINGS,
  READER_THEMES,
  READING_MODES,
  useReaderStore,
} from '../../stores/readerStore'
import { cn } from '../../utils/cn'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

const THEME_SWATCHES = {
  midnight: '#11141c',
  obsidian: '#0c0b0a',
  parchment: '#e9dfc9',
  sepia: '#221a10',
  crimson: '#170f10',
}

function SettingRow({ label, children }) {
  return (
    <div className="py-4 border-b hairline last:border-b-0">
      <span className="caps-label text-parchment-500 block mb-3">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-1 group"
    >
      <span className="font-sans text-sm text-parchment-300">{label}</span>
      <span
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-gold-600' : 'bg-ink-600'
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-parchment-100 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </span>
    </button>
  )
}

/** Reading preferences: type, layout, theme, mode, and motion. */
export function ReaderControls({ open, onClose }) {
  const { settings, setSetting, resetSettings } = useReaderStore()
  const authed = useAuthStore((state) => Boolean(state.access))
  const savePreferences = useSavePreferences()

  const close = () => {
    if (authed) savePreferences.mutate(settings)
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title="Reading settings">
      <SettingRow label="Text size">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Decrease text size"
            onClick={() => setSetting('fontScale', Math.max(0.85, Math.round((settings.fontScale - 0.05) * 100) / 100))}
            className="p-2 border border-ink-500 rounded-sm text-parchment-300 hover:border-gold-600"
          >
            <Minus size={14} />
          </button>
          <span className="font-serif text-parchment-200 w-16 text-center" style={{ fontSize: `${settings.fontScale}rem` }}>
            Aa
          </span>
          <button
            type="button"
            aria-label="Increase text size"
            onClick={() => setSetting('fontScale', Math.min(1.4, Math.round((settings.fontScale + 0.05) * 100) / 100))}
            className="p-2 border border-ink-500 rounded-sm text-parchment-300 hover:border-gold-600"
          >
            <Plus size={14} />
          </button>
          <span className="font-sans text-xs text-parchment-500 ml-auto">{Math.round(settings.fontScale * 100)}%</span>
        </div>
      </SettingRow>

      <SettingRow label="Line spacing">
        <div className="flex gap-2">
          {[
            { value: 1.6, label: 'Compact' },
            { value: 1.9, label: 'Comfortable' },
            { value: 2.2, label: 'Airy' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSetting('lineHeight', option.value)}
              className={cn(
                'flex-1 border rounded-sm px-2 py-2 font-sans text-xs transition-colors',
                settings.lineHeight === option.value
                  ? 'border-gold-500 text-gold-200'
                  : 'border-ink-500 text-parchment-400 hover:border-ink-400'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Column width">
        <div className="flex gap-2">
          {['narrow', 'comfortable', 'wide'].map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => setSetting('width', width)}
              className={cn(
                'flex-1 border rounded-sm px-2 py-2 font-sans text-xs capitalize transition-colors',
                settings.width === width
                  ? 'border-gold-500 text-gold-200'
                  : 'border-ink-500 text-parchment-400 hover:border-ink-400'
              )}
            >
              {width}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Theme">
        <div className="flex gap-3" role="radiogroup" aria-label="Reading theme">
          {READER_THEMES.map((theme) => (
            <button
              key={theme.key}
              type="button"
              role="radio"
              aria-checked={settings.theme === theme.key}
              aria-label={theme.label}
              title={theme.label}
              onClick={() => setSetting('theme', theme.key)}
              className={cn(
                'h-9 w-9 rounded-full border-2 transition-colors',
                settings.theme === theme.key ? 'border-gold-400' : 'border-ink-500 hover:border-ink-400'
              )}
              style={{ background: THEME_SWATCHES[theme.key] }}
            />
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Reading mode">
        <div className="space-y-1.5" role="radiogroup" aria-label="Reading mode">
          {READING_MODES.map((mode) => (
            <button
              key={mode.key}
              type="button"
              role="radio"
              aria-checked={settings.mode === mode.key}
              onClick={() => setSetting('mode', mode.key)}
              className={cn(
                'w-full text-left border rounded-sm px-3 py-2.5 transition-colors',
                settings.mode === mode.key
                  ? 'border-gold-500 bg-gold-500/[0.06]'
                  : 'border-ink-500 hover:border-ink-400'
              )}
            >
              <span className={cn('font-sans text-sm', settings.mode === mode.key ? 'text-gold-200' : 'text-parchment-200')}>
                {mode.label}
              </span>
              <span className="block font-sans text-xs text-parchment-500 mt-0.5">{mode.description}</span>
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow label="Display">
        <div className="space-y-2">
          <Toggle
            label="Paragraph numbers"
            checked={settings.showParagraphNumbers}
            onChange={(value) => setSetting('showParagraphNumbers', value)}
          />
          <Toggle
            label="Ambient effects"
            checked={settings.ambientEffects}
            onChange={(value) => setSetting('ambientEffects', value)}
          />
          <Toggle
            label="Reduce motion"
            checked={settings.reduceMotion}
            onChange={(value) => setSetting('reduceMotion', value)}
          />
        </div>
      </SettingRow>

      <div className="pt-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => resetSettings()}>
          Reset to defaults
        </Button>
        <span className="font-sans text-xs text-parchment-500">
          {authed ? 'Synced to your account' : 'Saved on this device'}
        </span>
      </div>
    </Modal>
  )
}

export { DEFAULT_SETTINGS }
