import { cn } from '../../utils/cn'

export function Tag({ children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-ink-500 px-2 py-0.5',
        'font-sans text-[0.6875rem] tracking-wide text-parchment-400',
        className
      )}
    >
      {children}
    </span>
  )
}
