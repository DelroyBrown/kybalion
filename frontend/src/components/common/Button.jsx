import { cn } from '../../utils/cn'

const VARIANTS = {
  primary:
    'border border-gold-600/70 bg-gold-500/10 text-gold-200 hover:bg-gold-500/20 hover:border-gold-500',
  ghost:
    'border border-transparent text-parchment-300 hover:text-parchment-100 hover:bg-ink-700/60',
  outline:
    'border border-ink-500 text-parchment-200 hover:border-gold-600 hover:text-gold-200',
  danger:
    'border border-crimson-500/60 text-crimson-300 hover:bg-crimson-600/20',
}

export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-sans transition-colors duration-200 rounded-sm',
        'disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'px-3 py-1.5 text-xs tracking-caps uppercase' : 'px-5 py-2.5 text-[0.8125rem] tracking-caps uppercase',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}

export function IconButton({ label, className, children, active = false, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-sm p-2 transition-colors duration-200',
        'min-w-[2.5rem] min-h-[2.5rem]',
        active
          ? 'text-gold-300 bg-gold-500/10'
          : 'text-parchment-400 hover:text-parchment-100 hover:bg-ink-700/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
