import { usePrefersReducedMotion } from '../../hooks/useMediaQuery'
import { useReaderStore } from '../../stores/readerStore'

/** True when the visualisation should hold still (system or user setting). */
export function useVizMotionAllowed() {
  const system = usePrefersReducedMotion()
  const user = useReaderStore((state) => state.settings.reduceMotion)
  return !system && !user
}

export function VizSlider({ id, label, hint, min, max, step, value, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-sans text-xs text-parchment-300">
          {label}
        </label>
        {hint && <span className="font-sans text-[0.6875rem] text-parchment-500">{hint}</span>}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-[#bfa05d]"
      />
    </div>
  )
}

export function VizButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-sm border border-gold-500 bg-gold-500/10 px-3 py-1.5 font-sans text-xs text-gold-200'
          : 'rounded-sm border border-ink-500 px-3 py-1.5 font-sans text-xs text-parchment-400 hover:border-ink-400 hover:text-parchment-200'
      }
    >
      {children}
    </button>
  )
}
